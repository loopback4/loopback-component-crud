import { Entity, Count, CountSchema, Class } from "@loopback/repository";
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
    validate,
    exist,
    filter,
    generateIds,
    generatePath,
} from "../../interceptors";
import { Ctor, FilterScope } from "../../types";

import { CRUDController } from "../../servers";

export function CreateControllerMixin<
    Model extends Entity,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    rootCtor: Ctor<Model>,
    rootScope: FilterScope<Model, Controller>,
    leafCtor: Ctor<Model>,
    leafScope: FilterScope<Model, Controller>,
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

    const authorizer = (leafScope as any).create[0];
    const validator = (leafScope as any).create[1];

    const decorateCreateAllMethod = (prototype: any) => {
        /** Add createAll method */
        prototype[method("createAll")] = async function (
            ...args: any[]
        ): Promise<Model[]> {
            /**
             * args[0]: id
             * args[1]: id
             * ...
             * args[n-1]: id
             * args[n]: Model[]
             * args[n+1]: id_exist
             */

            return await leafScope
                .repositoryGetter(this)
                .createAll(args[ids.length]);
        };

        const methodDescriptor = {
            value: prototype[method("createAll")],
            writable: true,
            enumerable: false,
            configurable: true,
        };

        /** Decorate createAll method */
        intercept(exist(rootCtor, rootScope, 0, ids.length, relations))(
            prototype,
            method("createAll"),
            methodDescriptor
        );
        intercept(validate(leafCtor, ids.length, validator))(
            prototype,
            method("createAll"),
            methodDescriptor
        );

        authorize(authorizer)(prototype, method("createAll"), methodDescriptor);
        authenticate("crud")(prototype, method("createAll"), methodDescriptor);

        post(`${generatePath(rootCtor, relations, basePath)}`, {
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
        })(prototype, method("createAll"), methodDescriptor);
    };
    const decorateCreateAllParams = (prototype: any) => {
        /** Decorate createAll parameters */
        ids.forEach((id, index) => {
            param.path.string(id)(prototype, method("createAll"), index);
        });

        requestBody({
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
        })(prototype, method("createAll"), ids.length);
    };
    const decorateCreateAllMetadatas = (prototype: any) => {
        /** Decorate createAll metadata */
        Reflect.metadata("design:type", Function)(
            prototype,
            method("createAll")
        );
        Reflect.metadata("design:paramtypes", [Object])(
            prototype,
            method("createAll")
        );
        Reflect.metadata("design:returntype", Promise)(
            prototype,
            method("createAll")
        );
    };

    const decorateCreateOneMethod = (prototype: any) => {
        /** Add createOne method */
        prototype[method("createOne")] = async function (
            ...args: any[]
        ): Promise<Model> {
            /**
             * args[0]: id
             * args[1]: id
             * ...
             * args[n-1]: id
             * args[n]: Model
             * args[n+1]: id_exist
             */

            return await leafScope
                .repositoryGetter(this)
                .create(args[ids.length]);
        };
        const methodDescriptor = {
            value: prototype[method("createOne")],
            writable: true,
            enumerable: false,
            configurable: true,
        };

        /** Decorate createOne method */
        intercept(exist(rootCtor, rootScope, 0, ids.length, relations))(
            prototype,
            method("createOne"),
            methodDescriptor
        );
        intercept(validate(leafCtor, ids.length, validator))(
            prototype,
            method("createOne"),
            methodDescriptor
        );

        authorize(authorizer)(prototype, method("createOne"), methodDescriptor);
        authenticate("crud")(prototype, method("createOne"), methodDescriptor);

        post(`${generatePath(rootCtor, relations, basePath)}/one`, {
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
        })(prototype, method("createOne"), methodDescriptor);
    };
    const decorateCreateOneParams = (prototype: any) => {
        /** Decorate createOne parameters */
        ids.forEach((id, index) => {
            param.path.string(id)(prototype, method("createOne"), index);
        });

        requestBody({
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
        })(prototype, method("createOne"), ids.length);
    };
    const decorateCreateOneMetadatas = (prototype: any) => {
        /** Decorate createOne metadata */
        Reflect.metadata("design:type", Function)(
            prototype,
            method("createOne")
        );
        Reflect.metadata("design:paramtypes", [Object])(
            prototype,
            method("createOne")
        );
        Reflect.metadata("design:returntype", Promise)(
            prototype,
            method("createOne")
        );
    };

    class MixedController extends parentClass {
        /**
         * Create operations
         *
         * 1. exist
         */
    }

    decorateCreateAllMethod(MixedController.prototype);
    decorateCreateAllParams(MixedController.prototype);
    decorateCreateAllMetadatas(MixedController.prototype);

    decorateCreateOneMethod(MixedController.prototype);
    decorateCreateOneParams(MixedController.prototype);
    decorateCreateOneMetadatas(MixedController.prototype);

    return MixedController as any;
}

