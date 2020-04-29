import {
    Interceptor,
    InvocationContext,
    InvocationResult,
    ValueOrPromise,
} from "@loopback/context";
import { HttpErrors } from "@loopback/rest";
import { Entity, Filter, RelationType } from "@loopback/repository";

import { Ctor, FilterScope, RepositoryGetter } from "../types";

import { CRUDController } from "../servers";

import { filterFn } from "./filter.interceptor";

export function exist<Model extends Entity, Controller extends CRUDController>(
    ctor: Ctor<Model>,
    scope: FilterScope<Model, Controller>,
    argIndexBegin: number,
    argIndexEnd: number,
    relations: string[]
): Interceptor {
    return async (
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) => {
        /** Get ids from arguments array */
        let ids: string[] = invocationCtx.args.slice(
            argIndexBegin,
            argIndexEnd
        );

        const pathFilter = generateFilter(ctor, ids, relations);

        if (pathFilter && Object.keys(pathFilter).length > 0) {
            const filter = await filterFn(
                ctor,
                scope,
                "read",
                pathFilter,
                invocationCtx
            );

            const id = await existFn(
                ctor,
                scope.repositoryGetter,
                filter,
                relations,
                invocationCtx
            );

            if (id) {
                invocationCtx.args.push(id);
            } else {
                throw new HttpErrors.Forbidden(
                    "You don't have required filter to access this model!"
                );
            }
        } else {
            invocationCtx.args.push(undefined);
        }

        return next();
    };
}

async function existFn<Model extends Entity, Controller extends CRUDController>(
    ctor: Ctor<Model>,
    repositoryGetter: RepositoryGetter<any, Controller>,
    filter: Filter<Model>,
    relations: string[],
    invocationCtx: InvocationContext
): Promise<{ property: string | string[]; value: string } | undefined> {
    const model = await repositoryGetter(invocationCtx.target as any).findOne(
        filter
    );

    let ctors = [ctor];

    let internalModel = relations.reduce((accumulate, relation, index) => {
        const modelRelation = ctor.definition.relations[relation];

        if (!accumulate) {
            return undefined;
        }

        /** Get next related model */
        ctor = modelRelation.target();

        /** If last relation and type is hasMany, return current model */
        if (
            index == relations.length - 1 &&
            modelRelation.type === RelationType.hasMany
        ) {
            return accumulate;
        } else {
            /** Push next model to queue */
            ctors.push(ctor);
        }

        /** Get related model */
        accumulate = accumulate[relation];
        if (Array.isArray(accumulate)) {
            accumulate = accumulate[0];
        }

        return accumulate;
    }, model);

    const lastCtor = ctors.pop();

    if (!internalModel) {
        return undefined;
    }

    /** Read id from related model and properties from foreign keys to lastCtor */
    if (lastCtor && lastCtor.name !== ctor.name) {
        const modelIdProperty =
            "id" in lastCtor.definition.properties
                ? "id"
                : lastCtor.getIdProperties()[0];

        return {
            property: Object.entries(ctor.definition.relations)
                .filter(
                    ([relation, target]) =>
                        target.type === RelationType.belongsTo &&
                        target.target().name === lastCtor.name
                )
                .map(([relation, target]) => (target as any).keyFrom),
            value: internalModel[modelIdProperty],
        };
    }

    /** Read id from model and properties from model id property */
    const modelIdProperty =
        "id" in ctor.definition.properties ? "id" : ctor.getIdProperties()[0];

    return {
        property: modelIdProperty,
        value: internalModel[modelIdProperty],
    };
}

export function generateIds<Model extends Entity>(
    ctor: Ctor<Model>,
    relations: string[]
): string[] {
    let relationTypes = [RelationType.hasMany];

    return relations
        .map((relation, index) => {
            const modelRelation = ctor.definition.relations[relation];
            const modelIdName = `${ctor.name.toLowerCase()}_id`;
            let result = undefined;

            /** Push previous model relation type to current model to queue */
            relationTypes.push(modelRelation.type);

            /** Get next related model */
            ctor = modelRelation.target();

            /** Check previous model relation */
            if (relationTypes.shift() === RelationType.hasMany) {
                result = modelIdName;
            }

            return result;
        })
        .filter((idName) => idName) as any;
}

export function generatePath<Model extends Entity>(
    ctor: Ctor<Model>,
    relations: string[],
    basePath: string
): string {
    let relationTypes = [RelationType.hasMany];

    return relations.reduce((accumulate, relation, index) => {
        const modelRelation = ctor.definition.relations[relation];
        const modelIdName = `${ctor.name.toLowerCase()}_id`;
        const modelRelationName = `${relation.toLowerCase()}`;
        let result = `${accumulate}/${modelRelationName}`;

        /** Push previous model relation type to current model to queue */
        relationTypes.push(modelRelation.type);

        /** Get next related model */
        ctor = modelRelation.target();

        /** Check previous model relation */
        if (relationTypes.shift() === RelationType.hasMany) {
            result = `${accumulate}/{${modelIdName}}/${modelRelationName}`;
        }

        return result;
    }, `${basePath}/${ctor.name.toLowerCase()}s`);
}

function generateFilter<Model extends Entity>(
    ctor: Ctor<Model>,
    ids: string[],
    relations: string[]
): Filter<Model> | undefined {
    let filter: Filter<any> = {};

    let relationTypes = [RelationType.hasMany];

    ids = [...ids];

    relations.reduce((accumulate, relation, index) => {
        const modelRelation = ctor.definition.relations[relation];
        const modelIdProperty =
            "id" in ctor.definition.properties
                ? "id"
                : ctor.getIdProperties()[0];

        /** Push previous model relation type to current model to queue */
        relationTypes.push(modelRelation.type);

        /** Get next related model */
        ctor = modelRelation.target();

        /** Check previous model relation */
        if (relationTypes.shift() === RelationType.hasMany) {
            accumulate.where = {
                [modelIdProperty]: ids.shift() || "",
            };
        }

        /** If last relation and current relation type is hasMany, filter by model foreign key */
        if (
            index === relations.length - 1 &&
            relationTypes.shift() === RelationType.hasMany
        ) {
            return accumulate;
        }

        accumulate.include = [
            {
                relation: relation,
                scope: {},
            },
        ];
        return accumulate.include[0].scope as any;
    }, filter);

    return filter;
}
