import {
    Interceptor,
    InvocationContext,
    InvocationResult,
    ValueOrPromise
} from "@loopback/context";
import { HttpErrors } from "@loopback/rest";
import { Entity } from "@loopback/repository";
import { Ctor } from "loopback-history-extension";

import { ACLPermissions, FilterScope, RepositoryGetter } from "../types";

export function unique<
    Model extends Entity,
    Permissions extends ACLPermissions,
    Controller
>(
    ctor: Ctor<Model>,
    scope: FilterScope<Model, Permissions, Controller>,
    argIndex: number,
    withoutUnqiue: boolean
): Interceptor {
    return async (
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) => {
        /** Get model from arguments request body */
        let models: any[] = invocationCtx.args[argIndex];
        if (!Array.isArray(models)) {
            models = [models];
        }

        if (
            !(await uniqueFn(
                ctor,
                scope.repositoryGetter,
                models,
                withoutUnqiue,
                invocationCtx
            ))
        ) {
            throw new HttpErrors.Conflict(
                `Conflict with unique fields: ${getUniqueFields(ctor, models)}`
            );
        }

        return next();
    };
}

async function uniqueFn<Model extends Entity, Controller>(
    ctor: Ctor<Model>,
    repositoryGetter: RepositoryGetter<any, Controller>,
    models: Model[],
    withoutUnqiue: boolean,
    invocationCtx: InvocationContext
): Promise<boolean> {
    /** Get repository */
    const repository = repositoryGetter(invocationCtx.target as any);

    /** Find unique fields of model ctor */
    const uniqueFields = getUniqueFields<Model>(ctor, models);

    let count = { count: 0 };

    /** Check for without unique, when using updateAll */
    if (withoutUnqiue) {
        /** Find count of models unique fields */
        count = {
            count: models
                .map(
                    model =>
                        Object.keys(model).filter(
                            modelKey => uniqueFields.indexOf(modelKey) >= 0
                        ).length
                )
                .reduce((prev, current) => prev + current, 0)
        };
    } else if (uniqueFields.length > 0) {
        /** Find count of models where unique field values are same */
        count = await repository.count({
            or: uniqueFields.map(fieldName => ({
                [fieldName]: {
                    inq: models
                        .map((model: any) => model[fieldName])
                        .filter(fieldValue => fieldValue)
                }
            }))
        });
    }

    return count.count <= 0;
}

function getUniqueFields<Model extends Entity>(
    ctor: Ctor<Model>,
    models: Model[]
): string[] {
    /** Find unique fields of model ctor */
    const uniqueFields = Object.entries(ctor.definition.properties)
        .filter(
            ([key, value]) =>
                value.unique || (value.index && value.index.unique)
        )
        .map(([key, value]) => key);

    /** Find unique fields with at least one property in models */
    const uniqueFieldsWithProperties = uniqueFields.filter(
        fieldName =>
            models
                .map((model: any) => model[fieldName])
                .filter(uniqueProperty => uniqueProperty).length > 0
    );

    return uniqueFieldsWithProperties;
}
