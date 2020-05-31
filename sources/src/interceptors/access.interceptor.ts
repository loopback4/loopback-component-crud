import {
    Interceptor,
    InvocationContext,
    InvocationResult,
    ValueOrPromise,
} from "@loopback/context";
import { Entity, Filter } from "@loopback/repository";

import { authorize, AuthorizationMetadata } from "@loopback/authorization";

import { Ctor, ControllerScope } from "../types";

import { CRUDController } from "../servers";

export function access<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    type: "create" | "read" | "update" | "delete",
    ctor: Ctor<Model>,
    scope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    argIndex: number
): Interceptor {
    return async (
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) => {
        /** Get models or model or filter from request arguments */
        const entity: Model[] | Model | Filter = invocationCtx.args[argIndex];

        let metadata;
        if (type === "create" && Array.isArray(entity)) {
            // Model[]
            metadata = accessModelsFn(type, ctor, scope, entity as any, {
                ...scope[type],
                voters: [],
                scopes: [],
            });
        } else if (type === "create" || type === "update") {
            // Model
            metadata = accessModelFn(type, ctor, scope, entity as any, {
                ...scope[type],
                voters: [],
                scopes: [],
            });
        } else if (type === "read" || type === "delete") {
            // Filter
            metadata = accessFilterFn(type, ctor, scope, entity as any, {
                ...scope[type],
                voters: [],
                scopes: [],
            });
        }

        if (metadata) {
            await authorize(metadata)(
                invocationCtx.target,
                invocationCtx.methodName,
                {
                    value: invocationCtx.targetClass,
                    writable: true,
                    enumerable: false,
                    configurable: true,
                }
            );
        }

        return next();
    };
}

function accessModelsFn<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    type: "create" | "read" | "update" | "delete",
    ctor: Ctor<Model>,
    scope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    models: Model[],
    metadata: AuthorizationMetadata
): AuthorizationMetadata | undefined {
    metadata.scopes = [...metadata.scopes, scope[]]
    return undefined;
}

function accessModelFn<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    type: "create" | "read" | "update" | "delete",
    ctor: Ctor<Model>,
    scope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    model: Model,
    metadata: AuthorizationMetadata
): AuthorizationMetadata | undefined {
    return undefined;
}

function accessFilterFn<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    type: "create" | "read" | "update" | "delete",
    ctor: Ctor<Model>,
    scope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    filter: Filter,
    metadata: AuthorizationMetadata
): AuthorizationMetadata | undefined {
    return undefined;
}
