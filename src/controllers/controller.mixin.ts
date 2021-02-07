import { MixinTarget } from "@loopback/core";
import {
    EntityCrudRepository,
    Entity,
    Count,
    CountSchema,
    Where,
    Filter,
    RelationType,
} from "@loopback/repository";
import {
    api,
    get,
    post,
    put,
    del,
    param,
    requestBody,
    getModelSchemaRef,
} from "@loopback/rest";
import { AuthenticationMetadata, authenticate } from "@loopback/authentication";
import { AuthorizationMetadata, authorize } from "@loopback/authorization";

import { CRUDApiConfig, CRUDController } from "../types";

/**
 * create belongsTo relations
 * create models
 * create hasOne relations
 * create hasMany relations
 */
const nestedCreate = async <T extends Entity, ID>(
    repository: EntityCrudRepository<T, ID>,
    context: CRUDController<T, ID>,
    models: T[]
): Promise<T[]> => {
    for (const [relation, metadata] of Object.entries(
        repository.entityClass.definition.relations
    ).filter(([_, metadata]) => metadata.type === RelationType.belongsTo)) {
        const keyTo = (metadata as any).keyTo;
        const keyFrom = (metadata as any).keyFrom;
        const targetGetter = (repository as any)[relation].getter;
        if (!targetGetter) {
            continue;
        }
        const targetRepository = await targetGetter();

        models = await Promise.all(
            models.map(async (model: any) => {
                if (!model[relation]) {
                    return model as T;
                }

                model[relation] = (
                    await nestedCreate(targetRepository, context, [
                        model[relation],
                    ])
                )[0];
                model[keyFrom] = model[relation][keyTo];

                return model as T;
            })
        );
    }

    models = await Promise.all(
        models.map(async (model: any) => {
            const rawModel: any = Object.fromEntries(
                Object.entries(model).filter(
                    ([_, value]) => typeof value !== "object"
                )
            );

            const createdModel = await repository.create(rawModel, {
                context: context,
            });

            return {
                ...model,
                ...createdModel,
            };
        })
    );

    for (const [relation, metadata] of Object.entries(
        repository.entityClass.definition.relations
    ).filter(([_, metadata]) => metadata.type === RelationType.hasOne)) {
        const keyTo = (metadata as any).keyTo;
        const keyFrom = (metadata as any).keyFrom;
        const targetGetter = (repository as any)[relation];
        if (!targetGetter) {
            continue;
        }
        const targetRepository = await targetGetter().getTargetRepository();

        models = await Promise.all(
            models.map(async (model: any) => {
                if (!model[relation]) {
                    return model as T;
                }

                model[relation][keyTo] = model[keyFrom];
                model[relation] = (
                    await nestedCreate(targetRepository, context, [
                        model[relation],
                    ])
                )[0];

                return model as T;
            })
        );
    }

    for (const [relation, metadata] of Object.entries(
        repository.entityClass.definition.relations
    ).filter(([_, metadata]) => metadata.type === RelationType.hasMany)) {
        const keyTo = (metadata as any).keyTo;
        const keyFrom = (metadata as any).keyFrom;
        const targetGetter = (repository as any)[relation];
        if (!targetGetter) {
            continue;
        }
        const targetRepository = await targetGetter().getTargetRepository();

        models = await Promise.all(
            models.map(async (model: any) => {
                if (!model[relation]) {
                    return model as T;
                }

                model[relation] = model[relation].map((relatedModel: any) => {
                    relatedModel[keyTo] = model[keyFrom];
                    return relatedModel;
                });
                model[relation] = await nestedCreate(
                    targetRepository,
                    context,
                    model[relation]
                );

                return model as T;
            })
        );
    }

    return models;
};

/**
 * upsert belongsTo relations
 * update models
 * upsert hasOne relations
 * add/remove/update hasMany relations
 */