export function ReadControllerMixin<
    Model extends Entity,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    rootCtor: Ctor<Model>,
    rootScope: FilterScope<Model, Controller>,
    leafCtor: Ctor<Model>,
    leafScope: FilterScope<Model, Controller>,
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

    const authorizer = (leafScope as any).read[0];

    const decorateReadAllMethod = (prototype: any) => {
        /** Add readAll method */
        prototype[method("readAll")] = async function (
            ...args: any[]
        ): Promise<Model[]> {
            /**
             * args[0]: id
             * args[1]: id
             * ...
             * args[n-1]: id
             * args[n]: Filter
             * args[n+1]: id_exist
             * args[n+2]: Filter_filter
             */

            return await leafScope
                .repositoryGetter(this)
                .find(args[ids.length + 2]);
        };

        const methodDescriptor = {
            value: prototype[method("readAll")],
            writable: true,
            enumerable: false,
            configurable: true,
        };

        /** Decorate readAll method */
        intercept(
            filter(
                leafCtor,
                leafScope,
                "read",
                "filter",
                ids.length + 1,
                undefined,
                { index: ids.length, type: "filter" }
            )
        )(prototype, method("readAll"), methodDescriptor);
        intercept(exist(rootCtor, rootScope, 0, ids.length, relations))(
            prototype,
            method("readAll"),
            methodDescriptor
        );

        authorize(authorizer)(prototype, method("readAll"), methodDescriptor);
        authenticate("crud")(prototype, method("readAll"), methodDescriptor);

        get(`${generatePath(rootCtor, relations, basePath)}`, {
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
        })(prototype, method("readAll"), methodDescriptor);
    };
    const decorateReadAllParams = (prototype: any) => {
        /** Decorate readAll arguments */
        ids.forEach((id, index) => {
            param.path.string(id)(prototype, method("readAll"), index);
        });

        param.query.object("filter", getFilterSchemaFor(leafCtor), {
            description: `Filter ${leafCtor.name}`,
        })(prototype, method("readAll"), ids.length);
    };
    const decorateReadAllMetadatas = (prototype: any) => {
        /** Decorate readAll metadata */
        Reflect.metadata("design:type", Function)(prototype, method("readAll"));
        Reflect.metadata("design:paramtypes", [Object])(
            prototype,
            method("readAll")
        );
        Reflect.metadata("design:returntype", Promise)(
            prototype,
            method("readAll")
        );
    };

    const decorateCountAllMethod = (prototype: any) => {
        /** Add countAll method */
        prototype[method("countAll")] = async function (
            ...args: any[]
        ): Promise<Count> {
            /**
             * args[0]: id
             * args[1]: id
             * ...
             * args[n-1]: id
             * args[n]: Where
             * args[n+1]: id_exist
             * args[n+2]: Where_filter
             */

            return await leafScope
                .repositoryGetter(this)
                .count(args[ids.length + 2]);
        };

        const methodDescriptor = {
            value: prototype[method("countAll")],
            writable: true,
            enumerable: false,
            configurable: true,
        };

        /** Decorate countAll method */
        intercept(
            filter(
                leafCtor,
                leafScope,
                "read",
                "where",
                ids.length + 1,
                undefined,
                { index: ids.length, type: "where" }
            )
        )(prototype, method("countAll"), methodDescriptor);
        intercept(exist(rootCtor, rootScope, 0, ids.length, relations))(
            prototype,
            method("countAll"),
            methodDescriptor
        );

        authorize(authorizer)(prototype, method("countAll"), methodDescriptor);
        authenticate("crud")(prototype, method("countAll"), methodDescriptor);

        get(`${generatePath(rootCtor, relations, basePath)}/count`, {
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
        })(prototype, method("countAll"), methodDescriptor);
    };
    const decorateCountAllParams = (prototype: any) => {
        /** Decorate countAll arguments */
        ids.forEach((id, index) => {
            param.path.string(id)(prototype, method("countAll"), index);
        });

        param.query.object("where", getWhereSchemaFor(leafCtor), {
            description: `Where ${leafCtor.name}`,
        })(prototype, method("countAll"), ids.length);
    };
    const decorateCountAllMetadatas = (prototype: any) => {
        /** Decorate countAll metadata */
        Reflect.metadata("design:type", Function)(
            prototype,
            method("countAll")
        );
        Reflect.metadata("design:paramtypes", [Object])(
            prototype,
            method("countAll")
        );
        Reflect.metadata("design:returntype", Promise)(
            prototype,
            method("countAll")
        );
    };

    const decorateReadOneMethod = (prototype: any) => {
        /** Add readOne method */
        prototype[method("readOne")] = async function (
            ...args: any[]
        ): Promise<Model> {
            /**
             * args[0]: id
             * args[1]: id
             * ...
             * args[n-1]: id
             * args[n]: id_model
             * args[n+1]: Filter
             * args[n+2]: id_exist
             * args[n+3]: Filter_filter
             */

            return await leafScope
                .repositoryGetter(this)
                .findOne(args[ids.length + 3]);
        };
        const methodDescriptor = {
            value: prototype[method("readOne")],
            writable: true,
            enumerable: false,
            configurable: true,
        };

        /** Decorate readOne method */
        intercept(
            filter(
                leafCtor,
                leafScope,
                "read",
                "filter",
                ids.length + 2,
                ids.length,
                { index: ids.length + 1, type: "filter" }
            )
        )(prototype, method("readOne"), methodDescriptor);
        intercept(exist(rootCtor, rootScope, 0, ids.length, relations))(
            prototype,
            method("readOne"),
            methodDescriptor
        );

        authorize(authorizer)(prototype, method("readOne"), methodDescriptor);
        authenticate("crud")(prototype, method("readOne"), methodDescriptor);

        get(`${generatePath(rootCtor, relations, basePath)}/{id}`, {
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
        })(prototype, method("readOne"), methodDescriptor);
    };
    const decorateReadOneParams = (prototype: any) => {
        /** Decorate readOne arguments */
        ids.forEach((id, index) => {
            param.path.string(id)(prototype, method("readOne"), index);
        });

        param.path.string("id")(prototype, method("readOne"), ids.length);
        param.query.object("filter", getFilterSchemaFor(leafCtor), {
            description: `Filter ${leafCtor.name}`,
        })(prototype, method("readOne"), ids.length + 1);
    };
    const decorateReadOneMetadatas = (prototype: any) => {
        /** Decorate readOne metadata */
        Reflect.metadata("design:type", Function)(prototype, method("readOne"));
        Reflect.metadata("design:paramtypes", [Object])(
            prototype,
            method("readOne")
        );
        Reflect.metadata("design:returntype", Promise)(
            prototype,
            method("readOne")
        );
    };

    class MixedController extends parentClass {
        /**
         * Read operations
         *
         * 1. exist
         * 2. filter
         */
    }

    decorateReadAllMethod(MixedController.prototype);
    decorateReadAllParams(MixedController.prototype);
    decorateReadAllMetadatas(MixedController.prototype);

    decorateCountAllMethod(MixedController.prototype);
    decorateCountAllParams(MixedController.prototype);
    decorateCountAllMetadatas(MixedController.prototype);

    decorateReadOneMethod(MixedController.prototype);
    decorateReadOneParams(MixedController.prototype);
    decorateReadOneMetadatas(MixedController.prototype);

    return MixedController as any;
}

