import { expect } from "@loopback/testlab";

import { UsersScope } from "./test.model";

import { generateRootAccess } from "../../src";

describe("Generate Root Access", () => {
    it("generateRootAccess Test", () => {
        expect(generateRootAccess("create", UsersScope, [])).deepEqual({});

        expect(generateRootAccess("create", UsersScope, ["parent"])).deepEqual({
            allowedRoles: ["X"],
            deniedRoles: [],
            voters: [],
            scopes: ["CREATE_USER"],
        });

        expect(
            generateRootAccess("create", UsersScope, ["parent", "parent"])
        ).deepEqual({
            allowedRoles: ["X", "Y"],
            deniedRoles: ["YPrime"],
            voters: [],
            scopes: ["CREATE_USER", "CREATE_PARENT"],
        });

        expect(generateRootAccess("read", UsersScope, ["parent"])).deepEqual({
            allowedRoles: [],
            deniedRoles: [],
            voters: [],
            scopes: [],
        });

        expect(
            generateRootAccess("read", UsersScope, ["roles", "permissions"])
        ).deepEqual({
            allowedRoles: [],
            deniedRoles: [],
            voters: [],
            scopes: ["READ_ROLES"],
        });
    });
});
