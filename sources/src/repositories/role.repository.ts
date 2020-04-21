import { HistoryCrudRepositoryMixin } from "loopback-history-extension";
import { RoleRepositoryMixin } from "loopback-authorization-extension";

import { Role, RoleRelations } from "../models";

export class DefaultRoleRepository extends RoleRepositoryMixin<
    Role,
    RoleRelations
>()(HistoryCrudRepositoryMixin<Role, RoleRelations>()()) {}
