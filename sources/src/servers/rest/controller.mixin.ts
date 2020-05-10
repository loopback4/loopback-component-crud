import {
    Entity,
    Count,
    CountSchema,
    Class,
    Where,
    Filter,
    EntityNotFoundError,
} from "@loopback/repository";
import {
    get,
    post,
    put,
    del,
    param,
    requestBody,
    getModelSchemaRef,
    getWhereSchemaFor,
    getFilterSchemaFor,
} from "@loopback/rest";

import { authenticate } from "@loopback/authentication";
import { authorize } from "@loopback/authorization";
import { intercept } from "@loopback/core";
import {
    exist,
    validate,
    limit,
    generateIds,
    generatePath,
    generateCondition,
} from "../../interceptors";
import { Ctor, ControllerScope } from "../../types";

import { CRUDController } from "../../servers";

export function CreateControllerMixin<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    rootCtor: Ctor<Model>,
    rootScope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    leafCtor: Ctor<Model>,
    leafScope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    relations: string[],
    basePath: string
): Class<Controller> {
    const parentClass: Class<CRUDController> = controllerClass;

    const method = (name: string) =>
        relations.reduce(
            (accumulate, relation) => accumulate.concat(relation),
            name
        );

    const ids = generateIds(rootCtor, relations);

    class TargetsManyController extends parentClass {
        /**
         * Create all method
         *
         * 1. exist
         * 2. validate
         */
        @intercept(validate(leafScope.modelValidator, 0))
        @intercept(exist(rootCtor, relations, rootScope, 1, ids.length + 1))
        @authorize(leafScope.create || {})
        @authenticate("crud")
        @post(`${generatePath(rootCtor, relations, basePath)}`, {
            responses: {
                "200": {
                    description: `Create multiple ${leafCtor.name} targets many`,
                    content: {
                        "application/json": {
                            schema: {
                                type: "array",
                                items: getModelSchemaRef(leafCtor),
                            },
                        },
                    },
                },
            },
        })
        async [method("createAll")](
            @requestBody({
                content: {
                    "application/json": {
                        schema: {
                            type: "array",
                            items: getModelSchemaRef(leafCtor, {
                                exclude:
                                    leafCtor.definition.settings
                                        .excludeProperties,
                            }),
                        },
                    },
                },
            })
            models: Model[]
        ): Promise<Model[]> {
            /**
             * args[0]: Model[]
             *
             *
             * args[1]: id
             * args[2]: id
             * ...
             * args[n]: id
             *
             *
             * args[n+1]: Condition
             */

            return await leafScope
                .repositoryGetter(this as any)
                .createAll(models);
        }

        /**
         * Create one method
         *
         * 1. exist
         * 2. validate
         */
        @intercept(validate(leafScope.modelValidator, 0))
        @intercept(exist(rootCtor, relations, rootScope, 1, ids.length + 1))
        @authorize(leafScope.create || {})
        @authenticate("crud")
        @post(`${generatePath(rootCtor, relations, basePath)}/one`, {
            responses: {
                "200": {
                    description: `Create single ${leafCtor.name} targets many`,
                    content: {
                        "application/json": {
                            schema: getModelSchemaRef(leafCtor),
                        },
                    },
                },
            },
        })
        async [method("createOne")](
            @requestBody({
                content: {
                    "application/json": {
                        schema: getModelSchemaRef(leafCtor, {
                            exclude:
                                leafCtor.definition.settings.excludeProperties,
                        }),
                    },
                },
            })
            model: Model
        ): Promise<Model> {
            /**
             * args[0]: Model
             *
             *
             * args[1]: id
             * args[2]: id
             * ...
             * args[n]: id
             *
             *
             * args[n+1]: Condition
             */

            return await leafScope.repositoryGetter(this as any).create(model);
        }
    }
    ids.forEach((id, index) => {
        param.path.string(id)(
            TargetsManyController.prototype,
            method("createAll"),
            index + 1
        );
    });
    ids.forEach((id, index) => {
        param.path.string(id)(
            TargetsManyController.prototype,
            method("createOne"),
            index + 1
        );
    });

    class TargetsOneController extends parentClass {
        /**
         * Create one method
         *
         * 1. exist
         * 2. validate
         */
        @intercept(validate(leafScope.modelValidator, 0))
        @intercept(exist(rootCtor, relations, rootScope, 1, ids.length + 1))
        @authorize(leafScope.create || {})
        @authenticate("crud")
        @post(`${generatePath(rootCtor, relations, basePath)}`, {
            responses: {
                "200": {
                    description: `Create single ${leafCtor.name} targets one`,
                    content: {
                        "application/json": {
                            schema: getModelSchemaRef(leafCtor),
                        },
                    },
                },
            },
        })
        async [method("createOne")](
            @requestBody({
                content: {
                    "application/json": {
                        schema: getModelSchemaRef(leafCtor, {
                            exclude:
                                leafCtor.definition.settings.excludeProperties,
                        }),
                    },
                },
            })
            model: Model
        ): Promise<Model> {
            /**
             * args[0]: Model
             *
             *
             * args[1]: id
             * args[2]: id
             * ...
             * args[n]: id
             *
             *
             * args[n+1]: Condition
             */

            return await leafScope.repositoryGetter(this as any).create(model);
        }
    }
    ids.forEach((id, index) => {
        param.path.string(id)(
            TargetsOneController.prototype,
            method("createOne"),
            index + 1
        );
    });

    if (generateCondition(rootCtor, relations).targetsMany) {
        return TargetsManyController as any;
    } else {
        return TargetsOneController as any;
    }
}

