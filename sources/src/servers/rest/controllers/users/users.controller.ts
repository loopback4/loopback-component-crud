import { Class } from "@loopback/repository";
import { Ctor } from "loopback-component-history";

import { CRUDPermissions } from "../../../../types";

import { Controller, CRUDControllerMixin } from "../../../../servers";
import { User } from "../../../../models";

export function GenerateUsersController<Model extends User>(
    ctor: Ctor<Model>
): Class<Controller> {
    class UsersController extends CRUDControllerMixin<
        User,
        CRUDPermissions,
        Controller
    >(
        Controller,
        ctor,
        {
            repositoryGetter: (controller) => controller.userRepository,

            create: ["USERS_WRITE", async (context, models) => true],
            read: ["USERS_READ", async (context, where) => where],
            update: [
                "USERS_WRITE",
                async (context, where) => where,
                async (context, models) => true,
            ],
            delete: ["USERS_WRITE", async (context, where) => where],
            history: ["USERS_HISTORY", async (context, where) => where],

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
                        role: {
                            repositoryGetter: (controller) =>
                                controller.roleRepository,

                            read: [
                                "ROLES_READ",
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

    return UsersController;
}
