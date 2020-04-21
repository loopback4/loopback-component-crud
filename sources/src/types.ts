import {
    Entity,
    DefaultCrudRepository,
    Where,
    Class
} from "@loopback/repository";
import { PermissionsList, Condition } from "loopback-authorization-extension";
import { InvocationContext, Provider } from "@loopback/context";
import { Ctor } from "loopback-history-extension";

import { ApplicationConfig } from "@loopback/core";
import { RestServerConfig } from "@loopback/rest";
import { HttpServerOptions } from "@loopback/http-server";
import { TokenService, AuthenticationStrategy } from "@loopback/authentication";

import { User, Session, Code } from "./models";

/**
 * Default Permissions
 */
export class ACLPermissions extends PermissionsList {
    /** User */
    USERS_READ = "Read users";
    USERS_WRITE = "Write users";
    USERS_HISTORY = "Read users history";

    /** Self user */
    USERS_READ_SELF = "Read self user";
    USERS_WRITE_SELF = "Write self user";
    USERS_HISTORY_SELF = "Read self user history";

    /** Role */
    ROLES_READ = "Read roles";
    ROLES_WRITE = "Write roles";
    ROLES_HISTORY = "Read roles history";

    /** Permissions */
    PERMISSIONS_READ = "Read permissions";
    PERMISSIONS_WRITE = "Write permissions";

    /** UserRoles */
    USER_ROLES_READ = "Read userRoles";
    USER_ROLES_WRITE = "Write userRoles";
    USER_ROLES_HISTORY = "Read userRoles history";

    /** RolePermissions */
    ROLE_PERMISSIONS_READ = "Read rolePermissions";
    ROLE_PERMISSIONS_WRITE = "Write rolePermissions";
    ROLE_PERMISSIONS_HISTORY = "Read rolePermissions history";
}

/** Get Repository From Controller */
export type RepositoryGetter<Model extends Entity, Controller> = (
    controller: Controller
) => DefaultCrudRepository<Model, any, any>;

/** Validate Model, check model params validity */
export type ValidateModel<Model extends Entity> = (
    context: InvocationContext,
    models: Model[]
) => Promise<boolean>;

/** Filter Where, filters a Where */
export type FilterWhere<Model extends Entity> = (
    context: InvocationContext,
    where: Where<Model>
) => Promise<Where<Model>>;

/** Filter Scope, passed to filter interceptor for API's business scope definition */
export interface FilterScope<
    Model extends Entity,
    Permissions extends ACLPermissions,
    Controller
> {
    repositoryGetter: RepositoryGetter<Model, Controller>;

    read: [Condition<Permissions>, FilterWhere<Model>];
    create?: [Condition<Permissions>, ValidateModel<Model>];
    update?: [Condition<Permissions>, FilterWhere<Model>, ValidateModel<Model>];
    delete?: [Condition<Permissions>, FilterWhere<Model>];
    history?: [Condition<Permissions>, FilterWhere<Model>];

    include: {
        [relation: string]: FilterScope<any, Permissions, Controller>;
    };
}

/**
 * MessageProvider configs
 */
export type MessageHandler = (
    userId: string,
    code: string,
    type: "ActivateAccount" | "ResetPassword"
) => Promise<void>;

/**
 * ActivateProvider configs
 */
export type ActivateHandler = (userId: string) => Promise<void>;

/**
 * ACLMixin configs
 */
export interface ACLMixinConfig<Permissions extends ACLPermissions> {
    sessionModel?: Ctor<Session>;
    codeModel?: Ctor<Code>;
    tokenService?: Class<TokenService>;
    tokenStrategy?: Class<AuthenticationStrategy>;
    messageProvider?: Class<Provider<MessageHandler>>;
    activateProvider?: Class<Provider<ActivateHandler>>;
    codeTimeout: number;
    sessionTimeout: number;
    adminUser?: User;
    usersRolePermissions?: (keyof Permissions)[];
}

/**
 * ACLApplication configs
 */
export type ACLRestServerConfig = RestServerConfig & { homePath?: string };
export type ACLGraphQLServerConfig = HttpServerOptions;
export interface ACLApplicationConfig extends ApplicationConfig {
    rest?: ACLRestServerConfig;
    graphql?: ACLGraphQLServerConfig;
}
