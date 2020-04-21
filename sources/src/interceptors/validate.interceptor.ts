import {
    Interceptor,
    InvocationContext,
    InvocationResult,
    ValueOrPromise
} from "@loopback/context";
import { HttpErrors } from "@loopback/rest";
import { Entity } from "@loopback/repository";
import { Ctor } from "loopback-history-extension";

import { ValidateModel } from "../types";

export function validate<Model extends Entity>(
    ctor: Ctor<Model>,
    argIndex: number,
    validator: ValidateModel<Model>
): Interceptor {
    return async (
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) => {
        /** Get model from arguments request body */
        const model = invocationCtx.args[argIndex];

        if (!(await validateFn(ctor, model, validator, invocationCtx))) {
            throw new HttpErrors.UnprocessableEntity("Entity is not valid");
        }

        return next();
    };
}

async function validateFn<Model extends Entity>(
    ctor: Ctor<Model>,
    model: Model,
    validator: ValidateModel<Model>,
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

    return true;
}
