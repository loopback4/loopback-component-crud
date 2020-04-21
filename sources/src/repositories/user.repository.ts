import { HistoryCrudRepositoryMixin } from "loopback-history-extension";
import { UserRepositoryMixin } from "loopback-authorization-extension";

import { User, UserRelations } from "../models";

export class DefaultUserRepository extends UserRepositoryMixin<
    User,
    UserRelations
>()(HistoryCrudRepositoryMixin<User, UserRelations>()()) {}