export function UpdateControllerMixin<
    Model extends Entity,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    rootCtor: Ctor<Model>,
    rootScope: FilterScope<Model, Controller>,
    leafCtor: Ctor<Model>,
    leafScope: FilterScope<Model, Controller>,
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

    const authorizer = (leafScope as any).update[0];
    const validator = (leafScope as any).update[2];

    const decorateUpdateAllMethod = (prototype: any) => {
        /** Add updateAll method */
        prototype[method("updateAll")] = async function (
            ...args: any[]
        ): Promise<void> {
            /**
             * args[0]: id
             * args[1]: id
             * ...
             * args[n-1]: id
             * args[n]: Model
             * args[n+1]: Where
             * args[n+2]: id_exist,
             * args[n+3]: Where_filter
             */

            await leafScope
                .repositoryGetter(this)
                .updateAll(args[ids.length], args[ids.length + 3]);
        };

        const methodDescriptor = {
            value: prototype[method("updateAll")],
            writable: true,
            enumerable: false,
            configurable: true,
        };

        /** Decorate updateAll method */
        intercept(
            filter(
                leafCtor,
                leafScope,
                "update",
                "where",
                ids.length + 2,
                undefined,
                { index: ids.length + 1, type: "where" }
            )
        )(prototype, method("updateAll"), methodDescriptor);
        intercept(exist(rootCtor, rootScope, 0, ids.length, relations))(
            prototype,
            method("updateAll"),
            methodDescriptor
        );
        intercept(validate(leafCtor, ids.length, validator))(
            prototype,
            method("updateAll"),
            methodDescriptor
        );

        authorize(authorizer)(prototype, method("updateAll"), methodDescriptor);
        authenticate("crud")(prototype, method("updateAll"), methodDescriptor);

        put(`${generatePath(rootCtor, relations, basePath)}`, {
            responses: {
                "204": {
                    description: `Update multiple ${leafCtor.name} by where`,
                },
            },
        })(prototype, method("updateAll"), methodDescriptor);
    };
    const decorateUpdateAllParams = (prototype: any) => {
        /** Decorate updateAll arguments */
        ids.forEach((id, index) => {
            param.path.string(id)(prototype, method("updateAll"), index);
        });

        requestBody({
            content: {
                "application/json": {
                    schema: getModelSchemaRef(leafCtor, { partial: true }),
                },
            },
        })(prototype, method("updateAll"), ids.length);
        param.query.object("where", getWhereSchemaFor(leafCtor), {
            description: `Where ${leafCtor.name}`,
        })(prototype, method("updateAll"), ids.length + 1);
    };
    const decorateUpdateAllMetadatas = (prototype: any) => {
        /** Decorate updateAll metadata */
        Reflect.metadata("design:type", Function)(
            prototype,
            method("updateAll")
        );
        Reflect.metadata("design:paramtypes", [Object])(
            prototype,
            method("updateAll")
        );
        Reflect.metadata("design:returntype", Promise)(
            prototype,
            method("updateAll")
        );
    };

    const decorateUpdateOneMethod = (prototype: any) => {
        /** Add updateOne method */
        prototype[method("updateOne")] = async function (
            ...args: any[]
        ): Promise<void> {
            /**
             * args[0]: id
             * args[1]: id
             * ...
             * args[n-1]: id
             * args[n]: Model
             * args[n+1]: id_model
             * args[n+2]: id_exist
             * args[n+3]: Where_filter
             */

            await leafScope
                .repositoryGetter(this)
                .updateAll(args[ids.length], args[ids.length + 3]);
        };
        const methodDescriptor = {
            value: prototype[method("updateOne")],
            writable: true,
            enumerable: false,
            configurable: true,
        };

        /** Decorate updateOne method */
        intercept(
            filter(
                leafCtor,
                leafScope,
                "update",
                "where",
                ids.length + 2,
                ids.length + 1,
                undefined
            )
        )(prototype, method("updateOne"), methodDescriptor);
        intercept(exist(rootCtor, rootScope, 0, ids.length, relations))(
            prototype,
            method("updateOne"),
            methodDescriptor
        );
        intercept(validate(leafCtor, ids.length, validator))(
            prototype,
            method("updateOne"),
            methodDescriptor
        );

        authorize(authorizer)(prototype, method("updateOne"), methodDescriptor);
        authenticate("crud")(prototype, method("updateOne"), methodDescriptor);

        put(`${generatePath(rootCtor, relations, basePath)}/{id}`, {
            responses: {
                "204": {
                    description: `Update single ${leafCtor.name} by id`,
                },
            },
        })(prototype, method("updateOne"), methodDescriptor);
    };
    const decorateUpdateOneParams = (prototype: any) => {
        /** Decorate updateOne arguments */
        ids.forEach((id, index) => {
            param.path.string(id)(prototype, method("updateOne"), index);
        });

        requestBody({
            content: {
                "application/json": {
                    schema: getModelSchemaRef(leafCtor, { partial: true }),
                },
            },
        })(prototype, method("updateOne"), ids.length);
        param.path.string("id")(prototype, method("updateOne"), ids.length + 1);
    };
    const decorateUpdateOneMetadatas = (prototype: any) => {
        /** Decorate updateOne metadata */
        Reflect.metadata("design:type", Function)(
            prototype,
            method("updateOne")
        );
        Reflect.metadata("design:paramtypes", [Object])(
            prototype,
            method("updateOne")
        );
        Reflect.metadata("design:returntype", Promise)(
            prototype,
            method("updateOne")
        );
    };

    class MixedController extends parentClass {
        /**
         * Update operations
         *
         * 1. exist
         * 2. filter
         */
    }

    decorateUpdateAllMethod(MixedController.prototype);
    decorateUpdateAllParams(MixedController.prototype);
    decorateUpdateAllMetadatas(MixedController.prototype);

    decorateUpdateOneMethod(MixedController.prototype);
    decorateUpdateOneParams(MixedController.prototype);
    decorateUpdateOneMetadatas(MixedController.prototype);

    return MixedController as any;
}

