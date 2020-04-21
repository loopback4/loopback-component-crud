import { Class } from "@loopback/repository";
import { Ctor } from "loopback-history-extension";

import { ACLPermissions } from "../../../../types";

import { Controller, ACLControllerMixin } from "../../../../servers";
import { Permission } from "../../../../models";

export function GeneratePermissionsController<Model extends Permission>(
    ctor: Ctor<Model>
): Class<Controller> {
    class PermissionsController extends ACLControllerMixin<
        Permission,
        ACLPermissions,
        Controller
    >(
        Controller,
        ctor,
        {
            repositoryGetter: controller => controller.permissionRepository,

            read: ["PERMISSIONS_READ", async (context, where) => where],

            include: {
                rolePermissions: {
                    repositoryGetter: controller =>
                        controller.rolePermissionRepository,

                    create: [
                        "ROLE_PERMISSIONS_WRITE",
                        async (context, models) => true
                    ],
                    read: [
                        "ROLE_PERMISSIONS_READ",
                        async (context, where) => where
                    ],
                    delete: [
                        "ROLE_PERMISSIONS_WRITE",
                        async (context, where) => where
                    ],

                    include: {
                        role: {
                            repositoryGetter: controller =>
                                controller.roleRepository,

                            read: [
                                "ROLES_READ",
                                async (context, where) => where
                            ],

                            include: {}
                        }
                    }
                }
            }
        },
        ""
    ) {}

    return PermissionsController;
}
