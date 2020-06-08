import {
    globalInterceptor,
    Interceptor,
    InvocationContext,
    InvocationResult,
    Provider,
    ValueOrPromise,
} from "@loopback/context";
import { Entity, Filter } from "@loopback/repository";

import { getId } from "./utils";

import { Ctor, ControllerScope } from "../types";
import { getCRUDMetadata } from "../decorators";
import { CRUDController } from "../servers";

@globalInterceptor("crud", { tags: { name: "limit" } })
export class LimitInterceptor implements Provider<Interceptor> {
    value() {
        return this.intercept.bind(this);
    }

    async intercept(
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) {
        try {
            const metadata = getCRUDMetadata(
                invocationCtx.target,
                invocationCtx.methodName
            );

            if (metadata) {
                /** Get id from request arguments */
                const id = invocationCtx.args[metadata.idIndex as number];

                /** Get filter from request arguments */
                const filter =
                    invocationCtx.args[metadata.filterIndex as number];

                /** Get model condition from arguments, pushed by exist interceptor */
                const condition =
                    invocationCtx.args[invocationCtx.args.length - 1];

                const limit = await limitFn(type, scope, {
                    ...filter,
                    where: {
                        and: [
                            id && { [getId(ctor)]: id },
                            filter?.where,
                            condition,
                        ].filter(
                            (condition) =>
                                Boolean(condition) &&
                                Object.keys(condition).length > 0
                        ),
                    },
                });

                invocationCtx.args.push(limit);
            }

            const result = await next();

            return result;
        } catch (err) {
            throw err;
        }
    }

    private limitModel<Model extends Entity>(
        model: Model,
        condition: Model
    ): Model {
        return {} as any;
    }

    private limitFilter<Model extends Entity>(
        filter: Filter,
        condition: Model
    ) {}

    private limitFn<
        Model extends Entity,
        ModelID,
        ModelRelations extends object,
        Controller extends CRUDController
    >(
        type: "create" | "read" | "update" | "delete",
        scope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
        filter: Filter<Model>
    ): Filter<Model> | undefined {
        if (filter.include) {
            filter.include = filter.include
                .filter(
                    (inclusion) =>
                        inclusion.relation in scope.include &&
                        type in scope.include[inclusion.relation]
                )
                .map((inclusion) => ({
                    ...inclusion,
                    scope: limitFn(
                        type,
                        scope.include[inclusion.relation],
                        inclusion.scope || {}
                    ),
                }));
        }

        return filter;
    }
}
