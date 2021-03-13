import {
    Entity,
    model,
    property,
    belongsTo,
    hasMany,
} from "@loopback/repository";

@model()
export class User extends Entity {
    @property({
        type: "string",
        defaultFn: "uuidv4",
        id: true,
    })
    id: string;

    @property({
        type: "string",
        unique: true,
    })
    username: string;

    @property({
        type: "array",
        itemType: "string",
    })
    roles: [string];

    @property({
        type: "string",
    })
    password: string;

    @belongsTo(() => User, { keyFrom: "parentId", keyTo: "id" })
    parentId: string;

    @hasMany(() => User, { keyFrom: "id", keyTo: "parentId" })
    children: User[];

    constructor(data?: Partial<User>) {
        super(data);
    }
}