const nestedUpdate = async <T extends Entity, ID>(
    repository: EntityCrudRepository<T, ID>,
    context: CRUDController<T, ID>,
    where: Where<T>,
    data: any
): Promise<number> => {
    let result = 0;

    for (const [relation, metadata] of Object.entries(
        repository.entityClass.definition.relations
    ).filter(([_, metadata]) => metadata.type === RelationType.belongsTo)) {
        const keyTo = (metadata as any).keyTo;
        const keyFrom = (metadata as any).keyFrom;
        const targetGetter = (repository as any)[relation].getter;
        if (!targetGetter) {
            continue;
        }
        const targetRepository = await targetGetter();

        if (data[relation]) {
            const models = await repository.find(
                { where: where },
                { context: context }
            );

            result += await nestedUpdate(
                targetRepository,
                context,
                {
                    [keyTo]: {
                        inq: models.map((model: any) => model[keyFrom]),
                    },
                },
                data[relation]
            );
        }
    }

    const rawData: any = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => typeof value !== "object")
    );
    result += (
        await repository.updateAll(rawData, where, {
            context: context,
        })
    ).count;

    for (const [relation, metadata] of Object.entries(
        repository.entityClass.definition.relations
    ).filter(([_, metadata]) => metadata.type === RelationType.hasOne)) {
        const keyTo = (metadata as any).keyTo;
        const keyFrom = (metadata as any).keyFrom;
        const targetGetter = (repository as any)[relation];
        if (!targetGetter) {
            continue;
        }
        const targetRepository = await targetGetter().getTargetRepository();

        if (data[relation]) {
            const models = await repository.find(
                { where: where },
                { context: context }
            );

            result += await nestedUpdate(
                targetRepository,
                context,
                {
                    [keyTo]: {
                        inq: models.map((model: any) => model[keyFrom]),
                    },
                },
                data[relation]
            );
        }
    }

    for (const [relation, metadata] of Object.entries(
        repository.entityClass.definition.relations
    ).filter(([_, metadata]) => metadata.type === RelationType.hasMany)) {
        const keyTo = (metadata as any).keyTo;
        const keyFrom = (metadata as any).keyFrom;
        const targetGetter = (repository as any)[relation];
        if (!targetGetter) {
            continue;
        }
        const targetRepository = await targetGetter().getTargetRepository();

        if (data[relation]) {
            const models = await repository.find(
                { where: where },
                { context: context }
            );

            for (const item of data[relation]) {
                result += await nestedUpdate(
                    targetRepository,
                    context,
                    {
                        ...targetRepository.entityClass.buildWhereForId(
                            item[
                                targetRepository.entityClass.getIdProperties()[0]
                            ]
                        ),
                        [keyTo]: {
                            inq: models.map((model: any) => model[keyFrom]),
                        },
                    },
                    item
                );
            }
        }
    }

    return result;
};

/**
 * Create controller mixin, add Create rest operations
 */
export function CreateControllerMixin<T extends Entity, ID>(
    config: CRUDApiConfig,
    authentication: (string | AuthenticationMetadata)[],
    authorization: AuthorizationMetadata
) {
    return function <R extends MixinTarget<CRUDController<T, ID>>>(
        superClass: R
    ) {
        @api({ basePath: config.basePath })
        class MixedController extends superClass {
            @authorize(authorization)
            @authenticate(...authentication)
            @post("/", {
                responses: {
                    "200": {
                        description: `Array of ${config.model.name} model instances`,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: getModelSchemaRef(config.model, {
                                        includeRelations: true,
                                    }),
                                },
                            },
                        },
                    },
                },
            })
            async createAll(
                @requestBody({
                    content: {
                        "application/json": {
                            schema: {
                                type: "array",
                                items: getModelSchemaRef(config.model, {
                                    includeRelations: true,
                                    title: `New${config.model.name}`,
                                    exclude: [
                                        ...config.model.definition.idProperties(),
                                        ...(config.model.definition.settings
                                            .excludeProperties || []),
                                    ],
                                }),
                            },
                        },
                    },
                })
                models: T[]
            ): Promise<T[]> {
                return await nestedCreate(this.repository, this, models);
            }

            @authorize(authorization)
            @authenticate(...authentication)
            @post("/one", {
                responses: {
                    "200": {
                        description: `${config.model.name} model instance`,
                        content: {
                            "application/json": {
                                schema: getModelSchemaRef(config.model, {
                                    includeRelations: true,
                                }),
                            },
                        },
                    },
                },
            })
            async createOne(
                @requestBody({
                    content: {
                        "application/json": {
                            schema: getModelSchemaRef(config.model, {
                                includeRelations: true,
                                title: `New${config.model.name}`,
                                exclude: [
                                    ...config.model.definition.idProperties(),
                                    ...(config.model.definition.settings
                                        .excludeProperties || []),
                                ],
                            }),
                        },
                    },
                })
                model: T
            ): Promise<T> {
                const result = await nestedCreate(this.repository, this, [
                    model,
                ]);

                return result[0];
            }
        }

        return MixedController;
    };
}