export function DeleteControllerMixin<
    Model extends Entity,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    rootCtor: Ctor<Model>,
    rootScope: FilterScope<Model, Controller>,
    leafCtor: Ctor<Model>,
    leafScope: FilterScope<Model, Controller>,
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

    const authorizer = (leafScope as any).delete[0];

    const decorateDeleteAllMethod = (prototype: any) => {
        /** Add deleteAll method */
        prototype[method("deleteAll")] = async function (
            ...args: any[]
        ): Promise<Count> {
            /**
             * args[0]: id
             * args[1]: id
             * ...
             * args[n-1]: id
             * args[n]: Where
             * args[n+1]: id_exist
             * args[n+2]: Where_filter
             */

            return await leafScope
                .repositoryGetter(this)
                .deleteAll(args[ids.length + 2]);
        };

        const methodDescriptor = {
            value: prototype[method("deleteAll")],
            writable: true,
            enumerable: false,
            configurable: true,
        };

        /** Decorate deleteAll method */
        intercept(
            filter(
                leafCtor,
                leafScope,
                "delete",
                "where",
                ids.length + 1,
                undefined,
                { index: ids.length, type: "where" }
            )
        )(prototype, method("deleteAll"), methodDescriptor);
        intercept(exist(rootCtor, rootScope, 0, ids.length, relations))(
            prototype,
            method("deleteAll"),
            methodDescriptor
        );

        authorize(authorizer)(prototype, method("deleteAll"), methodDescriptor);
        authenticate("crud")(prototype, method("deleteAll"), methodDescriptor);

        del(`${generatePath(rootCtor, relations, basePath)}`, {
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
        })(prototype, method("deleteAll"), methodDescriptor);
    };
    const decorateDeleteAllParams = (prototype: any) => {
        /** Decorate deleteAll arguments */
        ids.forEach((id, index) => {
            param.path.string(id)(prototype, method("deleteAll"), index);
        });

        param.query.object("where", getWhereSchemaFor(leafCtor), {
            description: `Where ${leafCtor.name}`,
        })(prototype, method("deleteAll"), ids.length);
    };
    const decorateDeleteAllMetadatas = (prototype: any) => {
        /** Decorate deleteAll metadata */
        Reflect.metadata("design:type", Function)(
            prototype,
            method("deleteAll")
        );
        Reflect.metadata("design:paramtypes", [Object])(
            prototype,
            method("deleteAll")
        );
        Reflect.metadata("design:returntype", Promise)(
            prototype,
            method("deleteAll")
        );
    };

    const decorateDeleteOneMethod = (prototype: any) => {
        /** Add deleteOne method */
        prototype[method("deleteOne")] = async function (
            ...args: any[]
        ): Promise<Count> {
            /**
             * args[0]: id
             * args[1]: id
             * ...
             * args[n-1]: id
             * args[n]: id_model
             * args[n+1]: id_exist
             * args[n+2]: Where_filter
             */

            return await leafScope
                .repositoryGetter(this)
                .deleteAll(args[ids.length + 2]);
        };
        const methodDescriptor = {
            value: prototype[method("deleteOne")],
            writable: true,
            enumerable: false,
            configurable: true,
        };

        /** Decorate deleteOne method */
        intercept(
            filter(
                leafCtor,
                leafScope,
                "delete",
                "where",
                ids.length + 1,
                ids.length,
                undefined
            )
        )(prototype, method("deleteOne"), methodDescriptor);
        intercept(exist(rootCtor, rootScope, 0, ids.length, relations))(
            prototype,
            method("deleteOne"),
            methodDescriptor
        );

        authorize(authorizer)(prototype, method("deleteOne"), methodDescriptor);
        authenticate("crud")(prototype, method("deleteOne"), methodDescriptor);

        del(`${generatePath(rootCtor, relations, basePath)}/{id}`, {
            responses: {
                "200": {
                    description: `Delete single ${leafCtor.name} by id`,
                    content: {
                        "application/json": {
                            schema: CountSchema,
                        },
                    },
                },
            },
        })(prototype, method("deleteOne"), methodDescriptor);
    };
    const decorateDeleteOneParams = (prototype: any) => {
        /** Decorate deleteOne arguments */
        ids.forEach((id, index) => {
            param.path.string(id)(prototype, method("deleteOne"), index);
        });

        param.path.string("id")(prototype, method("deleteOne"), ids.length);
    };
    const decorateDeleteOneMetadatas = (prototype: any) => {
        /** Decorate deleteOne metadata */
        Reflect.metadata("design:type", Function)(
            prototype,
            method("deleteOne")
        );
        Reflect.metadata("design:paramtypes", [Object])(
            prototype,
            method("deleteOne")
        );
        Reflect.metadata("design:returntype", Promise)(
            prototype,
            method("deleteOne")
        );
    };

    class MixedController extends parentClass {
        /**
         * Delete operations
         *
         * 1. exist
         * 2. filter
         */
    }

    decorateDeleteAllMethod(MixedController.prototype);
    decorateDeleteAllParams(MixedController.prototype);
    decorateDeleteAllMetadatas(MixedController.prototype);

    decorateDeleteOneMethod(MixedController.prototype);
    decorateDeleteOneParams(MixedController.prototype);
    decorateDeleteOneMetadatas(MixedController.prototype);

    return MixedController as any;
}

