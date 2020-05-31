import {
    Interceptor,
    InvocationContext,
    InvocationResult,
    ValueOrPromise,
} from "@loopback/context";
import { HttpErrors } from "@loopback/rest";
import { Entity, RelationType } from "@loopback/repository";

import { Ctor, ControllerScope } from "../types";

import { CRUDController } from "../servers";

export function validate<
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
        /** Get models or model from request arguments */
        const models: Model[] | Model = invocationCtx.args[argIndex];

        /** Get model condition from arguments, pushed by exist interceptor */
        const condition = invocationCtx.args[invocationCtx.args.length - 1];

        const entities = await validateFn(
            type,
            ctor,
            scope,
            [].concat(models as any),
            condition,
            invocationCtx
        );

        invocationCtx.args[argIndex] = Array.isArray(models)
            ? entities
            : entities[0];

        if (!invocationCtx.args[argIndex]) {
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
    ctor: Ctor<Model>,
    scope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    models: Model[],
    condition: Model,
    invocationCtx: InvocationContext
): Promise<Model[]> {
    const entities = await scope.modelMapper(
        invocationCtx,
        models.map<any>((model) => {
            const modelProps = Object.entries(model).filter(
                ([_, value]) => typeof value !== "object"
            );

            return {
                ...Object.fromEntries(modelProps),
                ...condition,
            };
        })
    );

    const entitiesIncludeRelations = entities.map(async (entity, index) => {
        /** Check entity is not filtered by modelMapper */
        if (!entity) {
            return undefined;
        }

        const relationProps = Object.entries(models[index])
            .filter(([_, value]) => typeof value === "object")
            .filter(
                ([key, _]) => key in scope.include && type in scope.include[key]
            )
            .filter(
                ([key, _]) =>
                    key in ctor.definition.relations &&
                    ctor.definition.relations[key].type !==
                        RelationType.belongsTo
            )
            .map(async ([key, value]) => {
                const validatedValue = await validateFn(
                    type,
                    ctor.definition.relations[key].target(),
                    scope.include[key],
                    [].concat(value),
                    {},
                    invocationCtx
                );

                return [
                    key,
                    Array.isArray(value) ? validatedValue : validatedValue[0],
                ];
            });

        const filteredRelationProps = (await Promise.all(relationProps)).filter(
            ([_, value]) => value
        );

        return {
            ...entity,
            ...Object.fromEntries(filteredRelationProps),
        };
    });

    return (await Promise.all(entitiesIncludeRelations)).filter(
        (entity) => entity
    );
}
