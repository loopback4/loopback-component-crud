import {
    Interceptor,
    InvocationContext,
    InvocationResult,
    ValueOrPromise,
} from "@loopback/context";
import { Entity, Filter, EntityNotFoundError } from "@loopback/repository";

import { getId } from "./utils";

import { Ctor, ControllerScope } from "../types";

import { CRUDController } from "../servers";

export function limit<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    ctor: Ctor<Model>,
    scope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    argsIdIndex?: number,
    argsWhereIndex?: number,
    argsFilterIndex?: number
): Interceptor {
    return async (
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) => {
        /** Get id from request arguments */
        const id = invocationCtx.args[argsIdIndex || -1];

        /** Get where from request arguments */
        const where = invocationCtx.args[argsWhereIndex || -1];

        /** Get filter from request arguments */
        const filter = invocationCtx.args[argsFilterIndex || -1];

        /** Get model condition from arguments, pushed by exist interceptor */
        const condition = invocationCtx.args[invocationCtx.args.length - 1];

        const limit = await limitFn(scope, {
            ...filter,
            where: {
                and: [
                    id && { [getId(ctor)]: id },
                    where,
                    filter?.where,
                    condition,
                ].filter((condition) => Boolean(condition)),
            },
        });

        if (limit) {
            invocationCtx.args.push(limit);
        } else {
            throw new EntityNotFoundError(ctor, JSON.stringify(limit));
        }

        return next();
    };
}

function limitFn<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    scope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    filter: Filter<Model>
): Filter<Model> {
    if (filter.include) {
        filter.include = filter.include
            .filter((inclusion) => inclusion.relation in scope.include)
            .map((inclusion) => ({
                ...inclusion,
                scope: limitFn(
                    scope.include[inclusion.relation],
                    inclusion.scope || {}
                ),
            }));
    }

    return filter;
}