export function ReadControllerMixin<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    rootCtor: Ctor<Model>,
    rootScope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    leafCtor: Ctor<Model>,
    leafScope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    relations: string[],
    basePath: string
): Class<Controller> {
    const parentClass: Class<CRUDController> = controllerClass;

    const method = (name: string) =>
        relations.reduce(
            (accumulate, relation) => accumulate.concat(relation),
            name
        );

    const ids = generateIds(rootCtor, relations);

    class TargetsManyController extends parentClass {
        /**
         * Read all method
         *
         * 1. exist
         * 2. limit
         */
        @intercept(limit(leafCtor, leafScope, undefined, undefined, 0))
        @intercept(exist(rootCtor, relations, rootScope, 1, ids.length + 1))
        @authorize(leafScope.read || {})
        @authenticate("crud")
        @get(`${generatePath(rootCtor, relations, basePath)}`, {
            responses: {
                "200": {
                    description: `Read multiple ${leafCtor.name} targets many, by filter`,
                    content: {
                        "application/json": {
                            schema: {
                                type: "array",
                                items: getModelSchemaRef(leafCtor, {
                                    includeRelations: true,
                                }),
                            },
                        },
                    },
                },
            },
        })
        async [method("readAll")](
            @param.query.object("filter", getFilterSchemaFor(leafCtor), {
                description: `Filter ${leafCtor.name}`,
            })
            filter?: Filter<Model>
        ): Promise<Model[]> {
            /**
             * args[0]: Filter
             *
             *
             * args[1]: id
             * args[2]: id
             * ...
             * args[n]: id
             *
             *
             * args[n+1]: Condition
             * args[n+2]: Limit
             */

            if (this.request.headers["X-Total"] === "true") {
                const count = await leafScope
                    .repositoryGetter(this as any)
                    .count(arguments[arguments.length - 1].where);

                this.response.setHeader("X-Total-Count", count.count);
            }

            return await leafScope
                .repositoryGetter(this as any)
                .find(arguments[arguments.length - 1]);
        }

        /**
         * Read one method
         *
         * 1. exist
         * 2. limit
         */
        @intercept(limit(leafCtor, leafScope, 0, undefined, 1))
        @intercept(exist(rootCtor, relations, rootScope, 2, ids.length + 2))
        @authorize(leafScope.read || {})
        @authenticate("crud")
        @get(`${generatePath(rootCtor, relations, basePath)}/{id}`, {
            responses: {
                "200": {
                    description: `Read single ${leafCtor.name} targets many, by id`,
                    content: {
                        "application/json": {
                            schema: getModelSchemaRef(leafCtor, {
                                includeRelations: true,
                            }),
                        },
                    },
                },
            },
        })
        async [method("readOne")](
            @param.path.string("id") id: string,
            @param.query.object("filter", getFilterSchemaFor(leafCtor), {
                description: `Filter ${leafCtor.name}`,
            })
            filter?: Filter<Model>
        ): Promise<Model> {
            /**
             * args[0]: id_model
             * args[1]: Filter
             *
             *
             * args[2]: id
             * args[3]: id
             * ...
             * args[n]: id
             *
             *
             * args[n+1]: Condition
             * args[n+2]: Limit
             */

            if (this.request.headers["X-Total"] === "true") {
                const count = await leafScope
                    .repositoryGetter(this as any)
                    .count(arguments[arguments.length - 1].where, {
                        crud: true,
                    });

                this.response.setHeader("X-Total-Count", count.count);

                return (await leafScope
                    .repositoryGetter(this as any)
                    .find(arguments[arguments.length - 1], {
                        crud: true,
                    })) as any;
            } else {
                const model = await leafScope
                    .repositoryGetter(this as any)
                    .findOne(arguments[arguments.length - 1]);

                if (model) {
                    return model;
                } else {
                    throw new EntityNotFoundError(
                        leafCtor,
                        JSON.stringify(arguments[arguments.length - 1])
                    );
                }
            }
        }
    }
    ids.forEach((id, index) => {
        param.path.string(id)(
            TargetsManyController.prototype,
            method("readAll"),
            index + 1
        );
    });
    ids.forEach((id, index) => {
        param.path.string(id)(
            TargetsManyController.prototype,
            method("readOne"),
            index + 2
        );
    });

    class TargetsOneController extends parentClass {
        /**
         * Read one method
         *
         * 1. exist
         * 2. limit
         */
        @intercept(limit(leafCtor, leafScope, undefined, undefined, 0))
        @intercept(exist(rootCtor, relations, rootScope, 1, ids.length + 1))
        @authorize(leafScope.read || {})
        @authenticate("crud")
        @get(`${generatePath(rootCtor, relations, basePath)}`, {
            responses: {
                "200": {
                    description: `Read single ${leafCtor.name} targets one`,
                    content: {
                        "application/json": {
                            schema: getModelSchemaRef(leafCtor, {
                                includeRelations: true,
                            }),
                        },
                    },
                },
            },
        })
        async [method("readOne")](
            @param.query.object("filter", getFilterSchemaFor(leafCtor), {
                description: `Filter ${leafCtor.name}`,
            })
            filter?: Filter<Model>
        ): Promise<Model> {
            /**
             * args[0]: Filter
             *
             *
             * args[1]: id
             * args[2]: id
             * ...
             * args[n]: id
             *
             *
             * args[n+1]: Condition
             * args[n+2]: Limit
             */

            if (this.request.headers["X-Total"] === "true") {
                const count = await leafScope
                    .repositoryGetter(this as any)
                    .count(arguments[arguments.length - 1].where, {
                        crud: true,
                    });

                this.response.setHeader("X-Total-Count", count.count);

                return (await leafScope
                    .repositoryGetter(this as any)
                    .find(arguments[arguments.length - 1], {
                        crud: true,
                    })) as any;
            } else {
                const model = await leafScope
                    .repositoryGetter(this as any)
                    .findOne(arguments[arguments.length - 1]);

                if (model) {
                    return model;
                } else {
                    throw new EntityNotFoundError(
                        leafCtor,
                        JSON.stringify(arguments[arguments.length - 1])
                    );
                }
            }
        }
    }
    ids.forEach((id, index) => {
        param.path.string(id)(
            TargetsOneController.prototype,
            method("readOne"),
            index + 1
        );
    });

    if (generateCondition(rootCtor, relations).targetsMany) {
        return TargetsManyController as any;
    } else {
        return TargetsOneController as any;
    }
}

