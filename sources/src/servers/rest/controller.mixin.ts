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

    class OneController extends parentClass {
        /**
         * Create one method
         *
         * 1. validate
         * 2. exist
         */
        @intercept(exist(rootCtor, rootScope, 1, ids.length + 1, relations))
        @intercept(validate(leafCtor, 0, leafScope.modelCtor.validator))
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
                            exclude: leafScope.modelCtor.exclude,
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
            OneController.prototype,
            method("createOne"),
            index + 1
        );
    });

    class AllController extends OneController {
        /**
         * Create all method
         *
         * 1. validate
         * 2. exist
         */
        @intercept(exist(rootCtor, rootScope, 1, ids.length + 1, relations))
        @intercept(validate(leafCtor, 0, leafScope.modelCtor.validator))
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
                                exclude: leafScope.modelCtor.exclude,
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
    }
    /** Decorate path ids */
    ids.forEach((id, index) => {
        param.path.string(id)(
            AllController.prototype,
            method("createAll"),
            index + 1
        );
    });

    return AllController as any;
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

    class OneController extends parentClass {
        /**
         * Read one method
         *
         * 1. exist
         */
        @intercept(exist(rootCtor, rootScope, 2, ids.length + 2, relations))
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
            OneController.prototype,
            method("readOne"),
            index + 1
        );
    });

    class AllController extends OneController {
        /**
         * Read all method
         *
         * 1. exist
         */
        @intercept(exist(rootCtor, rootScope, 1, ids.length + 1, relations))
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

            // const count = await leafScope
            //     .repositoryGetter(this as any)
            //     .count(filter?.where);
            // this.response.setHeader("X-Total-Count", count.count);

            // return await leafScope.repositoryGetter(this as any).find(
            //     {
            //         ...filter,
            //         where: {
            //             and: [
            //                 { [leafScope.modelCtor.id]: id } as any,
            //                 filter?.where || {},
            //             ],
            //         },
            //     },
            //     {
            //         crud: true,
            //     }
            // );

            return await leafScope.repositoryGetter(this as any).find(filter);
        }
    }
    /** Decorate path ids */
    ids.forEach((id, index) => {
        param.path.string(id)(
            AllController.prototype,
            method("readAll"),
            index + 1
        );
    });

    return AllController as any;
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

    class OneController extends parentClass {
        /**
         * Update one method
         *
         * 1. validate
         * 2. exist
         */
        @intercept(exist(rootCtor, rootScope, 2, ids.length + 2, relations))
        @intercept(validate(leafCtor, 1, leafScope.modelCtor.validator))
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
            OneController.prototype,
            method("updateOne"),
            index + 2
        );
    });

    class AllController extends OneController {
        /**
         * Update all method
         *
         * 1. validate
         * 2. exist
         */
        @intercept(exist(rootCtor, rootScope, 2, ids.length + 2, relations))
        @intercept(validate(leafCtor, 1, leafScope.modelCtor.validator))
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
    }
    /** Decorate path ids */
    ids.forEach((id, index) => {
        param.path.string(id)(
            AllController.prototype,
            method("updateAll"),
            index + 2
        );
    });

    return AllController as any;
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

    class OneController extends parentClass {
        /**
         * Delete one method
         *
         * 1. exist
         */
        @intercept(exist(rootCtor, rootScope, 1, ids.length + 1, relations))
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
            OneController.prototype,
            method("deleteOne"),
            index + 1
        );
    });

    class AllController extends OneController {
        /**
         * Delete all method
         *
         * 1. exist
         */
        @intercept(exist(rootCtor, rootScope, 1, ids.length + 1, relations))
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
    }
    /** Decorate path ids */
    ids.forEach((id, index) => {
        param.path.string(id)(
            AllController.prototype,
            method("deleteAll"),
            index + 1
        );
    });

    return AllController as any;
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
