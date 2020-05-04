import {
    Entity,
    Count,
    CountSchema,
    Class,
    Where,
    Filter,
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
import { validate, exist, generateIds, generatePath } from "../../interceptors";
import { Ctor, ControllerScope } from "../../types";

import { CRUDController } from "../../servers";

export function CreateControllerMixin<
    Model extends Entity,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    rootCtor: Ctor<Model>,
    rootScope: ControllerScope<Model, Controller>,
    leafCtor: Ctor<Model>,
    leafScope: ControllerScope<Model, Controller>,
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

    class MixedController extends parentClass {
        /**
         * Create all method
         *
         * 1. validate
         * 2. exist
         */
        // @intercept(exist(rootCtor, rootScope, 0, ids.length, relations))
        @intercept(validate(leafCtor, 0, leafScope.modelValidator))
        @authorize(leafScope.create || {})
        @authenticate("crud")
        @post(`${generatePath(rootCtor, relations, basePath)}`, {
            responses: {
                "200": {
                    description: `Create multiple ${leafCtor.name}`,
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
                                exclude: Object.keys(
                                    leafCtor.definition.properties
                                ).filter(
                                    (key) =>
                                        key === "uid" ||
                                        key === "beginDate" ||
                                        key === "endDate" ||
                                        key === "id"
                                ) as any,
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
             * args[1]: id
             * args[2]: id
             * ...
             * args[n]: id
             *
             */

            return await leafScope
                .repositoryGetter(this as any)
                .createAll(models);
        }

        /**
         * Create one method
         *
         * 1. validate
         * 2. exist
         */
        // @intercept(exist(rootCtor, rootScope, 0, ids.length, relations))
        @intercept(validate(leafCtor, 0, leafScope.modelValidator))
        @authorize(leafScope.create || {})
        @authenticate("crud")
        @post(`${generatePath(rootCtor, relations, basePath)}/one`, {
            responses: {
                "200": {
                    description: `Create single ${leafCtor.name}`,
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
                            exclude: Object.keys(
                                leafCtor.definition.properties
                            ).filter(
                                (key) =>
                                    key === "uid" ||
                                    key === "beginDate" ||
                                    key === "endDate" ||
                                    key === "id"
                            ) as any,
                        }),
                    },
                },
            })
            model: Model
        ): Promise<Model> {
            /**
             * args[0]: Model
             *
             * args[1]: id
             * args[2]: id
             * ...
             * args[n]: id
             */

            return await leafScope.repositoryGetter(this as any).create(model);
        }
    }

    /** Decorate path ids */
    ids.forEach((id, index) => {
        param.path.string(id)(
            MixedController.prototype,
            method("createAll"),
            index + 1
        );
    });
    ids.forEach((id, index) => {
        param.path.string(id)(
            MixedController.prototype,
            method("createOne"),
            index + 1
        );
    });

    return MixedController as any;
}

