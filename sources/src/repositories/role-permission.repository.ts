import { HistoryCrudRepositoryMixin } from "loopback-history-extension";
import { RolePermissionRepositoryMixin } from "loopback-authorization-extension";

import { RolePermission, RolePermissionRelations } from "../models";

export class DefaultRolePermissionRepository extends RolePermissionRepositoryMixin<
    RolePermission,
    RolePermissionRelations
>()(HistoryCrudRepositoryMixin<RolePermission, RolePermissionRelations>()()) {}
