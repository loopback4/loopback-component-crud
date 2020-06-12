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

/** Map Model, check model params validity or map them into new models with valid properties */
export type ModelMapper<Model extends Entity> = (
    context: InvocationContext,
    models: Model[]
) => Promise<(Model | undefined)[]>;

/** Controller Scope used for API's business scope definition */
export interface ControllerScope<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
> {
    modelMapper: ModelMapper<Model>;

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
    idIndex?: number;
    filterIndex?: number;
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