export function ReadControllerMixin<
    Model extends Entity,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    rootCtor: Ctor<Model>,
    rootScope: ControllerScope<Model, Controller>,
    leafCtor: Ctor<Model>,
    leafScope: ControllerScope<Model, Controller>,
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

    class MixedController extends parentClass {
        /**
         * Read all method
         *
         * 1. exist
         */
        // @intercept(exist(rootCtor, rootScope, 0, ids.length, relations))
        @authorize(leafScope.read || {})
        @authenticate("crud")
        @get(`${generatePath(rootCtor, relations, basePath)}`, {
            responses: {
                "200": {
                    description: `Read multiple ${leafCtor.name} by filter`,
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
            filter: Filter<Model>
        ): Promise<Model[]> {
            /**
             * args[0]: Filter
             *
             * args[1]: id
             * args[2]: id
             * ...
             * args[n]: id
             */

            return await leafScope.repositoryGetter(this as any).find(filter);
        }

        /**
         * Count all method
         *
         * 1. exist
         */
        // @intercept(exist(rootCtor, rootScope, 0, ids.length, relations))
        @authorize(leafScope.read || {})
        @authenticate("crud")
        @get(`${generatePath(rootCtor, relations, basePath)}/count`, {
            responses: {
                "200": {
                    description: `Read ${leafCtor.name} count by where`,
                    content: {
                        "application/json": {
                            schema: CountSchema,
                        },
                    },
                },
            },
        })
        async [method("countAll")](
            @param.query.object("where", getWhereSchemaFor(leafCtor), {
                description: `Where ${leafCtor.name}`,
            })
            where: Where<Model>
        ): Promise<Count> {
            /**
             * args[0]: Where
             *
             * args[1]: id
             * args[2]: id
             * ...
             * args[n]: id
             */

            return await leafScope.repositoryGetter(this as any).count(where);
        }

        /**
         * Read one method
         *
         * 1. exist
         */
        // @intercept(exist(rootCtor, rootScope, 0, ids.length, relations))
        @authorize(leafScope.read || {})
        @authenticate("crud")
        @get(`${generatePath(rootCtor, relations, basePath)}/{id}`, {
            responses: {
                "200": {
                    description: `Read single ${leafCtor.name} by id`,
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
            filter: Filter<Model>
        ): Promise<Model> {
            /**
             * args[0]: id_model
             * args[1]: Filter
             *
             * args[2]: id
             * args[3]: id
             * ...
             * args[n]: id
             */

            return await leafScope
                .repositoryGetter(this as any)
                .findById(id, filter);
        }
    }

    /** Decorate path ids */
    ids.forEach((id, index) => {
        param.path.string(id)(
            MixedController.prototype,
            method("readAll"),
            index + 1
        );
    });
    ids.forEach((id, index) => {
        param.path.string(id)(
            MixedController.prototype,
            method("countAll"),
            index + 1
        );
    });
    ids.forEach((id, index) => {
        param.path.string(id)(
            MixedController.prototype,
            method("readOne"),
            index + 2
        );
    });

    return MixedController as any;
}

export function UpdateControllerMixin<
    Model extends Entity,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    rootCtor: Ctor<Model>,
    rootScope: ControllerScope<Model, Controller>,
    leafCtor: Ctor<Model>,
    leafScope: ControllerScope<Model, Controller>,
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

    class MixedController extends parentClass {
        /**
         * Update all method
         *
         * 1. validate
         * 2. exist
         */
        // @intercept(exist(rootCtor, rootScope, 0, ids.length, relations))
        @intercept(validate(leafCtor, 1, leafScope.modelValidator))
        @authorize(leafScope.update || {})
        @authenticate("crud")
        @put(`${generatePath(rootCtor, relations, basePath)}`, {
            responses: {
                "204": {
                    description: `Update multiple ${leafCtor.name} by where`,
                },
            },
        })
        async [method("updateAll")](
            @param.query.object("where", getWhereSchemaFor(leafCtor), {
                description: `Where ${leafCtor.name}`,
            })
            where: Where<Model>,
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
             * args[0]: Where
             * args[1]: Model
             *
             * args[2]: id
             * args[3]: id
             * ...
             * args[n]: id
             */

            await leafScope
                .repositoryGetter(this as any)
                .updateAll(model, where);
        }

        /**
         * Update one method
         *
         * 1. validate
         * 2. exist
         */
        // @intercept(exist(rootCtor, rootScope, 0, ids.length, relations))
        @intercept(validate(leafCtor, 1, leafScope.modelValidator))
        @authorize(leafScope.update || {})
        @authenticate("crud")
        @put(`${generatePath(rootCtor, relations, basePath)}/{id}`, {
            responses: {
                "204": {
                    description: `Update single ${leafCtor.name} by id`,
                },
            },
        })
        async [method("updateOne")](
            @param.path.string("id") id: string,
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
             * args[0]: id_model
             * args[1]: Model
             *
             * args[2]: id
             * args[3]: id
             * ...
             * args[n]: id
             */

            await leafScope.repositoryGetter(this as any).updateById(id, model);
        }
    }

    /** Decorate path ids */
    ids.forEach((id, index) => {
        param.path.string(id)(
            MixedController.prototype,
            method("updateAll"),
            index + 2
        );
    });
    ids.forEach((id, index) => {
        param.path.string(id)(
            MixedController.prototype,
            method("updateOne"),
            index + 2
        );
    });

    return MixedController as any;
}

export function DeleteControllerMixin<
    Model extends Entity,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    rootCtor: Ctor<Model>,
    rootScope: ControllerScope<Model, Controller>,
    leafCtor: Ctor<Model>,
    leafScope: ControllerScope<Model, Controller>,
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

    class MixedController extends parentClass {
        /**
         * Delete all method
         *
         * 1. exist
         */
        // @intercept(exist(rootCtor, rootScope, 0, ids.length, relations))
        @authorize(leafScope.delete || {})
        @authenticate("crud")
        @del(`${generatePath(rootCtor, relations, basePath)}`, {
            responses: {
                "200": {
                    description: `Delete multiple ${leafCtor.name} by where`,
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
            where: Where<Model>
        ): Promise<Count> {
            /**
             * args[0]: Where
             *
             * args[1]: id
             * args[2]: id
             * ...
             * args[n]: id
             */

            return await leafScope
                .repositoryGetter(this as any)
                .deleteAll(where);
        }

        /**
         * Delete one method
         *
         * 1. exist
         */
        // @intercept(exist(rootCtor, rootScope, 0, ids.length, relations))
        @authorize(leafScope.delete || {})
        @authenticate("crud")
        @del(`${generatePath(rootCtor, relations, basePath)}/{id}`, {
            responses: {
                "204": {
                    description: `Delete single ${leafCtor.name} by id`,
                },
            },
        })
        async [method("deleteOne")](
            @param.path.string("id") id: string
        ): Promise<void> {
            /**
             * args[0]: id_model
             *
             * args[1]: id
             * args[2]: id
             * ...
             * args[n]: id
             */

            await leafScope.repositoryGetter(this as any).deleteById(id);
        }
    }

    /** Decorate path ids */
    ids.forEach((id, index) => {
        param.path.string(id)(
            MixedController.prototype,
            method("deleteAll"),
            index + 1
        );
    });
    ids.forEach((id, index) => {
        param.path.string(id)(
            MixedController.prototype,
            method("deleteOne"),
            index + 1
        );
    });

    return MixedController as any;
}

export function HistoryControllerMixin<
    Model extends Entity,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    rootCtor: Ctor<Model>,
    rootScope: ControllerScope<Model, Controller>,
    leafCtor: Ctor<Model>,
    leafScope: ControllerScope<Model, Controller>,
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

    class MixedController extends parentClass {
        /**
         * History one method
         *
         * 1. exist
         */
        // @intercept(exist(rootCtor, rootScope, 0, ids.length, relations))
        @authorize(leafScope.history || {})
        @authenticate("crud")
        @get(`${generatePath(rootCtor, relations, basePath)}/{id}/history`, {
            responses: {
                "200": {
                    description: `Get ${leafCtor.name} history by filter`,
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
        async [method("historyOne")](
            @param.path.string("id") id: string,
            @param.query.object("filter", getFilterSchemaFor(leafCtor), {
                description: `Filter ${leafCtor.name}`,
            })
            filter?: Filter<Model>
        ): Promise<Model[]> {
            /**
             * args[0]: id_model
             * args[1]: Filter
             *
             * args[2]: id
             * args[3]: id
             * ...
             * args[n]: id
             */

            return await leafScope.repositoryGetter(this as any).find(
                {
                    ...filter,
                    where: {
                        and: [{ id: id }, filter?.where || {}],
                    },
                },
                {
                    crud: true,
                }
            );
        }
    }

    /** Decorate path ids */
    ids.forEach((id, index) => {
        param.path.string(id)(
            MixedController.prototype,
            method("historyOne"),
            index + 2
        );
    });

    return MixedController as any;
}

export function ControllerMixin<
    Model extends Entity,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    ctors: Ctor<Model>[],
    scopes: ControllerScope<Model, Controller>[],
    relations: string[],
    basePath: string
): Class<Controller> {
    const rootCtor = ctors[0];
    const rootScope = scopes[0];
    const leafCtor = ctors[ctors.length - 1];
    const leafScope = scopes[scopes.length - 1];

    if ("create" in leafScope) {
        controllerClass = CreateControllerMixin<Model, Controller>(
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
        controllerClass = ReadControllerMixin<Model, Controller>(
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
        controllerClass = UpdateControllerMixin<Model, Controller>(
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
        controllerClass = DeleteControllerMixin<Model, Controller>(
            controllerClass,
            rootCtor,
            rootScope,
            leafCtor,
            leafScope,
            relations,
            basePath
        );
    }

    if ("history" in leafScope) {
        controllerClass = HistoryControllerMixin<Model, Controller>(
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

            controllerClass = ControllerMixin<any, any>(
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
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    ctor: Ctor<Model>,
    scope: ControllerScope<Model, Controller>,
    basePath: string
): Class<Controller> {
    return ControllerMixin<Model, Controller>(
        controllerClass,
        [ctor],
        [scope],
        [],
        basePath
    );
}
