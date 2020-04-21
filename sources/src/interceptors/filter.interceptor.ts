import {
    Interceptor,
    InvocationContext,
    InvocationResult,
    ValueOrPromise,
} from "@loopback/context";
import { Entity, Where, Filter } from "@loopback/repository";
import { Ctor } from "loopback-component-history";
import { authorizeFn } from "loopback-component-authorization";

import { ACLPermissions, FilterScope } from "../types";

import { ACLController } from "../servers";

export function filter<
    Model extends Entity,
    Permissions extends ACLPermissions,
    Controller
>(
    ctor: Ctor<Model>,
    scope: FilterScope<Model, Permissions, Controller>,
    access: "read" | "update" | "delete" | "history",
    outputType: "where" | "filter",
    pathId?: number,
    modelId?: number | ((controller: Controller) => string),
    modelFilter?: { index: number; type: "where" | "filter" }
): Interceptor {
    return async (
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) => {
        let idWhere: Where<any> = {};

        /** Apply modelId filter */
        if (modelId) {
            const modelIdProperty =
                "id" in ctor.definition.properties
                    ? "id"
                    : ctor.getIdProperties()[0];

            if (typeof modelId === "number") {
                idWhere[modelIdProperty] = invocationCtx.args[modelId];
            } else {
                idWhere[modelIdProperty] = modelId(invocationCtx.target as any);
            }
        }

        /** Apply pathId filter */
        if (pathId) {
            const existId = invocationCtx.args[pathId];

            if (existId) {
                if (Array.isArray(existId.property)) {
                    idWhere = {
                        and: [
                            idWhere,
                            {
                                or: existId.property.map(
                                    (idProperty: string) => ({
                                        [idProperty]: existId.value,
                                    })
                                ),
                            },
                        ],
                    };
                } else {
                    idWhere[existId.property] = existId.value;
                }
            }
        }

        /** Get filter from modelFilter argument */
        let result: Filter<any> = {};
        if (modelFilter) {
            if (modelFilter.type === "where") {
                result.where = invocationCtx.args[modelFilter.index];
            } else {
                result = invocationCtx.args[modelFilter.index] || {};
            }
        }
        if (result.where) {
            result.where = { and: [idWhere, result.where] };
        } else {
            result.where = idWhere;
        }

        result = await filterFn(ctor, scope, access, result, invocationCtx);

        if (outputType === "where") {
            result = result.where as any;
        }

        invocationCtx.args.push(result);

        return next();
    };
}

export async function filterFn<
    Model extends Entity,
    Permissions extends ACLPermissions,
    Controller
>(
    ctor: Ctor<Model>,
    scope: FilterScope<Model, Permissions, Controller>,
    access: "read" | "update" | "delete" | "history",
    filter: Filter<Model> = {},
    invocationCtx: InvocationContext
): Promise<Filter<Model>> {
    const modelAccess = scope[access];
    const modelIdProperty =
        "id" in ctor.definition.properties ? "id" : ctor.getIdProperties()[0];

    /** Check access object exists */
    if (!modelAccess) {
        return {
            where: { [modelIdProperty]: null },
        } as any;
    }

    /** Apply filter on `where` */
    filter.where = await modelAccess[1](invocationCtx, filter.where || {});

    /** Apply filter on `include` by scope and filter */
    if (filter.include) {
        /** Remove inclusions that not exist in `model` or `scope` relations */
        filter.include = filter.include.filter(
            (inclusion) =>
                inclusion.relation in ctor.definition.relations &&
                inclusion.relation in scope.include
        );

        /**
         * Remove inclusions that hasn't access permission
         * Remove undefined inclusions
         * */
        filter.include = (
            await Promise.all(
                filter.include.map(async (inclusion) => {
                    const modelAccess =
                        scope.include[inclusion.relation][access];

                    if (modelAccess) {
                        if (
                            await authorizeFn<any>(
                                modelAccess[0],
                                (invocationCtx.target as ACLController).session
                                    .permissions,
                                invocationCtx
                            )
                        ) {
                            return inclusion;
                        }
                    }

                    return undefined;
                })
            )
        ).filter((inclusion) => inclusion) as any[];

        /** Filter inclusion scope (Filter), recursively */
        filter.include = await Promise.all(
            filter.include.map(async (inclusion) => {
                const modelRelation =
                    ctor.definition.relations[inclusion.relation];

                inclusion.scope = await filterFn<any, Permissions, Controller>(
                    modelRelation.target(),
                    scope.include[inclusion.relation],
                    access,
                    inclusion.scope,
                    invocationCtx
                );

                return inclusion;
            })
        );
    }

    return filter;
}
