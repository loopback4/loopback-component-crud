import { HistoryCrudRepositoryMixin } from "loopback-component-history";
import { UserRepositoryMixin } from "loopback-component-authorization";

import { User, UserRelations } from "../models";

export class DefaultUserRepository extends UserRepositoryMixin<
    User,
    UserRelations
>()(HistoryCrudRepositoryMixin<User, UserRelations>()()) {}
