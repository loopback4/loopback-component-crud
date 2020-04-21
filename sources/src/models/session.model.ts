import { model, property, belongsTo, Entity } from "@loopback/repository";

import { User, UserWithRelations } from "../models";

@model({
    settings: {}
})
export class Session extends Entity {
    @property({
        type: "string",
        required: true
    })
    token: string;

    @property({
        type: "string",
        required: true
    })
    ip: string;

    @property({
        type: "string"
    })
    device: string;

    @property({
        type: "date",
        required: true
    })
    date: Date;

    @property.array(String)
    permissions: string[];

    @belongsTo(() => User, { keyFrom: "userId", keyTo: "id" })
    userId: string;

    constructor(data?: Partial<Session>) {
        super(data);
    }
}

export interface SessionRelations {
    user: UserWithRelations;
}

export type SessionWithRelations = Session & SessionRelations;
