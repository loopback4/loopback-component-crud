import { expect } from "@loopback/testlab";

import { User } from "./test.model";

import { generateFilter } from "../../src";

describe("Generate Filter Test", () => {
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
});
