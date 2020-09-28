import { ModelApiConfig } from "@loopback/model-api-builder";
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

/**
 * Interface defining the CRUD api builder component's options object
 */
export interface CRUDApiConfig extends ModelApiConfig {
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
