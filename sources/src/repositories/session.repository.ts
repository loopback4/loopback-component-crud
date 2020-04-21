import { inject } from "@loopback/context";
import {
    juggler,
    BelongsToAccessor,
    DefaultKeyValueRepository,
} from "@loopback/repository";
import { Ctor } from "loopback-component-history";

import { bindCRUD, CRUDBindings, PrivateCRUDBindings } from "../keys";

import { Session, User } from "../models";

import { DefaultUserRepository } from "./";

@bindCRUD("SessionRepository")
export class SessionRepository<
    Model extends Session
> extends DefaultKeyValueRepository<Model> {
    public readonly user: BelongsToAccessor<User, string>;

    constructor(
        @inject(PrivateCRUDBindings.SESSION_MODEL)
        ctor: Ctor<Model>,
        @inject(PrivateCRUDBindings.CACHE_DATASOURCE)
        dataSource: juggler.DataSource,
        @inject(CRUDBindings.USER_REPOSITORY)
        userRepository: DefaultUserRepository
    ) {
        super(ctor, dataSource);

        this.user = ((sourceId: string) =>
            userRepository.findById(sourceId)) as any;
    }
}