const normalizeAuthenticationConfigs = (
    configs:
        | (string | AuthenticationMetadata)[]
        | string
        | AuthenticationMetadata
        | undefined,
    defaultConfig: AuthenticationMetadata
) => {
    if (configs === undefined) return [defaultConfig];
    if (Array.isArray(configs)) return configs;
    return [configs];
};

/**
 * Read controller mixin, add Read rest operations
 */
export function ReadControllerMixin<T extends Entity, ID>(
    config: CRUDApiConfig,
    authentication: (string | AuthenticationMetadata)[],
    authorization: AuthorizationMetadata
) {
    return function <R extends MixinTarget<CRUDController<T, ID>>>(
        superClass: R
    ) {
        @api({ basePath: config.basePath })
        class MixedController extends superClass {
            @authorize(authorization)
            @authenticate(...authentication)
            @get("/", {
                responses: {
                    "200": {
                        description: `Array of ${config.model.name} model instances`,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: getModelSchemaRef(config.model, {
                                        includeRelations: true,
                                    }),
                                },
                            },
                        },
                    },
                },
            })
            async readAll(
                @param.filter(config.model) filter?: Filter<T>,
                @param.header.boolean("x-total", { required: false })
                xTotal?: Boolean
            ): Promise<T[]> {
                if (xTotal) {
                    const count = await this.repository.count(filter?.where, {
                        context: this,
                    });

                    this.response.setHeader("X-Total-Count", count.count);
                }

                return await this.repository.find(filter, {
                    context: this,
                });
            }

            @authorize(authorization)
            @authenticate(...authentication)
            @get("/{id}", {
                responses: {
                    "200": {
                        description: `${config.model.name} model instance`,
                        content: {
                            "application/json": {
                                schema: getModelSchemaRef(config.model, {
                                    includeRelations: true,
                                }),
                            },
                        },
                        headers: {
                            "X-Total-Count": {
                                type: "number",
                            },
                        },
                    },
                },
            })
            async readOne(
                @param.path.string("id") id: ID,
                @param.filter(config.model) filter?: Filter<T>
            ): Promise<T> {
                if (this.request.headers["x-total"] === "true") {
                    const count = await this.repository.count(filter?.where, {
                        context: this,
                    });

                    this.response.setHeader("X-Total-Count", count.count);

                    return (await this.repository.find(filter, {
                        context: this,
                        all: true,
                    })) as any;
                } else {
                    return await this.repository.findById(id, filter, {
                        context: this,
                    });
                }
            }
        }

        return MixedController;
    };
}

/**
 * Update controller mixin, add Update rest operations
 */
