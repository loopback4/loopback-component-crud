import { model } from "@loopback/repository";

import {
    relation,
    Permission as PermissionModel,
    PermissionRelations as PermissionModelRelations
} from "loopback-authorization-extension";

import { RolePermission } from "./";

@relation<PermissionWithRelations, RolePermission>(
    "rolePermissions",
    () => RolePermission
)
@model({
    settings: {}
})
export class Permission extends PermissionModel {
    constructor(data?: Partial<Permission>) {
        super(data);
    }
}

export interface PermissionRelations extends PermissionModelRelations {}

export type PermissionWithRelations = Permission & PermissionRelations;
