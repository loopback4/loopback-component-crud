import { expect } from "@loopback/testlab";

import { User } from "./test.model";

import { generateMetadata } from "../../src";

describe("Generate Metadata Test", () => {
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
