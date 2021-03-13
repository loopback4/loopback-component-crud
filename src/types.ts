import { MixinTarget } from "@loopback/core";
import { ModelApiConfig } from "@loopback/model-api-builder";
import {
    Class,
    Entity,
    EntityCrudRepository,
    Model,
    Repository,
} from "@loopback/repository";
import { AuthenticationMetadata } from "@loopback/authentication";
import { AuthorizationMetadata } from "@loopback/authorization";
import { Request, Response } from "@loopback/rest";
import { UserProfile } from "@loopback/security";

/**
 * Interface defining the component's options object
 */
export interface CRUDComponentOptions {}

/**
 * Default options for the component
 */
export const DEFAULT_CRUD_OPTIONS: CRUDComponentOptions = {};

export interface IAuthConfig {
    /** Configuration passed to @authenticate decorator, default to { strategy: "crud", skip: true } */
    authentication?:
        | (string | AuthenticationMetadata)[]
        | string
        | AuthenticationMetadata;
    /** Configuration passed to @authorize decorator, default to { skip: true } */
    authorization?: AuthorizationMetadata;
}

/**
 * Interface defining the CRUD api builder component's options object
 */
export interface CRUDApiConfig extends ModelApiConfig {
    basePath: string;
    repository?: string | Class<Repository<Model>>;
    controller?: MixinTarget<CRUDController<any, any>>;
    create?: IAuthConfig;
    read?: IAuthConfig;
    update?: IAuthConfig;
    delete?: IAuthConfig;
}

export interface CRUDController<T extends Entity, ID> {
    readonly repository: EntityCrudRepository<T, ID>;
    readonly request: Request;
    readonly response: Response;
    readonly session: UserProfile;
}
