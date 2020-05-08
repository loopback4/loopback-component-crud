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
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
> = (
    controller: Controller
) => DefaultCrudRepository<Model, ModelID, ModelRelations>;

/** Validate Model, check model params validity */
export type ModelValidator<Model extends Entity> = (
    context: InvocationContext,
    models: Model[]
) => Promise<boolean>;

/** Controller Scope used for API's business scope definition */
export interface ControllerScope<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
> {
    modelValidator: ModelValidator<Model>;

    repositoryGetter: RepositoryGetter<
        Model,
        ModelID,
        ModelRelations,
        Controller
    >;

    create?: AuthorizationMetadata;
    read?: AuthorizationMetadata;
    update?: AuthorizationMetadata;
    delete?: AuthorizationMetadata;

    include: {
        [relation: string]: ControllerScope<any, any, any, Controller>;
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
