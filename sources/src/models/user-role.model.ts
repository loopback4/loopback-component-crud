import { model } from "@loopback/repository";

import {
    relation,
    UserRole as UserRoleModel,
    UserRoleRelations as UserRoleModelRelations,
} from "loopback-component-authorization";

import { User, Role } from "./";

@relation<UserRoleWithRelations, User>("user", () => User)
@relation<UserRoleWithRelations, Role>("role", () => Role)
@model({
    settings: {},
})
export class UserRole extends UserRoleModel {
    constructor(data?: Partial<UserRole>) {
        super(data);
    }
}

export interface UserRoleRelations extends UserRoleModelRelations {}

export type UserRoleWithRelations = UserRole & UserRoleRelations;
