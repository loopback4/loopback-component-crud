import { Entity, model, property, belongsTo } from "@loopback/repository";

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
        type: "string",
    })
    password: string;

    @belongsTo(() => User)
    parentId: string;

    constructor(data?: Partial<User>) {
        super(data);
    }
}
