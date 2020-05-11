import { Entity, Filter, RelationType } from "@loopback/repository";

import { Ctor } from "../types";

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
    let rootRelations = [`${ctor.name.toLowerCase()}s`, ...relations];
    let rootCtor = ({
        definition: {
            relations: {
                [`${ctor.name.toLowerCase()}s`]: {
                    type: RelationType.hasMany,
                    targetsMany: true,
                    name: `${ctor.name.toLowerCase()}s`,
                    source: ctor,
                    target: () => ctor,
                },
            },
        },
    } as any) as Ctor<Model>;

    const ids = rootRelations
        .map((relation, index) => {
            let result = undefined;

            if (
                rootCtor.definition.relations[relation].targetsMany &&
                index !== rootRelations.length - 1
            ) {
                result = `${rootCtor.definition.relations[relation]
                    .target()
                    .name.toLowerCase()}_id`;
            }

            rootCtor = rootCtor.definition.relations[relation].target();

            return result;
        })
        .filter((id) => Boolean(id));

    return ids as string[];
}

export function generatePath<Model extends Entity>(
    ctor: Ctor<Model>,
    relations: string[],
    basePath: string
): string {
    let rootRelations = [`${ctor.name.toLowerCase()}s`, ...relations];
    let rootCtor = ({
        definition: {
            relations: {
                [`${ctor.name.toLowerCase()}s`]: {
                    type: RelationType.hasMany,
                    targetsMany: true,
                    name: `${ctor.name.toLowerCase()}s`,
                    source: ctor,
                    target: () => ctor,
                },
            },
        },
    } as any) as Ctor<Model>;

    const tokens = rootRelations.map((relation, index) => {
        let result = `/${rootCtor.definition.relations[
            relation
        ].name.toLowerCase()}`;

        if (
            rootCtor.definition.relations[relation].targetsMany &&
            index !== rootRelations.length - 1
        ) {
            result = `${result}/{${rootCtor.definition.relations[relation]
                .target()
                .name.toLowerCase()}_id}`;
        }

        rootCtor = rootCtor.definition.relations[relation].target();

        return result;
    });

    return `${basePath}${tokens.join("")}`;
}

export function generateFilter<Model extends Entity>(
    ctor: Ctor<Model>,
    relations: string[],
    ids: string[]
): Filter<Model> | undefined {
    let rootRelations = [`${ctor.name.toLowerCase()}s`, ...relations];
    let rootCtor = ({
        definition: {
            relations: {
                [`${ctor.name.toLowerCase()}s`]: {
                    type: RelationType.hasMany,
                    targetsMany: true,
                    name: `${ctor.name.toLowerCase()}s`,
                    source: ctor,
                    target: () => ctor,
                },
            },
        },
    } as any) as Ctor<Model>;

    let filter: Filter<any> = {};
    rootRelations.pop();

    rootRelations.reduce((filter, relation) => {
        if (rootCtor.definition.relations[relation].targetsMany) {
            filter.include = [
                {
                    relation: relation,
                    scope: {
                        where: {
                            [getId(
                                rootCtor.definition.relations[relation].target()
                            )]: ids.shift(),
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

        rootCtor = rootCtor.definition.relations[relation].target();

        return filter.include[0].scope || {};
    }, filter);

    if (filter.include && filter.include[0]) {
        return filter.include[0].scope as any;
    }
}

export function generateCondition<Model extends Entity>(
    ctor: Ctor<Model>,
    relations: string[]
) {
    let rootRelations = [`${ctor.name.toLowerCase()}s`, ...relations];
    let rootCtor = ({
        definition: {
            relations: {
                [`${ctor.name.toLowerCase()}s`]: {
                    type: RelationType.hasMany,
                    targetsMany: true,
                    name: `${ctor.name.toLowerCase()}s`,
                    source: ctor,
                    target: () => ctor,
                },
            },
        },
    } as any) as Ctor<Model>;

    return rootRelations.reduce((relationMetadata, relation) => {
        relationMetadata = rootCtor.definition.relations[relation];

        rootCtor = relationMetadata.target();

        return relationMetadata;
    }, undefined as any);
}
