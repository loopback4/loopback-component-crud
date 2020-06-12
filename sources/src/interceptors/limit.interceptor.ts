import {
    globalInterceptor,
    Interceptor,
    InvocationContext,
    InvocationResult,
    Provider,
    ValueOrPromise,
} from "@loopback/context";
import { Entity, Filter, RelationType } from "@loopback/repository";
import { HttpErrors } from "@loopback/rest";

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
                /** Get models or model from request arguments */
                const models: Entity[] | Entity =
                    invocationCtx.args[metadata.modelIndex as number];

                /** Get id from request arguments */
                const id: string =
                    invocationCtx.args[metadata.idIndex as number];

                /** Get filter from request arguments */
                const filter: Filter =
                    invocationCtx.args[metadata.filterIndex as number];

                /** Get model condition from arguments, pushed by exist interceptor */
                const condition: Entity =
                    invocationCtx.args[invocationCtx.args.length - 1];

                const limit = await this.limitFn(type, scope, {
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

                const entities = await this.validateFn(
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
                    throw new HttpErrors.UnprocessableEntity(
                        "Entity is not valid"
                    );
                }
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
                    scope: this.limitFn(
                        type,
                        scope.include[inclusion.relation],
                        inclusion.scope || {}
                    ),
                }));
        }

        return filter;
    }

    async validateFn<
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
                    ([key, _]) =>
                        key in scope.include && type in scope.include[key]
                )
                .filter(
                    ([key, _]) =>
                        key in ctor.definition.relations &&
                        ctor.definition.relations[key].type !==
                            RelationType.belongsTo
                )
                .map(async ([key, value]) => {
                    const validatedValue = await this.validateFn(
                        type,
                        ctor.definition.relations[key].target(),
                        scope.include[key],
                        [].concat(value),
                        {},
                        invocationCtx
                    );

                    return [
                        key,
                        Array.isArray(value)
                            ? validatedValue
                            : validatedValue[0],
                    ];
                });

            const filteredRelationProps = (
                await Promise.all(relationProps)
            ).filter(([_, value]) => value);

            return {
                ...entity,
                ...Object.fromEntries(filteredRelationProps),
            };
        });

        return (await Promise.all(entitiesIncludeRelations)).filter(
            (entity) => entity
        );
    }
}
