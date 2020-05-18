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
    scope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    argIndex: number
): Interceptor {
    return async (
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) => {
        /** Get model from request arguments */
        let models = invocationCtx.args[argIndex];
        if (!Array.isArray(models)) {
            models = [models];
        }

        /** Get model condition from arguments, pushed by exist interceptor */
        const condition = invocationCtx.args[invocationCtx.args.length - 1];

        if (!(await validateFn(models, condition, scope, invocationCtx))) {
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
    models: Model[],
    condition: Model,
    scope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    invocationCtx: InvocationContext
): Promise<boolean> {
    for (let item of models) {
        if (!item) {
            return false;
        }
    }

    if (!(await scope.modelValidator(invocationCtx, models))) {
        return false;
    }

    // map models properties with exist condition
    models.forEach((model: any) =>
        Object.entries(condition).forEach(([property, value]) => {
            model[property] = value;
        })
    );

    return true;
}
