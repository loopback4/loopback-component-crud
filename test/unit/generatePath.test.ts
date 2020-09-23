import { expect } from "@loopback/testlab";

import { User } from "./test.model";

import { generatePath } from "../../src";

describe("Generate Path", () => {
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
});
