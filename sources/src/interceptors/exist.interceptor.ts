import {
    Interceptor,
    InvocationContext,
    InvocationResult,
    ValueOrPromise,
} from "@loopback/context";
import {
    Entity,
    Filter,
    RelationType,
    EntityNotFoundError,
} from "@loopback/repository";

import { Ctor, ControllerScope, RepositoryGetter } from "../types";

import { CRUDController } from "../servers";

export function exist<Model extends Entity, Controller extends CRUDController>(
    ctor: Ctor<Model>,
    scope: ControllerScope<Model, Controller>,
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
            const id = await existFn(
                ctor,
                scope.repositoryGetter,
                pathFilter,
                relations,
                invocationCtx
            );

            if (id) {
                invocationCtx.args.push(id);
            } else {
                throw new EntityNotFoundError(ctor, ids[ids.length - 1]);
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

export function getId<Model extends Entity>(ctor: Ctor<Model>) {
    if ("id" in ctor.definition.properties) {
        return "id";
    }

    return ctor.getIdProperties()[0];
}

export function generateIds<Model extends Entity>(
    ctor: Ctor<Model>,
    relations: string[]
): string[] {
    relations = [`${ctor.name.toLowerCase()}s`, ...relations];
    ctor = {
        definition: {
            relations: {
                [`${ctor.name.toLowerCase()}s`]: {
                    type: RelationType.hasMany,
                    targetsMany: true,
                    target: () => ctor,
                    keyFrom: "",
                    keyTo: "",
                },
            },
        },
    };

    const ids = relations.map((relation, index) => {
        let result = undefined;

        if (
            ctor.definition.relations[relation].targetsMany &&
            index !== relation.length - 1
        ) {
            result = `${ctor.definition.relations[relation]
                .target()
                .name.toLowerCase()}_id`;
        }

        ctor = ctor.definition.relations[relation].target();

        return result;
    });

    return ids.filter((id) => Boolean(id)) as string[];
}

export function generatePath<Model extends Entity>(
    ctor: Ctor<Model>,
    relations: string[],
    basePath: string
): string {
    relations = [`${ctor.name.toLowerCase()}s`, ...relations];
    ctor = {
        definition: {
            relations: {
                [`${ctor.name.toLowerCase()}s`]: {
                    type: RelationType.hasMany,
                    targetsMany: true,
                    target: () => ctor,
                    keyFrom: "",
                    keyTo: "",
                },
            },
        },
    };

    const tokens = relations.map((relation, index) => {
        let result = `/${ctor.definition.relations[relation].name}`;

        if (
            ctor.definition.relations[relation].targetsMany &&
            index !== relation.length - 1
        ) {
            result = `/${
                ctor.definition.relations[relation].name
            }/${ctor.definition.relations[relation]
                .target()
                .name.toLowerCase()}_id`;
        }

        ctor = ctor.definition.relations[relation].target();

        return result;
    });

    return `${basePath}${tokens.join()}`;
}

export function generateFilter<Model extends Entity>(
    ctor: Ctor<Model>,
    relations: string[],
    ids: string[]
): Filter<Model> | undefined {
    relations = [`${ctor.name.toLowerCase()}s`, ...relations];
    ctor = {
        definition: {
            relations: {
                [`${ctor.name.toLowerCase()}s`]: {
                    type: RelationType.hasMany,
                    targetsMany: true,
                    target: () => ctor,
                    keyFrom: "",
                    keyTo: "",
                },
            },
        },
    };

    let filter: Filter<any> = {};
    relations.pop();

    filter = relations.reduce((filter, relation) => {
        if (ctor.definition.relations[relation].targetsMany) {
            filter.include = [
                {
                    relation: relation,
                    scope: {
                        where: {
                            [getId(ctor)]: ids.shift(),
                        },
                    },
                },
            ];
        } else {
            filter.include = [
                {
                    relation: relation,
                    scope: {},
                },
            ];
        }

        ctor = ctor.definition.relations[relation].target();

        return filter.include[0].scope || {};
    }, filter);

    if (filter.include && filter.include[0]) {
        return filter.include[0].scope as any;
    }
}
