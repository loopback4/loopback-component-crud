import { expect } from "@loopback/testlab";
import {
    Entity,
    model,
    property,
    belongsTo,
    hasOne,
    hasMany,
} from "@loopback/repository";

import {
    generateIds,
    generatePath,
    generateFilter,
    generateMetadata,
} from "../../src";

@model()
class User extends Entity {
    @property()
    id: string;

    @property()
    username: string;

    @property()
    password: string;

    @hasOne(() => Profile)
    profile: any;

    @belongsTo(() => User)
    parentId: string;

    @hasMany(() => Role)
    roles: any[];
}

@model()
class Profile extends Entity {
    @property()
    id: string;

    @property()
    name: string;

    @property()
    date: Date;

    @belongsTo(() => Profile)
    parentId: any;
}

@model()
class Role extends Entity {
    @property()
    id: string;

    @property()
    name: string;

    @hasOne(() => Profile)
    profile: any;

    @belongsTo(() => Role)
    parentId: string;

    @hasMany(() => Permission)
    permissions: any[];
}

@model()
class Permission extends Entity {
    @property()
    id: string;

    @property()
    key: string;
}

describe("Utils Test", () => {
    it("generateIds Test", () => {
        expect(generateIds(User, [])).deepEqual([]);

        expect(generateIds(User, ["parent"])).deepEqual(["user_id"]);

        expect(generateIds(User, ["roles"])).deepEqual(["user_id"]);

        expect(generateIds(User, ["roles", "profile"])).deepEqual([
            "user_id",
            "role_id",
        ]);

        expect(generateIds(User, ["roles", "profile", "parent"])).deepEqual([
            "user_id",
            "role_id",
        ]);

        expect(
            generateIds(User, [
                "parent",
                "roles",
                "parent",
                "profile",
                "parent",
            ])
        ).deepEqual(["user_id", "role_id"]);

        expect(
            generateIds(User, [
                "roles",
                "profile",
                "parent",
                "parent",
                "parent",
            ])
        ).deepEqual(["user_id", "role_id"]);
    });

    it("generatePath Test", () => {
        expect(generatePath(User, [], "")).deepEqual("/users");

        expect(generatePath(User, ["parent"], "/base")).deepEqual(
            "/base/users/{user_id}/parent"
        );

        expect(generatePath(User, ["roles"], "/base")).deepEqual(
            "/base/users/{user_id}/roles"
        );

        expect(generatePath(User, ["roles", "profile"], "/base")).deepEqual(
            "/base/users/{user_id}/roles/{role_id}/profile"
        );

        expect(
            generatePath(User, ["roles", "profile", "parent"], "/base")
        ).deepEqual("/base/users/{user_id}/roles/{role_id}/profile/parent");

        expect(
            generatePath(
                User,
                ["parent", "roles", "parent", "profile", "parent"],
                "/base"
            )
        ).deepEqual(
            "/base/users/{user_id}/parent/roles/{role_id}/parent/profile/parent"
        );

        expect(
            generatePath(
                User,
                ["roles", "profile", "parent", "parent", "parent"],
                "/base"
            )
        ).deepEqual(
            "/base/users/{user_id}/roles/{role_id}/profile/parent/parent/parent"
        );
    });

    it("generateFilter Test", () => {
        expect(generateFilter(User, [], [])).deepEqual(undefined);

        expect(generateFilter(User, ["parent"], ["myUserId"])).deepEqual({
            where: { id: "myUserId" },
        });

        expect(generateFilter(User, ["roles"], ["myUserId"])).deepEqual({
            where: { id: "myUserId" },
        });

        expect(
            generateFilter(User, ["roles", "profile"], ["myUserId", "myRoleId"])
        ).deepEqual({
            where: { id: "myUserId" },
            include: [
                {
                    relation: "roles",
                    scope: {
                        where: { id: "myRoleId" },
                    },
                },
            ],
        });

        expect(
            generateFilter(
                User,
                ["roles", "profile", "parent"],
                ["myUserId", "myRoleId"]
            )
        ).deepEqual({
            where: { id: "myUserId" },
            include: [
                {
                    relation: "roles",
                    scope: {
                        where: { id: "myRoleId" },
                        include: [
                            {
                                relation: "profile",
                                scope: {},
                            },
                        ],
                    },
                },
            ],
        });

        expect(
            generateFilter(
                User,
                ["parent", "roles", "parent", "profile", "parent"],
                ["myUserId", "myRoleId"]
            )
        ).deepEqual({
            where: { id: "myUserId" },
            include: [
                {
                    relation: "parent",
                    scope: {
                        include: [
                            {
                                relation: "roles",
                                scope: {
                                    where: { id: "myRoleId" },
                                    include: [
                                        {
                                            relation: "parent",
                                            scope: {
                                                include: [
                                                    {
                                                        relation: "profile",
                                                        scope: {},
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            ],
        });

        expect(
            generateFilter(
                User,
                ["roles", "profile", "parent", "parent", "parent"],
                ["myUserId", "myRoleId"]
            )
        ).deepEqual({
            where: { id: "myUserId" },
            include: [
                {
                    relation: "roles",
                    scope: {
                        where: { id: "myRoleId" },
                        include: [
                            {
                                relation: "profile",
                                scope: {
                                    include: [
                                        {
                                            relation: "parent",
                                            scope: {
                                                include: [
                                                    {
                                                        relation: "parent",
                                                        scope: {},
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });

    it("generateMetadata Test", () => {
        expect({
            ...generateMetadata(User, []),
            source: undefined,
            target: undefined,
        }).deepEqual({
            name: "users",
            type: "hasMany",
            targetsMany: true,
            source: undefined,
            target: undefined,
        });

        expect({
            ...generateMetadata(User, ["parent"]),
            source: undefined,
            target: undefined,
        }).deepEqual({
            keyFrom: "parentId",
            name: "parent",
            type: "belongsTo",
            targetsMany: false,
            source: undefined,
            target: undefined,
        });

        expect({
            ...generateMetadata(User, ["roles"]),
            source: undefined,
            target: undefined,
        }).deepEqual({
            name: "roles",
            type: "hasMany",
            targetsMany: true,
            source: undefined,
            target: undefined,
        });

        expect({
            ...generateMetadata(User, ["roles", "profile"]),
            source: undefined,
            target: undefined,
        }).deepEqual({
            name: "profile",
            type: "hasOne",
            targetsMany: false,
            source: undefined,
            target: undefined,
        });

        expect({
            ...generateMetadata(User, ["roles", "profile", "parent"]),
            source: undefined,
            target: undefined,
        }).deepEqual({
            keyFrom: "parentId",
            name: "parent",
            type: "belongsTo",
            targetsMany: false,
            source: undefined,
            target: undefined,
        });

        expect({
            ...generateMetadata(User, [
                "parent",
                "roles",
                "parent",
                "profile",
                "parent",
            ]),
            source: undefined,
            target: undefined,
        }).deepEqual({
            keyFrom: "parentId",
            name: "parent",
            type: "belongsTo",
            targetsMany: false,
            source: undefined,
            target: undefined,
        });

        expect({
            ...generateMetadata(User, [
                "roles",
                "profile",
                "parent",
                "parent",
                "parent",
            ]),
            source: undefined,
            target: undefined,
        }).deepEqual({
            keyFrom: "parentId",
            name: "parent",
            type: "belongsTo",
            targetsMany: false,
            source: undefined,
            target: undefined,
        });
    });
});
