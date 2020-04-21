import { model } from "@loopback/repository";

import {
    relation,
    RolePermission as RolePermissionModel,
    RolePermissionRelations as RolePermissionModelRelations
} from "loopback-authorization-extension";

import { Role, Permission } from "./";

@relation<RolePermissionWithRelations, Role>("role", () => Role)
@relation<RolePermissionWithRelations, Permission>(
    "permission",
    () => Permission
)
@model({
    settings: {}
})
export class RolePermission extends RolePermissionModel {
    constructor(data?: Partial<RolePermission>) {
        super(data);
    }
}

export interface RolePermissionRelations extends RolePermissionModelRelations {}

export type RolePermissionWithRelations = RolePermission &
    RolePermissionRelations;
