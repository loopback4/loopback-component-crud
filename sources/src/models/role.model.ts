import { model, property } from "@loopback/repository";

import {
    relation,
    Role as RoleModel,
    RoleRelations as RoleModelRelations
} from "loopback-authorization-extension";

import { UserRole, RolePermission } from "./";

@relation<RoleWithRelations, Role>("parent", () => Role)
@relation<RoleWithRelations, Role>("childs", () => Role)
@relation<RoleWithRelations, UserRole>("userRoles", () => UserRole)
@relation<RoleWithRelations, RolePermission>(
    "rolePermissions",
    () => RolePermission
)
@model({
    settings: {}
})
export class Role extends RoleModel {
    @property({
        type: "string"
    })
    name: string;

    @property({
        type: "string"
    })
    description: string;

    constructor(data?: Partial<Role>) {
        super(data);
    }
}

export interface RoleRelations extends RoleModelRelations {}

export type RoleWithRelations = Role & RoleRelations;