export function UpdateControllerMixin<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    rootCtor: Ctor<Model>,
    rootScope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    leafCtor: Ctor<Model>,
    leafScope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    relations: string[],
    basePath: string
): Class<Controller> {
    const parentClass: Class<CRUDController> = controllerClass;

    const method = (name: string) =>
        relations.reduce(
            (accumulate, relation) => accumulate.concat(relation),
            name
        );

    const ids = generateIds(rootCtor, relations);

    class TargetsManyController extends parentClass {
        /**
         * Update all method
         *
         * 1. exist
         * 2. validate
         * 3. limit
         */
        @intercept(limit(leafCtor, leafScope, undefined, 1, undefined))
        @intercept(validate(leafScope.modelValidator, 0))
        @intercept(exist(rootCtor, relations, rootScope, 2, ids.length + 2))
        @authorize(leafScope.update || {})
        @authenticate("crud")
        @put(`${generatePath(rootCtor, relations, basePath)}`, {
            responses: {
                "204": {
                    description: `Update multiple ${leafCtor.name} targets many, by where`,
                },
            },
        })
        async [method("updateAll")](
            @requestBody({
                content: {
                    "application/json": {
                        schema: getModelSchemaRef(leafCtor, { partial: true }),
                    },
                },
            })
            model: Model,
            @param.query.object("where", getWhereSchemaFor(leafCtor), {
                description: `Where ${leafCtor.name}`,
            })
            where?: Where<Model>
        ): Promise<void> {
            /**
             * args[0]: Model
             * args[1]: Where
             *
             *
             * args[2]: id
             * args[3]: id
             * ...
             * args[n]: id
             *
             *
             * args[n+1]: Condition
             * args[n+2]: Limit
             */

            await leafScope
                .repositoryGetter(this as any)
                .updateAll(model, arguments[arguments.length - 1]);
        }

        /**
         * Update one method
         *
         * 1. exist
         * 2. validate
         * 3. limit
         */
        @intercept(limit(leafCtor, leafScope, 1, undefined, undefined))
        @intercept(validate(leafScope.modelValidator, 0))
        @intercept(exist(rootCtor, relations, rootScope, 2, ids.length + 2))
        @authorize(leafScope.update || {})
        @authenticate("crud")
        @put(`${generatePath(rootCtor, relations, basePath)}/{id}`, {
            responses: {
                "204": {
                    description: `Update single ${leafCtor.name} targets many, by id`,
                },
            },
        })
        async [method("updateOne")](
            @requestBody({
                content: {
                    "application/json": {
                        schema: getModelSchemaRef(leafCtor, { partial: true }),
                    },
                },
            })
            model: Model,
            @param.path.string("id") id: string
        ): Promise<void> {
            /**
             * args[0]: Model
             * args[1]: id_model
             *
             *
             * args[2]: id
             * args[3]: id
             * ...
             * args[n]: id
             *
             *
             * args[n+1]: Condition
             * args[n+2]: Limit
             */

            await leafScope
                .repositoryGetter(this as any)
                .updateAll(model, arguments[arguments.length - 1]);
        }
    }
    ids.forEach((id, index) => {
        param.path.string(id)(
            TargetsManyController.prototype,
            method("updateAll"),
            index + 2
        );
    });
    ids.forEach((id, index) => {
        param.path.string(id)(
            TargetsManyController.prototype,
            method("updateOne"),
            index + 2
        );
    });

    class TargetsOneController extends parentClass {
        /**
         * Update one method
         *
         * 1. exist
         * 2. validate
         */
        @intercept(validate(leafScope.modelValidator, 0))
        @intercept(exist(rootCtor, relations, rootScope, 1, ids.length + 1))
        @authorize(leafScope.update || {})
        @authenticate("crud")
        @put(`${generatePath(rootCtor, relations, basePath)}`, {
            responses: {
                "204": {
                    description: `Update single ${leafCtor.name} targets one`,
                },
            },
        })
        async [method("updateOne")](
            @requestBody({
                content: {
                    "application/json": {
                        schema: getModelSchemaRef(leafCtor, { partial: true }),
                    },
                },
            })
            model: Model
        ): Promise<void> {
            /**
             * args[0]: Model
             *
             *
             * args[1]: id
             * args[2]: id
             * ...
             * args[n]: id
             *
             *
             * args[n+1]: Condition
             */

            await leafScope
                .repositoryGetter(this as any)
                .updateAll(model, arguments[arguments.length - 1]);
        }
    }
    ids.forEach((id, index) => {
        param.path.string(id)(
            TargetsOneController.prototype,
            method("updateOne"),
            index + 1
        );
    });

    if (generateCondition(rootCtor, relations).targetsMany) {
        return TargetsManyController as any;
    } else {
        return TargetsOneController as any;
    }
}

