import { HistoryCrudRepositoryMixin } from "loopback-component-history";
import { RoleRepositoryMixin } from "loopback-component-authorization";

import { Role, RoleRelations } from "../models";

export class DefaultRoleRepository extends RoleRepositoryMixin<
    Role,
    RoleRelations
>()(HistoryCrudRepositoryMixin<Role, RoleRelations>()()) {}