export function UpdateControllerMixin<T extends Entity, ID>(
    config: CRUDApiConfig,
    authentication: (string | AuthenticationMetadata)[],
    authorization: AuthorizationMetadata
) {
    return function <R extends MixinTarget<CRUDController<T, ID>>>(
        superClass: R
    ) {
        @api({ basePath: config.basePath })
        class MixedController extends superClass {
            @authorize(authorization)
            @authenticate(...authentication)
            @put("/", {
                responses: {
                    "200": {
                        description: `${config.model.name} PUT success count`,
                        content: {
                            "application/json": { schema: CountSchema },
                        },
                    },
                },
            })
            async updateAll(
                @requestBody({
                    content: {
                        "application/json": {
                            schema: getModelSchemaRef(config.model, {
                                includeRelations: true,
                                partial: true,
                            }),
                        },
                    },
                })
                data: T,
                @param.where(config.model) where?: Where<T>
            ): Promise<Count> {
                const result = await nestedUpdate(
                    this.repository,
                    this,
                    where || {},
                    data
                );

                return {
                    count: result,
                };
            }

            @authorize(authorization)
            @authenticate(...authentication)
            @put("/{id}", {
                responses: {
                    "204": {
                        description: `${config.model.name} PUT success`,
                    },
                },
            })
            async updateOne(
                @param.path.string("id") id: ID,
                @requestBody({
                    content: {
                        "application/json": {
                            schema: getModelSchemaRef(config.model, {
                                includeRelations: true,
                                partial: true,
                            }),
                        },
                    },
                })
                data: T
            ): Promise<void> {
                await nestedUpdate(
                    this.repository,
                    this,
                    this.repository.entityClass.buildWhereForId(id),
                    data
                );
            }
        }

        return MixedController;
    };
}

/**
 * Delete controller mixin, add Delete rest operations
 */
export function DeleteControllerMixin<T extends Entity, ID>(
    config: CRUDApiConfig,
    authentication: (string | AuthenticationMetadata)[],
    authorization: AuthorizationMetadata
) {
    return function <R extends MixinTarget<CRUDController<T, ID>>>(
        superClass: R
    ) {
        @api({ basePath: config.basePath })
        class MixedController extends superClass {
            @authorize(authorization)
            @authenticate(...authentication)
            @del("/", {
                responses: {
                    "200": {
                        description: `${config.model.name} DELETE success count`,
                        content: {
                            "application/json": { schema: CountSchema },
                        },
                    },
                },
            })
            async deleteAll(
                @param.where(config.model) where?: Where<T>
            ): Promise<Count> {
                return await this.repository.deleteAll(where, {
                    context: this,
                });
            }

            @authorize(authorization)
            @authenticate(...authentication)
            @del("/{id}", {
                responses: {
                    "204": {
                        description: `${config.model.name} DELETE success`,
                    },
                },
            })
            async deleteOne(@param.path.string("id") id: ID): Promise<void> {
                return await this.repository.deleteById(id, {
                    context: this,
                });
            }
        }

        return MixedController;
    };
}

export const defaultAuthorizationConfig = {
    skip: true,
};

export const defaultAuthenticationConfig = {
    strategy: "crud",
    skip: true,
};

/**
 * CRUD controller mixin, add CRUD rest operations
 */
export function CRUDControllerMixin<T extends Entity, ID>(
    config: CRUDApiConfig
) {
    return function <R extends MixinTarget<CRUDController<T, ID>>>(
        superClass: R
    ) {
        if (config.create) {
            superClass = CreateControllerMixin<T, ID>(
                config,
                normalizeAuthenticationConfigs(
                    config.create.authentication,
                    defaultAuthenticationConfig
                ),
                config.create.authorization ?? defaultAuthorizationConfig
            )(superClass);
        }

        if (config.read) {
            superClass = ReadControllerMixin<T, ID>(
                config,
                normalizeAuthenticationConfigs(
                    config.read.authentication,
                    defaultAuthenticationConfig
                ),
                config.read.authorization ?? defaultAuthorizationConfig
            )(superClass);
        }

        if (config.update) {
            superClass = UpdateControllerMixin<T, ID>(
                config,
                normalizeAuthenticationConfigs(
                    config.update.authentication,
                    defaultAuthenticationConfig
                ),
                config.update.authorization ?? defaultAuthorizationConfig
            )(superClass);
        }

        if (config.delete) {
            superClass = DeleteControllerMixin<T, ID>(
                config,
                normalizeAuthenticationConfigs(
                    config.delete.authentication,
                    defaultAuthenticationConfig
                ),
                config.delete.authorization ?? defaultAuthorizationConfig
            )(superClass);
        }

        const defineNamedController = new Function(
            "superClass",
            `return class ${config.model.name}Controller extends superClass {}`
        );
        return defineNamedController(superClass) as R;
    };
}
