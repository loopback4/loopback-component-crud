import { MixinTarget } from "@loopback/core";
import {
    Entity,
    Count,
    CountSchema,
    Where,
    Filter,
    FilterExcludingWhere,
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
        @api({ basePath: config.basePath, paths: {} })
        class MixedController extends superClass {
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
                                        ...config.model.definition?.settings
                                            ?.excludeProperties,
                                    ],
                                }),
                            },
                        },
                    },
                })
                models: T[]
            ): Promise<T[]> {
                return await this.repository.createAll(models);
            }

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
                                    ...config.model.definition?.settings
                                        ?.excludeProperties,
                                ],
                            }),
                        },
                    },
                })
                model: T
            ): Promise<T> {
                return await this.repository.create(model);
            }
        }

        return MixedController;
    };
}

/**
 * Read controller mixin, add Read rest operations
 */
export function ReadControllerMixin<
    T extends Entity,
    ID,
    Relations extends object = {}
>(
    config: CRUDApiConfig,
    authentication?: AuthenticationMetadata,
    authorization?: AuthorizationMetadata
) {
    return function <R extends MixinTarget<CRUDController<T, ID>>>(
        superClass: R
    ) {
        @api({ basePath: config.basePath, paths: {} })
        class MixedController extends superClass {
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
                    const count = await this.repository.count(filter?.where);

                    this.response.setHeader("X-Total-Count", count.count);
                }

                return await this.repository.find(filter);
            }

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
                @param.filter(config.model, { exclude: "where" })
                filter?: FilterExcludingWhere<T>
            ): Promise<T> {
                if (this.request.headers["x-total"] === "true") {
                    const count = await this.repository.count(
                        (config.model as typeof Entity & {
                            prototype: Entity;
                        }).buildWhereForId(id),
                        {
                            history: true,
                        }
                    );

                    this.response.setHeader("X-Total-Count", count.count);

                    return (await this.repository.find(filter, {
                        history: true,
                    })) as any;
                } else {
                    return await this.repository.findById(id, filter);
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
        @api({ basePath: config.basePath, paths: {} })
        class MixedController extends superClass {
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
                return await this.repository.updateAll(data, where);
            }

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
                return await this.repository.updateById(id, data);
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
        @api({ basePath: config.basePath, paths: {} })
        class MixedController extends superClass {
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
                return await this.repository.deleteAll(where);
            }

            @del("/{id}", {
                responses: {
                    "204": {
                        description: `${config.model.name} DELETE success`,
                    },
                },
            })
            async deleteOne(@param.path.string("id") id: ID): Promise<void> {
                return await this.repository.deleteById(id);
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

        const controllerName = `${config.model.name}Controller`;
        const defineNamedController = new Function(
            "superClass",
            `return class ${controllerName} extends superClass {}`
        );
        return defineNamedController(superClass);
    };
}
