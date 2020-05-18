import {
    Interceptor,
    InvocationContext,
    InvocationResult,
    ValueOrPromise,
} from "@loopback/context";
import {
    Entity,
    EntityNotFoundError,
    DefaultCrudRepository,
} from "@loopback/repository";

import { generateFilter, generateRelation } from "./utils";

import { Ctor, ControllerScope } from "../types";

import { CRUDController } from "../servers";

export function exist<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(
    ctor: Ctor<Model>,
    relations: string[],
    scope: ControllerScope<Model, ModelID, ModelRelations, Controller>,
    argsBegin: number,
    argsEnd: number
): Interceptor {
    return async (
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) => {
        /** Get ids from arguments array */
        let ids: string[] = invocationCtx.args.slice(argsBegin, argsEnd);

        const condition = await existFn(
            ctor,
            relations,
            scope.repositoryGetter(invocationCtx.target as any),
            [...ids]
        );

        if (condition) {
            invocationCtx.args.push(condition);
        } else {
            throw new EntityNotFoundError(ctor, ids[ids.length - 1]);
        }

        return next();
    };
}

async function existFn<
    Model extends Entity,
    ModelID,
    ModelRelations extends object
>(
    ctor: Ctor<Model>,
    relations: string[],
    repository: DefaultCrudRepository<Model, ModelID, ModelRelations>,
    ids: string[]
): Promise<Model | undefined> {
    const filter = generateFilter(ctor, relations, ids);

    if (!filter) {
        return {} as any;
    }

    let lastModel = relations.reduce(
        (model: any, relation) => model && model[relation],
        await repository.findOne(filter)
    );

    const relation = generateRelation(ctor, relations);

    if (lastModel) {
        return {
            [relation.keyTo]: lastModel[relation.keyFrom],
        } as any;
    }
}
