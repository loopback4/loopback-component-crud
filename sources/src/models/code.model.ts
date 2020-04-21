import { model, property, belongsTo, Entity } from "@loopback/repository";

import { User, UserWithRelations } from "../models";

@model({
    settings: {}
})
export class Code extends Entity {
    @property({
        type: "string",
        required: true
    })
    type: "Account" | "Password";

    @belongsTo(() => User, { keyFrom: "userId", keyTo: "id" })
    userId: string;

    constructor(data?: Partial<Code>) {
        super(data);
    }
}

export interface CodeRelations {
    user: UserWithRelations;
}

export type CodeWithRelations = Code & CodeRelations;
