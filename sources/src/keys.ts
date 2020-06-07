import { BindingKey, MetadataAccessor } from "@loopback/context";
import { CoreBindings } from "@loopback/core";
import { TokenService } from "@loopback/authentication";
import { Authorizer } from "@loopback/authorization";

import { CRUDMetadata } from "./types";

/**
 * Public bindings used in application scope
 */
export namespace CRUDBindings {
    /**
     * Server Config key:
     *
     * 1. RestServerConfig
     * 2. GraphQLServerConfig
     */
    export const REST_SERVER_CONFIG = CoreBindings.APPLICATION_CONFIG.deepProperty(
        "rest"
    );
    export const GRAPHQL_SERVER_CONFIG = CoreBindings.APPLICATION_CONFIG.deepProperty(
        "graphql"
    );
}

/**
 * Private binding used in component scope
 */
export namespace PrivateCRUDBindings {
    /**
     * Provider key
     *
     * 1. TokenService
     * 2. AuthorizerProvider
     */
    export const TOKEN_SERVICE = BindingKey.create<TokenService>(
        "private.crud.providers.token"
    );
    export const AUTHORIZER_PROVIDER = BindingKey.create<Authorizer>(
        "private.crud.providers.authorizer"
    );
}

export const CRUD_METHOD_KEY = MetadataAccessor.create<
    CRUDMetadata<any, any, any, any>,
    MethodDecorator
>("crud:method");
