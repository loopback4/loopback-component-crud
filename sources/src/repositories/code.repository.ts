import { inject } from "@loopback/context";
import {
    juggler,
    BelongsToAccessor,
    DefaultKeyValueRepository
} from "@loopback/repository";
import { Ctor } from "loopback-history-extension";

import { bindACL, ACLBindings, PrivateACLBindings } from "../keys";

import { Code, User } from "../models";

import { DefaultUserRepository } from "./";

@bindACL("CodeRepository")
export class CodeRepository<
    Model extends Code
> extends DefaultKeyValueRepository<Model> {
    public readonly user: BelongsToAccessor<User, string>;

    constructor(
        @inject(PrivateACLBindings.CODE_MODEL)
        ctor: Ctor<Model>,
        @inject(PrivateACLBindings.CACHE_DATASOURCE)
        dataSource: juggler.DataSource,
        @inject(ACLBindings.USER_REPOSITORY)
        userRepository: DefaultUserRepository
    ) {
        super(ctor, dataSource);

        this.user = ((sourceId: string) =>
            userRepository.findById(sourceId)) as any;
    }
}
