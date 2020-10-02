import { EntityCrudRepository } from "@loopback/repository";
import { Request, Response } from "@loopback/rest";
import { UserProfile } from "@loopback/security";

import { User } from "./test.model";

import { CRUDController, CRUDControllerMixin } from "../../src";

class Controller implements CRUDController<any, any> {
    constructor(
        public repository: EntityCrudRepository<any, any>,
        public request: Request,
        public response: Response,
        public session: UserProfile
    ) {}
}

export class UserController extends CRUDControllerMixin<
    User,
    typeof User.prototype.id
>({
    model: User,
    pattern: "CRUD",
    dataSource: "db",
    basePath: "/users",
    create: {},
    read: {},
    update: {},
    delete: {},
})(Controller) {}
