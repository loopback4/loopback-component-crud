import {
    Interceptor,
    InvocationContext,
    InvocationResult,
    ValueOrPromise,
} from "@loopback/context";
import { Entity, Filter } from "@loopback/repository";

import { authorize, AuthorizationMetadata } from "@loopback/authorization";

import { mergeAccess, generateRootAccess, generateLeafAccess } from "./utils";

import { ControllerScope } from "../types";

import { CRUDController } from "../servers";

export function access<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    type: "create" | "read" | "update" | "delete",
    rootScope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    leafScope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    relations: string[],
    argIndex: number
): Interceptor {
    return async (
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) => {
        /** Get models or model or filter from request arguments */
        const entity: Model[] | Model | Filter = invocationCtx.args[argIndex];

        const access = await accessFn(
            type,
            rootScope,
            leafScope,
            relations,
            entity
        );

        await authorize(access)(
            invocationCtx.target,
            invocationCtx.methodName,
            {
                value: (...args: any[]) => {
                    console.log(args);
                    // invocationCtx.targetClass
                },
            }
        );

        return next();
    };
}

function accessFn<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    type: "create" | "read" | "update" | "delete",
    rootScope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    leafScope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    relations: string[],
    entity: Model[] | Model | Filter
): AuthorizationMetadata {
    return mergeAccess(
        generateLeafAccess(type, leafScope, entity),
        generateRootAccess(type, rootScope, relations)
    );
}
