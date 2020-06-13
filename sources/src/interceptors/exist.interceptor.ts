import {
    globalInterceptor,
    Interceptor,
    InvocationContext,
    InvocationResult,
    Provider,
    ValueOrPromise,
} from "@loopback/context";
import {
    Entity,
    EntityNotFoundError,
    DefaultCrudRepository,
} from "@loopback/repository";

import { generateFilter, generateRelation } from "./utils";

import { Ctor } from "../types";
import { getCRUDMetadata } from "../decorators";

@globalInterceptor("exist")
export class ExistInterceptor implements Provider<Interceptor> {
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
                /** Get ids from request arguments */
                const ids: string[] = metadata.idsIndex.map(
                    (idIndex) => invocationCtx.args[idIndex]
                );

                const condition = await this.exist(
                    metadata.rootCtor,
                    metadata.relations,
                    metadata.rootScope.repositoryGetter(
                        invocationCtx.target as any
                    ),
                    [...ids]
                );

                invocationCtx.args.push(condition);
            }

            const result = await next();

            return result;
        } catch (err) {
            throw err;
        }
    }

    private async exist(
        ctor: Ctor<Entity>,
        relations: string[],
        repository: DefaultCrudRepository<any, any, any>,
        ids: string[]
    ): Promise<Entity> {
        const filter = generateFilter(ctor, relations, ids);

        if (!filter) {
            return {} as any;
        }

        let lastModel = relations.reduce(
            (model: any, relation) => model && model[relation],
            await repository.findOne(filter)
        );

        const relation = generateRelation(ctor, relations);

        if (lastModel && lastModel[relation.keyFrom]) {
            return {
                [relation.keyTo]: lastModel[relation.keyFrom],
            } as any;
        }

        throw new EntityNotFoundError(ctor, ids);
    }
}
