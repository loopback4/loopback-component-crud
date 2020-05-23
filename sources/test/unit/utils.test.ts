import { expect } from "@loopback/testlab";
import {
    Entity,
    model,
    property,
    belongsTo,
    hasOne,
    hasMany,
} from "@loopback/repository";

import {
    generateIds,
    generatePath,
    generateFilter,
    generateMetadata,
} from "../..";

@model()
class User extends Entity {
    @property()
    id: string;

    @property()
    username: string;

    @property()
    password: string;

    @hasOne(() => Profile)
    profile: any;

    @belongsTo(() => User)
    parentId: string;

    @hasMany(() => Role)
    roles: any[];
}

@model()
class Profile extends Entity {
    @property()
    id: string;

    @property()
    name: string;

    @property()
    age: Date;
}

@model()
class Role extends Entity {
    @property()
    id: string;

    @property()
    name: string;
}

describe("Empty Test", () => {
    console.log(generateIds(User, ["profile"]));
});
