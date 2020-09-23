import { expect } from "@loopback/testlab";

import { User } from "./test.model";

import { generateIds } from "../../src";

describe("Generate IDs", () => {
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
});
