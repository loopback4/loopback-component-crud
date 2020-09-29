import { MixinTarget } from "@loopback/core";
import { ModelApiConfig } from "@loopback/model-api-builder";
import { Entity, EntityCrudRepository } from "@loopback/repository";
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

/**
 * Interface defining the CRUD api builder component's options object
 */
export interface CRUDApiConfig extends ModelApiConfig {
    basePath: string;
    baseController?: MixinTarget<CRUDController<any, any>>;
    create?: {
        authentication?: AuthenticationMetadata;
        authorization?: AuthorizationMetadata;
    };
    read?: {
        authentication?: AuthenticationMetadata;
        authorization?: AuthorizationMetadata;
    };
    update?: {
        authentication?: AuthenticationMetadata;
        authorization?: AuthorizationMetadata;
    };
    delete?: {
        authentication?: AuthenticationMetadata;
        authorization?: AuthorizationMetadata;
    };
}

export interface CRUDController<T extends Entity, ID> {
    readonly repository: EntityCrudRepository<T, ID>;
    readonly request: Request;
    readonly response: Response;
    readonly session: UserProfile;
}
