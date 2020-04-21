import { PermissionRepositoryMixin } from "loopback-component-authorization";

import { Permission, PermissionRelations } from "../models";

export class DefaultPermissionRepository extends PermissionRepositoryMixin<
    Permission,
    PermissionRelations
>()() {}
