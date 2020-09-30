import {
    juggler,
    Getter,
    Entity,
    BelongsToAccessor,
    DefaultCrudRepository,
} from "@loopback/repository";

import { User } from "./test.model";

export class UserRepository extends DefaultCrudRepository<User, string, {}> {
    public readonly parent: BelongsToAccessor<User, typeof User.prototype.id>;

    constructor(
        ctor: typeof Entity & {
            prototype: User;
        },
        dataSource: juggler.DataSource
    ) {
        super(ctor, dataSource);

        this.parent = this.createBelongsToAccessorFor(
            "parent",
            Getter.fromValue(this)
        );
        this.registerInclusionResolver("parent", this.parent.inclusionResolver);
    }
}
