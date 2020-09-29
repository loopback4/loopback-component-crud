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
         * remove navigational properties from entity
         */
        const cascadeClear = (entity: DataObject<T>) => {
            return Object.fromEntries(
                Object.entries(entity).filter(
                    ([_, value]) => typeof value !== "object"
                )
            ) as DataObject<T>;
        };

        /**
         * find matched entity for createdEntity by properties equality
         * add matched entity relations to createdEntity
         */
        const cascadeFind = (createdEntity: T, entities: DataObject<T>[]) => {
            // Check two models have same properties
            const equalProperty = (
                property: string,
                metadata: any,
                entity: DataObject<T>
            ) => {
                // Check entity before save has property, then return equality
                if (property in entity) {
                    return (
                        (createdEntity as any)[property] ===
                        (entity as any)[property]
                    );
                }

                // Check entity before save hasn't property and has default value
                // So it were filled automatically, properties are equal
                if ("default" in metadata || "defaultFn" in metadata) {
                    return true;
                }

                // Entity before save hasn't property and has not default value
                // But saved model has value
                return false;
            };

            // Find one matched entity for createdEntity
            const entity = entities
                .filter((entity) =>
                    // Check createdEntity and entity have equal by properties
                    Object.entries(config.model.definition.properties).reduce<
                        boolean
                    >(
                        (accumulate, [property, metadata]) =>
                            accumulate &&
                            equalProperty(property, metadata, entity),
                        true
                    )
                )
                .pop();

            // Get entity relations
            const entityRelations = Object.fromEntries(
                Object.entries(entity || {}).filter(
                    ([_, value]) => typeof value === "object"
                )
            );

            // Add entity relations to raw model
            return {
                ...createdEntity,
                ...entityRelations,
            } as T;
        };

        /**
         * result = Create parents
         * result = map(find related entity)
         * for each entity relations
         *      children = map(result[relation])
         *      children = flat(1)
         *      children = map({...entity, [keyFrom]: keyTo})
         *      result = target.createAll(children, options)
         *      result = result.add(children)
         * return result
         */
        const cascadeCreate = async (
            repository: EntityCrudRepository<T, ID>,
            options: any,
            models: T[]
        ) => {
            const belongsToRelations = Object.entries(
                repository.entityClass.definition.relations
            ).filter(
                ([_, metadata]) => metadata.type === RelationType.belongsTo
            );

            // Create belongsTo relations
            for (const [relation, metadata] of Object.entries(
                repository.entityClass.definition.relations
            ).filter(([_, value]) => value.type === RelationType.belongsTo)) {
            }

            // Create self
            const rawModels = models.map(
                (model) =>
                    Object.fromEntries(
                        Object.entries(model).filter(
                            ([_, value]) => typeof value !== "object"
                        )
                    ) as T
            );
            const createdRawModels = await repository.createAll(rawModels);

            // Create hasOne, hasMany
            models.map(
                (model) =>
                    Object.fromEntries(
                        Object.entries(model).filter(
                            ([_, value]) => typeof value === "object"
                        )
                    ) as T
            );

            // Create entities without navigational properties
            let result = await repository.createAll(
                models.map((model) => cascadeClear(model)),
                options
            );

            // Find and add navigational properties for each created entity
            result = result.map((createdModel) =>
                cascadeFind(createdModel, models)
            );

            const cascadeCreateRelations = Object.entries(
                config.model.definition.relations
            );

            for (let [relation, metadata] of cascadeCreateRelations) {
                const keyFrom = (metadata as any).keyFrom;
                const keyTo = (metadata as any).keyTo;

                const target = (await (repository as any)
                    [relation]()
                    .getTargetRepository()) as EntityCrudRepository<any, any>;
                if (!target) {
                    continue;
                }

                let children = result
                    .map((model: any) =>
                        [model[relation]].flat(1).map((child) => ({
                            ...child,
                            [keyTo]: model[keyFrom],
                        }))
                    )
                    .flat(1)
                    .filter((entity) => entity);
                if (children.length <= 0) {
                    continue;
                }

                // Create children models
                const childrenResult = await target.createAll(
                    children,
                    options
                );

                // Add created children to parents in result
                result = result.map((entity: any) => {
                    if (metadata.targetsMany) {
                        entity[relation] = childrenResult.filter(
                            (child: any) => child[keyTo] === entity[keyFrom]
                        );
                    } else {
                        entity[relation] = childrenResult.filter(
                            (child: any) => child[keyTo] === entity[keyFrom]
                        )[0];
                    }

                    return entity;
                });
            }

            return result;
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
                return await this.repository.createAll(models, {
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
                return await this.repository.create(model, {
                    context: this,
                });
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
        return defineNamedController(superClass);
    };
}
