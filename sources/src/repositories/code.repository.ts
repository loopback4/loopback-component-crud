import { inject } from "@loopback/context";
import {
    juggler,
    BelongsToAccessor,
    DefaultKeyValueRepository,
} from "@loopback/repository";
import { Ctor } from "loopback-component-history";

import { bindCRUD, CRUDBindings, PrivateCRUDBindings } from "../keys";

import { Code, User } from "../models";

import { DefaultUserRepository } from "./";

@bindCRUD("CodeRepository")
export class CodeRepository<
    Model extends Code
> extends DefaultKeyValueRepository<Model> {
    public readonly user: BelongsToAccessor<User, string>;

    constructor(
        @inject(PrivateCRUDBindings.CODE_MODEL)
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
