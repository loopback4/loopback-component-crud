import {
    Interceptor,
    InvocationContext,
    InvocationResult,
    ValueOrPromise,
} from "@loopback/context";
import { HttpErrors } from "@loopback/rest";
import { Entity } from "@loopback/repository";

import { Ctor, ModelValidator } from "../types";

export function limit<Model extends Entity>(
    ctor: Ctor<Model>,
    argIndex: number,
    validator: ModelValidator<Model>
): Interceptor {
    return async (
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) => {
        /** Get model from arguments request body */
        const model = invocationCtx.args[argIndex];

        // if (!(await validateFn(ctor, model, validator, invocationCtx))) {
        //     throw new HttpErrors.UnprocessableEntity("Entity is not valid");
        // }

        return next();
    };
}
