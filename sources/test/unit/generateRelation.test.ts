import { expect } from "@loopback/testlab";

import { User } from "./test.model";

import { generateRelation } from "../../src";

describe("Generate Metadata", () => {
    it("generateRelation Test", () => {
        expect({
            ...generateRelation(User, []),
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
            ...generateRelation(User, ["parent"]),
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
            ...generateRelation(User, ["roles"]),
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
            ...generateRelation(User, ["roles", "profile"]),
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
            ...generateRelation(User, ["roles", "profile", "parent"]),
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
            ...generateRelation(User, [
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
            ...generateRelation(User, [
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
