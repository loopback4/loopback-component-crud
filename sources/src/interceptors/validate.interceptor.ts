import {
    Interceptor,
    InvocationContext,
    InvocationResult,
    ValueOrPromise,
} from "@loopback/context";
import { HttpErrors } from "@loopback/rest";
import { Entity } from "@loopback/repository";

import { ControllerScope } from "../types";

import { CRUDController } from "../servers";

export function validate<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    type: "create" | "read" | "update" | "delete",
    scope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    argIndex: number
): Interceptor {
    return async (
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) => {
        /** Get model or models from request arguments */
        const models: Model | Model[] = invocationCtx.args[argIndex];

        /** Get model condition from arguments, pushed by exist interceptor */
        const condition = invocationCtx.args[invocationCtx.args.length - 1];

        const entities = await validateFn(
            type,
            scope,
            [].concat(models as any),
            condition,
            invocationCtx
        );

        if (entities && entities.length > 0) {
            invocationCtx.args[argIndex] = Array.isArray(models)
                ? entities
                : entities[0];
        } else {
            throw new HttpErrors.UnprocessableEntity("Entity is not valid");
        }

        return next();
    };
}

async function validateFn<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    type: "create" | "read" | "update" | "delete",
    scope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    models: Model[],
    condition: Model,
    invocationCtx: InvocationContext
): Promise<Model[]> {
    const result = models
        .filter((model) => type in scope && model)
        .map((model) =>
            Object.fromEntries<any>(
                Object.entries(model)
                    .filter(([key, value]) => {
                        if (typeof value === "object") {
                            if (Array.isArray(value)) {
                            } else {
                            }
                        }

                        return true;
                    })
                    // map models properties with exist condition
                    .map(([key, value]) =>
                        key in condition
                            ? [key, value]
                            : [key, (condition as any)[key]]
                    )
            )
        );

    if (!(await scope.modelValidator(invocationCtx, models))) {
        return false;
    }

    models.forEach((model: any) =>
        Object.entries(condition).forEach(([property, value]) => {
            model[property] = value;
        })
    );
}
