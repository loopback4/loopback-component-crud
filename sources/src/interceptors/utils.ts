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
    relations = [`${ctor.name.toLowerCase()}s`, ...relations];
    ctor = ({
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

    const ids = relations
        .map((relation, index) => {
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
        })
        .filter((id) => Boolean(id));

    return ids as string[];
}

export function generatePath<Model extends Entity>(
    ctor: Ctor<Model>,
    relations: string[],
    basePath: string
): string {
    relations = [`${ctor.name.toLowerCase()}s`, ...relations];
    ctor = ({
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
    ctor = ({
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

export function generateCondition<Model extends Entity>(
    ctor: Ctor<Model>,
    relations: string[]
) {
    relations = [`${ctor.name.toLowerCase()}s`, ...relations];
    ctor = ({
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

    return relations.reduce((relationMetadata, relation) => {
        relationMetadata = ctor.definition.relations[relation];

        ctor = relationMetadata.target();

        return relationMetadata;
    }, undefined as any);
}