export function DeleteControllerMixin<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    rootCtor: Ctor<Model>,
    rootScope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    leafCtor: Ctor<Model>,
    leafScope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    relations: string[],
    basePath: string
): Class<Controller> {
    const parentClass: Class<CRUDController> = controllerClass;

    const method = (name: string) =>
        relations.reduce(
            (accumulate, relation) => accumulate.concat(relation),
            name
        );

    const ids = generateIds(rootCtor, relations);

    class TargetsManyController extends parentClass {
        /**
         * Delete all method
         *
         * 1. exist
         * 2. limit
         */
        @intercept(limit(leafCtor, leafScope, undefined, 0, undefined))
        @intercept(exist(rootCtor, relations, rootScope, 1, ids.length + 1))
        @authorize(leafScope.delete || {})
        @authenticate("crud")
        @del(`${generatePath(rootCtor, relations, basePath)}`, {
            responses: {
                "200": {
                    description: `Delete multiple ${leafCtor.name} targets many, by where`,
                    content: {
                        "application/json": {
                            schema: CountSchema,
                        },
                    },
                },
            },
        })
        async [method("deleteAll")](
            @param.query.object("where", getWhereSchemaFor(leafCtor), {
                description: `Where ${leafCtor.name}`,
            })
            where?: Where<Model>
        ): Promise<Count> {
            /**
             * args[0]: Where
             *
             *
             * args[1]: id
             * args[2]: id
             * ...
             * args[n]: id
             *
             *
             * args[n+1]: Condition
             * args[n+2]: Limit
             */

            return await leafScope
                .repositoryGetter(this as any)
                .deleteAll(arguments[arguments.length - 1]);
        }

        /**
         * Delete one method
         *
         * 1. exist
         * 2. limit
         */
        @intercept(limit(leafCtor, leafScope, 0, undefined, undefined))
        @intercept(exist(rootCtor, relations, rootScope, 1, ids.length + 1))
        @authorize(leafScope.delete || {})
        @authenticate("crud")
        @del(`${generatePath(rootCtor, relations, basePath)}/{id}`, {
            responses: {
                "204": {
                    description: `Delete single ${leafCtor.name} targets many, by id`,
                },
            },
        })
        async [method("deleteOne")](
            @param.path.string("id") id: string
        ): Promise<void> {
            /**
             * args[0]: id_model
             *
             *
             * args[1]: id
             * args[2]: id
             * ...
             * args[n]: id
             *
             *
             * args[n+1]: Condition
             * args[n+2]: Limit
             */

            await leafScope
                .repositoryGetter(this as any)
                .deleteAll(arguments[arguments.length - 1]);
        }
    }
    ids.forEach((id, index) => {
        param.path.string(id)(
            TargetsManyController.prototype,
            method("deleteAll"),
            index + 1
        );
    });
    ids.forEach((id, index) => {
        param.path.string(id)(
            TargetsManyController.prototype,
            method("deleteOne"),
            index + 1
        );
    });

    class TargetsOneController extends parentClass {
        /**
         * Delete one method
         *
         * 1. exist
         */
        @intercept(exist(rootCtor, relations, rootScope, 0, ids.length + 0))
        @authorize(leafScope.delete || {})
        @authenticate("crud")
        @del(`${generatePath(rootCtor, relations, basePath)}`, {
            responses: {
                "204": {
                    description: `Delete single ${leafCtor.name} targets one`,
                },
            },
        })
        async [method("deleteOne")](): Promise<void> {
            /**
             *
             *
             * args[0]: id
             * args[1]: id
             * ...
             * args[n]: id
             *
             *
             * args[n+1]: Condition
             */

            await leafScope
                .repositoryGetter(this as any)
                .deleteAll(arguments[arguments.length - 1]);
        }
    }
    ids.forEach((id, index) => {
        param.path.string(id)(
            TargetsOneController.prototype,
            method("deleteOne"),
            index + 0
        );
    });

    if (generateCondition(rootCtor, relations).targetsMany) {
        return TargetsManyController as any;
    } else {
        return TargetsOneController as any;
    }
}

