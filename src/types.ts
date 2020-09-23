import { inject } from "@loopback/core";
import { InvocationContext } from "@loopback/context";
import { Entity, DefaultCrudRepository } from "@loopback/repository";

import { RestBindings, Request, Response } from "@loopback/rest";
import { SecurityBindings, UserProfile } from "@loopback/security";
import { AuthenticationMetadata } from "@loopback/authentication";
import { AuthorizationMetadata } from "@loopback/authorization";

/**
 * Interface defining the component's options object
 */
export interface CRUDComponentOptions {}

/**
 * Default options for the component
 */
export const DEFAULT_CRUD_OPTIONS: CRUDComponentOptions = {};

/** Model Ctor type */
export type Ctor<Model extends Entity> = typeof Entity & {
    prototype: Model;
};

/** Get Repository From Controller */
export type RepositoryGetter<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
> = (
    controller: Controller
) => DefaultCrudRepository<Model, ModelID, ModelRelations>;

/** Controller Scope used for API's business scope definition */
export interface ControllerScope<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
> {
    repositoryGetter: RepositoryGetter<
        Model,
        ModelID,
        ModelRelations,
        Controller
    >;

    create?: {
        authentication: AuthenticationMetadata;
        authorization: AuthorizationMetadata;
    };
    read?: {
        authentication: AuthenticationMetadata;
        authorization: AuthorizationMetadata;
    };
    update?: {
        authentication: AuthenticationMetadata;
        authorization: AuthorizationMetadata;
    };
    delete?: {
        authentication: AuthenticationMetadata;
        authorization: AuthorizationMetadata;
    };

    include: {
        [relation: string]: ControllerScope<any, any, any, Controller>;
    };
}

/** CRUD decorator metadata stored via Reflection API */
export interface CRUDMetadata<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
> {
    type: "create" | "read" | "update" | "delete";
    rootCtor: Ctor<Model>;
    rootScope: ControllerScope<Model, ModelID, ModelRelations, Controller>;
    leafCtor: Ctor<Model>;
    leafScope: ControllerScope<Model, ModelID, ModelRelations, Controller>;
    relations: string[];
    idsIndex: number[];
    modelsIndex?: number;
    filterIndex?: [number, number];
}

/** Controller base class type */
export class CRUDController {
    constructor(
        @inject(RestBindings.Http.REQUEST)
        public request: Request,
        @inject(RestBindings.Http.RESPONSE)
        public response: Response,
        @inject(SecurityBindings.USER, { optional: true })
        public session: UserProfile
    ) {}
}
