import { Entity, DefaultCrudRepository, Class } from "@loopback/repository";
import { InvocationContext, Provider } from "@loopback/context";

import { ApplicationConfig } from "@loopback/core";
import { RestServerConfig } from "@loopback/rest";
import { HttpServerOptions } from "@loopback/http-server";
import { TokenService } from "@loopback/authentication";
import { Authorizer, AuthorizationMetadata } from "@loopback/authorization";

import { CRUDController } from "./servers";

/** Model Ctor type */
export type Ctor<Model extends Entity> = typeof Entity & {
    prototype: Model;
};

/** Get Repository From Controller */
export type RepositoryGetter<
    Model extends Entity,
    Controller extends CRUDController
> = (controller: Controller) => DefaultCrudRepository<Model, any, any>;

/** Validate Model, check model params validity */
export type ValidateModel<Model extends Entity> = (
    context: InvocationContext,
    models: Model[]
) => Promise<boolean>;

/** Filter Scope, passed to filter interceptor for API's business scope definition */
export interface FilterScope<
    Model extends Entity,
    Controller extends CRUDController
> {
    repositoryGetter: RepositoryGetter<Model, Controller>;

    create?: [AuthorizationMetadata, ValidateModel<Model>];
    read: [AuthorizationMetadata];
    update?: [AuthorizationMetadata, ValidateModel<Model>];
    delete?: [AuthorizationMetadata];
    history?: [AuthorizationMetadata];

    include: {
        [relation: string]: FilterScope<any, Controller>;
    };
}

/**
 * CRUDMixin configs
 */
export interface CRUDMixinConfig {
    tokenService: Class<TokenService>;
    authorizerProvider: Class<Provider<Authorizer>>;
}

/**
 * CRUDApplication configs
 */
export type CRUDRestServerConfig = RestServerConfig & { homePath?: string };
export type CRUDGraphQLServerConfig = HttpServerOptions;
export interface CRUDApplicationConfig extends ApplicationConfig {
    rest?: CRUDRestServerConfig;
    graphql?: CRUDGraphQLServerConfig;
}
