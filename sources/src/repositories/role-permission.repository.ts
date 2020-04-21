import { HistoryCrudRepositoryMixin } from "loopback-component-history";
import { RolePermissionRepositoryMixin } from "loopback-component-authorization";

import { RolePermission, RolePermissionRelations } from "../models";

export class DefaultRolePermissionRepository extends RolePermissionRepositoryMixin<
    RolePermission,
    RolePermissionRelations
>()(HistoryCrudRepositoryMixin<RolePermission, RolePermissionRelations>()()) {}
