import {
    Interceptor,
    InvocationContext,
    InvocationResult,
    ValueOrPromise,
} from "@loopback/context";
import { HttpErrors } from "@loopback/rest";
import { Entity } from "@loopback/repository";

import { ModelValidator } from "../types";

export function validate<Model extends Entity>(
    validator: ModelValidator<Model>,
    argIndex: number
): Interceptor {
    return async (
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) => {
        /** Get model from arguments request body */
        const model = invocationCtx.args[argIndex];

        /** Get model condition from arguments, pushed by exists interceptor */
        const condition = invocationCtx.args[invocationCtx.args.length - 1];

        if (!(await validateFn(model, condition, validator, invocationCtx))) {
            throw new HttpErrors.UnprocessableEntity("Entity is not valid");
        }

        return next();
    };
}

async function validateFn<Model extends Entity>(
    model: Model,
    condition: Model,
    validator: ModelValidator<Model>,
    invocationCtx: InvocationContext
): Promise<boolean> {
    if (Array.isArray(model)) {
        for (let item of model) {
            if (!item) {
                return false;
            }
        }

        if (!(await validator(invocationCtx, model))) {
            return false;
        }
    } else {
        if (!model) {
            return false;
        }

        if (!(await validator(invocationCtx, [model]))) {
            return false;
        }
    }

    // map model properties with exists condition
    Object.entries(condition).forEach(([property, value]) => {
        (model as any)[property] = value;
    });

    return true;
}
