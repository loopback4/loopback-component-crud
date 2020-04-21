import { inject } from "@loopback/context";
import {
    juggler,
    BelongsToAccessor,
    DefaultKeyValueRepository,
} from "@loopback/repository";
import { Ctor } from "loopback-component-history";

import { bindACL, ACLBindings, PrivateACLBindings } from "../keys";

import { Session, User } from "../models";

import { DefaultUserRepository } from "./";

@bindACL("SessionRepository")
export class SessionRepository<
    Model extends Session
> extends DefaultKeyValueRepository<Model> {
    public readonly user: BelongsToAccessor<User, string>;

    constructor(
        @inject(PrivateACLBindings.SESSION_MODEL)
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
