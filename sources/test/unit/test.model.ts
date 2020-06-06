import {
    Entity,
    model,
    property,
    belongsTo,
    hasOne,
    hasMany,
} from "@loopback/repository";

import { ControllerScope } from "../../src";

@model()
export class User extends Entity {
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
    date: Date;

    @belongsTo(() => Profile)
    parentId: any;
}

@model()
class Role extends Entity {
    @property()
    id: string;

    @property()
    name: string;

    @hasOne(() => Profile)
    profile: any;

    @belongsTo(() => Role)
    parentId: string;

    @hasMany(() => Permission)
    permissions: any[];
}

@model()
class Permission extends Entity {
    @property()
    id: string;

    @property()
    key: string;
}

export const UsersScope: ControllerScope<any, any, any, any> = {
    modelMapper: async (context, models) => models,
    repositoryGetter: (controller) => undefined as any,

    create: { scopes: ["USER_CREATE"] },
    read: { scopes: ["READ_USER"] },
    update: { scopes: ["UPDATE_USER"] },
    delete: { scopes: ["DELETE_USER"] },

    include: {
        parent: {
            modelMapper: async (context, models) => models,
            repositoryGetter: (controller) => undefined as any,

            create: {},
            read: {},
            update: {},
            delete: {},

            include: {},
        },
    },
};
