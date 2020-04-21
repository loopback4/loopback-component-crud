import { HistoryCrudRepositoryMixin } from "loopback-component-history";
import { UserRoleRepositoryMixin } from "loopback-component-authorization";

import { UserRole, UserRoleRelations } from "../models";

export class DefaultUserRoleRepository extends UserRoleRepositoryMixin<
    UserRole,
    UserRoleRelations
>()(HistoryCrudRepositoryMixin<UserRole, UserRoleRelations>()()) {}
