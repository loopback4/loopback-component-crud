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

import { Ctor, ControllerScope } from "../types";
import { getCRUDMetadata } from "../decorators";

@globalInterceptor("limit")
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
                /** Get model condition from arguments, pushed by exist interceptor */
                const condition: Entity =
                    invocationCtx.args[invocationCtx.args.length - 1];

                /** Limit models in arguments */
                if (metadata.modelsIndex !== undefined) {
                    /** Get models or model from request arguments */
                    const models: Entity[] | Entity =
                        invocationCtx.args[metadata.modelsIndex];

                    if (Array.isArray(models)) {
                        const result = await this.limitModels(
                            metadata.type,
                            metadata.leafCtor,
                            metadata.leafScope,
                            models,
                            condition,
                            invocationCtx
                        );

                        invocationCtx.args[metadata.modelsIndex] = result;
                    } else {
                        const result = await this.limitModel(
                            metadata.type,
                            metadata.leafCtor,
                            metadata.leafScope,
                            models,
                            condition,
                            invocationCtx
                        );

                        invocationCtx.args[metadata.modelsIndex] = result;
                    }
                }

                /** Limit id,filter in arguments */
                if (metadata.filterIndex !== undefined) {
                    /** Get id from request arguments */
                    const id: string | undefined =
                        invocationCtx.args[metadata.filterIndex[0]];

                    /** Get filter from request arguments */
                    const filter: Filter | undefined =
                        invocationCtx.args[metadata.filterIndex[1]];

                    const result = this.limitFilter(
                        metadata.type,
                        metadata.leafScope,
                        {
                            ...filter,
                            where: {
                                and: [
                                    id && metadata.leafCtor.buildWhereForId(id),
                                    filter?.where,
                                    condition,
                                ].filter((where) => typeof where === "object"),
                            },
                        }
                    );

                    invocationCtx.args[metadata.filterIndex[1]] = result;
                }
            }

            const result = await next();

            return result;
        } catch (err) {
            throw err;
        }
    }

    private async limitModels(
        type: "create" | "read" | "update" | "delete",
        ctor: Ctor<Entity>,
        scope: ControllerScope<any, any, any, any>,
        models: Entity[],
        condition: Entity,
        invocationCtx: InvocationContext
    ): Promise<Entity[]> {
        const entities = models.map<any>((model) => {
            const modelProps = Object.entries(model).filter(
                ([_, value]) => typeof value !== "object"
            );

            return {
                ...Object.fromEntries(modelProps),
                ...condition,
            };
        });

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
                    const validatedValue = await this.limitModels(
                        type,
                        ctor.definition.relations[key].target(),
                        scope.include[key],
                        [].concat(value),
                        {} as any,
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

    private async limitModel(
        type: "create" | "read" | "update" | "delete",
        ctor: Ctor<Entity>,
        scope: ControllerScope<any, any, any, any>,
        model: Entity,
        condition: Entity,
        invocationCtx: InvocationContext
    ): Promise<Entity> {
        const result = await this.limitModels(
            type,
            ctor,
            scope,
            [model],
            condition,
            invocationCtx
        );

        if (result[0]) {
            return result[0];
        }

        throw new HttpErrors.UnprocessableEntity("Entity is not valid");
    }

    private limitFilter(
        type: "create" | "read" | "update" | "delete",
        scope: ControllerScope<any, any, any, any>,
        filter: Filter
    ): Filter | undefined {
        if (filter.include) {
            filter.include = filter.include
                .filter(
                    (inclusion) =>
                        inclusion.relation in scope.include &&
                        type in scope.include[inclusion.relation]
                )
                .map((inclusion) => ({
                    ...inclusion,
                    scope: this.limitFilter(
                        type,
                        scope.include[inclusion.relation],
                        inclusion.scope || {}
                    ),
                }));
        }

        return filter;
    }
}
