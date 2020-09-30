import { MixinTarget } from "@loopback/core";
import {
    EntityCrudRepository,
    Entity,
    Count,
    CountSchema,
    Where,
    Filter,
    DataObject,
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
 * Create controller mixin, add Create rest operations
 */
export function CreateControllerMixin<T extends Entity, ID>(
    config: CRUDApiConfig,
    authentication?: AuthenticationMetadata,
    authorization?: AuthorizationMetadata
) {
    return function <R extends MixinTarget<CRUDController<T, ID>>>(
        superClass: R
    ) {
        /**
         * create belongsTo relations
         * create models
         * create hasOne relations
         * create hasMany relations
         */
        const nestedCreate = async (
            repository: EntityCrudRepository<T, ID>,
            context: CRUDController<T, ID>,
            models: T[]
        ): Promise<T[]> => {
            for (const [relation, metadata] of Object.entries(
                repository.entityClass.definition.relations
            ).filter(
                ([_, metadata]) => metadata.type === RelationType.belongsTo
            )) {
                const keyFrom = (metadata as any).keyFrom;
                const keyTo = (metadata as any).keyTo;

                // const targetRepository = await (repository as any)
                //     [relation]()
                //     .getTargetRepository();

                // models = await Promise.all(
                //     models.map(async (model: any) => {
                //         model[relation] = (
                //             await nestedCreate(targetRepository, context, [
                //                 model[relation],
                //             ])
                //         )[0];
                //         model[keyFrom] = model[relation][keyTo];

                //         return model as T;
                //     })
                // );
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
            ).filter(
                ([_, metadata]) => metadata.type === RelationType.hasOne
            )) {
                const keyFrom = (metadata as any).keyFrom;
                const keyTo = (metadata as any).keyTo;
                const targetRepository = await (repository as any)
                    [relation]()
                    .getTargetRepository();

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
            ).filter(
                ([_, metadata]) => metadata.type === RelationType.hasMany
            )) {
                const keyFrom = (metadata as any).keyFrom;
                const keyTo = (metadata as any).keyTo;
                const targetRepository = await (repository as any)
                    [relation]()
                    .getTargetRepository();

                models = await Promise.all(
                    models.map(async (model: any) => {
                        if (!model[relation]) {
                            return model as T;
                        }

                        model[relation] = model[relation].map(
                            (relatedModel: any) => {
                                relatedModel[keyTo] = model[keyFrom];
                                return relatedModel;
                            }
                        );
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

        @api({ basePath: config.basePath })
        class MixedController extends superClass {
            @authorize(
                authorization || {
                    skip: true,
                }
            )
            @authenticate(
                authentication || {
                    strategy: "crud",
                    skip: true,
                }
            )
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

            @authorize(
                authorization || {
                    skip: true,
                }
            )
            @authenticate(
                authentication || {
                    strategy: "crud",
                    skip: true,
                }
            )
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

/**
 * Read controller mixin, add Read rest operations
 */
export function ReadControllerMixin<T extends Entity, ID>(
    config: CRUDApiConfig,
    authentication?: AuthenticationMetadata,
    authorization?: AuthorizationMetadata
) {
    return function <R extends MixinTarget<CRUDController<T, ID>>>(
        superClass: R
    ) {
        @api({ basePath: config.basePath })
        class MixedController extends superClass {
            @authorize(
                authorization || {
                    skip: true,
                }
            )
            @authenticate(
                authentication || {
                    strategy: "crud",
                    skip: true,
                }
            )
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
                @param.filter(config.model) filter?: Filter<T>
            ): Promise<T[]> {
                if (this.request.headers["x-total"] === "true") {
                    const count = await this.repository.count(filter?.where, {
                        context: this,
                    });

                    this.response.setHeader("X-Total-Count", count.count);
                }

                return await this.repository.find(filter, {
                    context: this,
                });
            }

            @authorize(
                authorization || {
                    skip: true,
                }
            )
            @authenticate(
                authentication || {
                    strategy: "crud",
                    skip: true,
                }
            )
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
    authentication?: AuthenticationMetadata,
    authorization?: AuthorizationMetadata
) {
    return function <R extends MixinTarget<CRUDController<T, ID>>>(
        superClass: R
    ) {
        @api({ basePath: config.basePath })
        class MixedController extends superClass {
            @authorize(
                authorization || {
                    skip: true,
                }
            )
            @authenticate(
                authentication || {
                    strategy: "crud",
                    skip: true,
                }
            )
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
                                partial: true,
                            }),
                        },
                    },
                })
                data: T,
                @param.where(config.model) where?: Where<T>
            ): Promise<Count> {
                return await this.repository.updateAll(data, where, {
                    context: this,
                });
            }

            @authorize(
                authorization || {
                    skip: true,
                }
            )
            @authenticate(
                authentication || {
                    strategy: "crud",
                    skip: true,
                }
            )
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
                                partial: true,
                            }),
                        },
                    },
                })
                data: T
            ): Promise<void> {
                return await this.repository.updateById(id, data, {
                    context: this,
                });
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
    authentication?: AuthenticationMetadata,
    authorization?: AuthorizationMetadata
) {
    return function <R extends MixinTarget<CRUDController<T, ID>>>(
        superClass: R
    ) {
        @api({ basePath: config.basePath })
        class MixedController extends superClass {
            @authorize(
                authorization || {
                    skip: true,
                }
            )
            @authenticate(
                authentication || {
                    strategy: "crud",
                    skip: true,
                }
            )
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

            @authorize(
                authorization || {
                    skip: true,
                }
            )
            @authenticate(
                authentication || {
                    strategy: "crud",
                    skip: true,
                }
            )
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
                config.create.authentication,
                config.create.authorization
            )(superClass);
        }

        if (config.read) {
            superClass = ReadControllerMixin<T, ID>(
                config,
                config.read.authentication,
                config.read.authorization
            )(superClass);
        }

        if (config.update) {
            superClass = UpdateControllerMixin<T, ID>(
                config,
                config.update.authentication,
                config.update.authorization
            )(superClass);
        }

        if (config.delete) {
            superClass = DeleteControllerMixin<T, ID>(
                config,
                config.delete.authentication,
                config.delete.authorization
            )(superClass);
        }

        const defineNamedController = new Function(
            "superClass",
            `return class ${config.model.name}Controller extends superClass {}`
        );
        return defineNamedController(superClass) as R;
    };
}
