import { Class } from "@loopback/repository";
import { Ctor } from "loopback-component-history";

import { ACLPermissions } from "../../../../types";

import { Controller, ACLControllerMixin } from "../../../../servers";
import { Role } from "../../../../models";

export function GenerateRolesController<Model extends Role>(
    ctor: Ctor<Model>
): Class<Controller> {
    class RolesController extends ACLControllerMixin<
        Role,
        ACLPermissions,
        Controller
    >(
        Controller,
        ctor,
        {
            repositoryGetter: (controller) => controller.roleRepository,

            create: ["ROLES_WRITE", async (context, models) => true],
            read: ["ROLES_READ", async (context, where) => where],
            update: [
                "ROLES_WRITE",
                async (context, where) => where,
                async (context, models) => true,
            ],
            delete: ["ROLES_WRITE", async (context, where) => where],
            history: ["ROLES_HISTORY", async (context, where) => where],

            include: {
                userRoles: {
                    repositoryGetter: (controller) =>
                        controller.userRoleRepository,

                    create: [
                        "USER_ROLES_WRITE",
                        async (context, models) => true,
                    ],
                    read: ["USER_ROLES_READ", async (context, where) => where],
                    delete: [
                        "USER_ROLES_WRITE",
                        async (context, where) => where,
                    ],

                    include: {
                        user: {
                            repositoryGetter: (controller) =>
                                controller.userRepository,

                            read: [
                                "USERS_READ",
                                async (context, where) => where,
                            ],

                            include: {},
                        },
                    },
                },

                rolePermissions: {
                    repositoryGetter: (controller) =>
                        controller.rolePermissionRepository,

                    create: [
                        "ROLE_PERMISSIONS_WRITE",
                        async (context, models) => true,
                    ],
                    read: [
                        "ROLE_PERMISSIONS_READ",
                        async (context, where) => where,
                    ],
                    delete: [
                        "ROLE_PERMISSIONS_WRITE",
                        async (context, where) => where,
                    ],

                    include: {
                        permission: {
                            repositoryGetter: (controller) =>
                                controller.permissionRepository,

                            read: [
                                "PERMISSIONS_READ",
                                async (context, where) => where,
                            ],

                            include: {},
                        },
                    },
                },
            },
        },
        ""
    ) {}

    return RolesController;
}
