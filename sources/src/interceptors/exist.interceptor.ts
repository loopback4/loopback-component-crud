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

import { generateFilter, generateMetadata } from "./utils";

import { Ctor } from "../types";
import { getCRUDMetadata } from "../decorators";

@globalInterceptor("crud", { tags: { name: "exist" } })
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
                /** Get ids from arguments array */
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

    private async exist<
        Model extends Entity,
        ModelID,
        ModelRelations extends object
    >(
        ctor: Ctor<Model>,
        relations: string[],
        repository: DefaultCrudRepository<Model, ModelID, ModelRelations>,
        ids: string[]
    ): Promise<Model> {
        const filter = generateFilter(ctor, relations, ids);

        if (!filter) {
            return {} as any;
        }

        let lastModel = relations.reduce(
            (model: any, relation) => model && model[relation],
            await repository.findOne(filter)
        );

        const metadata = generateMetadata(ctor, relations);

        if (lastModel && lastModel[metadata.keyFrom]) {
            return {
                [metadata.keyTo]: lastModel[metadata.keyFrom],
            } as any;
        }

        throw new EntityNotFoundError(ctor, ids);
    }
}