export function ControllerMixin<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    ctors: Ctor<Model>[],
    scopes: ControllerScope<Model, ModelID, ModelRelations, Controller>[],
    relations: string[],
    basePath: string
): Class<Controller> {
    const rootCtor = ctors[0];
    const rootScope = scopes[0];
    const leafCtor = ctors[ctors.length - 1];
    const leafScope = scopes[scopes.length - 1];

    if ("create" in leafScope) {
        controllerClass = CreateControllerMixin<
            Model,
            ModelID,
            ModelRelations,
            Controller
        >(
            controllerClass,
            rootCtor,
            rootScope,
            leafCtor,
            leafScope,
            relations,
            basePath
        );
    }

    if ("read" in leafScope) {
        controllerClass = ReadControllerMixin<
            Model,
            ModelID,
            ModelRelations,
            Controller
        >(
            controllerClass,
            rootCtor,
            rootScope,
            leafCtor,
            leafScope,
            relations,
            basePath
        );
    }

    if ("update" in leafScope) {
        controllerClass = UpdateControllerMixin<
            Model,
            ModelID,
            ModelRelations,
            Controller
        >(
            controllerClass,
            rootCtor,
            rootScope,
            leafCtor,
            leafScope,
            relations,
            basePath
        );
    }

    if ("delete" in leafScope) {
        controllerClass = DeleteControllerMixin<
            Model,
            ModelID,
            ModelRelations,
            Controller
        >(
            controllerClass,
            rootCtor,
            rootScope,
            leafCtor,
            leafScope,
            relations,
            basePath
        );
    }

    Object.entries(leafScope.include).forEach(([relation, scope]) => {
        /** Check model has relation */
        if (relation in leafCtor.definition.relations) {
            const modelRelation = leafCtor.definition.relations[relation];

            controllerClass = ControllerMixin<any, any, any, Controller>(
                controllerClass,
                [...ctors, modelRelation.target()],
                [...scopes, scope],
                [...relations, relation],
                basePath
            );
        }
    });

    return controllerClass;
}

export function CRUDControllerMixin<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    ctor: Ctor<Model>,
    controllerClass: Class<Controller>,
    scope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    basePath: string
): Class<Controller> {
    return ControllerMixin<Model, ModelID, ModelRelations, Controller>(
        controllerClass,
        [ctor],
        [scope],
        [],
        basePath
    );
}
