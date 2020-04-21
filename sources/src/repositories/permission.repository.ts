import { PermissionRepositoryMixin } from "loopback-authorization-extension";

import { Permission, PermissionRelations } from "../models";

export class DefaultPermissionRepository extends PermissionRepositoryMixin<
    Permission,
    PermissionRelations
>()() {}
