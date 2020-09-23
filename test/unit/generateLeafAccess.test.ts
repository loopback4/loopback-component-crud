import { expect } from "@loopback/testlab";

import { UsersScope } from "./test.model";

import { generateLeafAccess } from "../../src";

describe("Generate Leaf Access", () => {
    it("generateLeafAccess Test", () => {
        expect(
            generateLeafAccess("create", UsersScope, {
                id: "Child",
                parent: {
                    id: "Parent",
                },
                profile: {
                    id: "Profile",
                    name: "Ghasem",
                },
                roles: [
                    {
                        id: "Role1",
                        name: "Ghasem ha",
                    },
                    {
                        id: "Role2",
                        name: "Ghasem ha",
                        parent: {
                            id: "ParentRole",
                            name: "Jafar ha",
                        },
                    },
                    {
                        id: "Role1",
                        name: "Ghasem ha",
                        permissions: [
                            {
                                id: "Per1",
                                key: "Per1",
                            },
                            {
                                id: "Per2",
                                key: "Per2",
                            },
                        ],
                    },
                ],
            })
        ).deepEqual({
            allowedRoles: ["X", "Y", "Z", "T"],
            deniedRoles: ["YPrime", "PPrime"],
            voters: [],
            scopes: [
                "CREATE_USER",
                "CREATE_PARENT",
                "CREATE_PROFILE",
                "CREATE_ROLE_PARENT",
                "CREATE_ROLE_PERMISSION",
            ],
        });
    });
});