export function HistoryControllerMixin<
    Model extends Entity,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    rootCtor: Ctor<Model>,
    rootScope: FilterScope<Model, Controller>,
    leafCtor: Ctor<Model>,
    leafScope: FilterScope<Model, Controller>,
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

    const authorizer = (leafScope as any).history[0];

    const decorateHistoryOneMethod = (prototype: any) => {
        /** Add historyOne method */
        prototype[method("historyOne")] = async function (
            ...args: any[]
        ): Promise<Model[]> {
            /**
             * args[0]: id
             * args[1]: id
             * ...
             * args[n-1]: id
             * args[n]: id_model
             * args[n+1]: Filter
             * args[n+2]: id_exist
             * args[n+3]: Filter_filter
             */

            return await leafScope
                .repositoryGetter(this)
                .find(args[ids.length + 3], {
                    crud: true,
                });
        };
        const methodDescriptor = {
            value: prototype[method("historyOne")],
            writable: true,
            enumerable: false,
            configurable: true,
        };

        /** Decorate historyOne method */
        intercept(
            filter(
                leafCtor,
                leafScope,
                "history",
                "filter",
                ids.length + 2,
                ids.length,
                { index: ids.length + 1, type: "filter" }
            )
        )(prototype, method("historyOne"), methodDescriptor);
        intercept(exist(rootCtor, rootScope, 0, ids.length, relations))(
            prototype,
            method("historyOne"),
            methodDescriptor
        );

        authorize(authorizer)(
            prototype,
            method("historyOne"),
            methodDescriptor
        );
        authenticate("crud")(prototype, method("historyOne"), methodDescriptor);

        get(`${generatePath(rootCtor, relations, basePath)}/{id}/history`, {
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
        })(prototype, method("historyOne"), methodDescriptor);
    };
    const decorateHistoryOneParams = (prototype: any) => {
        /** Decorate historyOne arguments */
        ids.forEach((id, index) => {
            param.path.string(id)(prototype, method("historyOne"), index);
        });

        param.path.string("id")(prototype, method("historyOne"), ids.length);
        param.query.object("filter", getFilterSchemaFor(leafCtor), {
            description: `Filter ${leafCtor.name}`,
        })(prototype, method("historyOne"), ids.length + 1);
    };
    const decorateHistoryOneMetadatas = (prototype: any) => {
        /** Decorate historyOne metadata */
        Reflect.metadata("design:type", Function)(
            prototype,
            method("historyOne")
        );
        Reflect.metadata("design:paramtypes", [Object])(
            prototype,
            method("historyOne")
        );
        Reflect.metadata("design:returntype", Promise)(
            prototype,
            method("historyOne")
        );
    };

    class MixedController extends parentClass {
        /**
         * History operations
         *
         * 1. exist
         * 2. filter
         */
    }

    decorateHistoryOneMethod(MixedController.prototype);
    decorateHistoryOneParams(MixedController.prototype);
    decorateHistoryOneMetadatas(MixedController.prototype);

    return MixedController as any;
}

export function ControllerMixin<
    Model extends Entity,
    Controller extends CRUDController
>(
    controllerClass: Class<Controller>,
    ctors: Ctor<Model>[],
    scopes: FilterScope<Model, Controller>[],
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

    controllerClass = ReadControllerMixin<Model, Controller>(
        controllerClass,
        rootCtor,
        rootScope,
        leafCtor,
        leafScope,
        relations,
        basePath
    );

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
    scope: FilterScope<Model, Controller>,
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
