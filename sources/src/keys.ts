import { Context, BindingKey, bind } from "@loopback/context";
import { Ctor } from "loopback-component-history";
import { juggler } from "@loopback/repository";
import { CoreBindings } from "@loopback/core";
import { TokenService } from "@loopback/authentication";

import {
    AuthorizationBindings,
    PrivateAuthorizationBindings,
} from "loopback-component-authorization";

import { MessageHandler, ActivateHandler } from "./types";

import {
    User,
    Role,
    Permission,
    UserRole,
    RolePermission,
    Session,
    Code,
} from "./models";
import {
    DefaultUserRepository,
    DefaultRoleRepository,
    DefaultPermissionRepository,
    DefaultUserRoleRepository,
    DefaultRolePermissionRepository,
    SessionRepository,
    CodeRepository,
} from "./repositories";

/**
 * Public bindings used in application scope
 */
export namespace CRUDBindings {
    /**
     * Base Repository key:
     *
     * 1. UserRepository
     * 2. RoleRepository
     * 3. PermissionRepository
     * 4. UserRoleRepository
     * 5. RolePermissionRepository
     *
     * 6. SessionRepository
     * 7. CodeRepository
     */
    export const USER_REPOSITORY: BindingKey<DefaultUserRepository> =
        AuthorizationBindings.USER_REPOSITORY;
    export const ROLE_REPOSITORY: BindingKey<DefaultRoleRepository> =
        AuthorizationBindings.ROLE_REPOSITORY;
    export const PERMISSION_REPOSITORY: BindingKey<DefaultPermissionRepository> =
        AuthorizationBindings.PERMISSION_REPOSITORY;
    export const USER_ROLE_REPOSITORY: BindingKey<DefaultUserRoleRepository> =
        AuthorizationBindings.USER_ROLE_REPOSITORY;
    export const ROLE_PERMISSION_REPOSITORY: BindingKey<DefaultRolePermissionRepository> =
        AuthorizationBindings.ROLE_PERMISSION_REPOSITORY;

    export const SESSION_REPOSITORY = BindingKey.create<
        SessionRepository<Session>
    >("crud.repositories.session");
    export const CODE_REPOSITORY = BindingKey.create<CodeRepository<Code>>(
        "crud.repositories.code"
    );

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
     * Model key:
     *
     * 1. UserModel
     * 2. RoleModel
     * 3. PermissionModel
     * 4. UserRoleModel
     * 5. RolePermissionModel
     *
     * 6. SessionModel
     * 7. CodeModel
     */
    export const USER_MODEL: BindingKey<Ctor<User>> =
        PrivateAuthorizationBindings.USER_MODEL;
    export const ROLE_MODEL: BindingKey<Ctor<Role>> =
        PrivateAuthorizationBindings.ROLE_MODEL;
    export const PERMISSION_MODEL: BindingKey<Ctor<Permission>> =
        PrivateAuthorizationBindings.PERMISSION_MODEL;
    export const USER_ROLE_MODEL: BindingKey<Ctor<UserRole>> =
        PrivateAuthorizationBindings.USER_ROLE_MODEL;
    export const ROLE_PERMISSION_MODEL: BindingKey<Ctor<RolePermission>> =
        PrivateAuthorizationBindings.ROLE_PERMISSION_MODEL;

    export const SESSION_MODEL = BindingKey.create<Ctor<Session>>(
        "private.crud.models.session"
    );
    export const CODE_MODEL = BindingKey.create<Ctor<Code>>(
        "private.crud.models.code"
    );

    /**
     * DataSource key
     *
     * 1. CacheDataSource: CDBMS
     */
    export const CACHE_DATASOURCE = BindingKey.create<juggler.DataSource>(
        "private.crud.dataSources.cache"
    );

    /**
     * Provider key
     *
     * 1. TokenService
     * 2. MessageProvider
     * 3. ActivateProvider
     */
    export const TOKEN_SERVICE = BindingKey.create<TokenService>(
        "private.crud.providers.token"
    );
    export const MESSAGE_PROVIDER = BindingKey.create<MessageHandler>(
        "private.crud.providers.message"
    );
    export const ACTIVATE_PROVIDER = BindingKey.create<ActivateHandler>(
        "private.crud.providers.activate"
    );

    /**
     * Constant key
     *
     * 1. CodeTimeoutConstant
     * 2. SessionTimeoutConstant
     */
    export const CODE_TIMEOUT_CONSTANT = BindingKey.create<number>(
        "private.crud.constants.codeTimeout"
    );
    export const SESSION_TIMEOUT_CONSTANT = BindingKey.create<number>(
        "private.crud.constants.sessionTimeout"
    );
}

/**
 * Binding, Finding key
 *
 * 1. CacheDataSource
 *
 * 2. SessionRepository
 * 3. CodeRepository
 */
export type BindCRUDKey =
    | "CacheDataSource"
    | "SessionRepository"
    | "CodeRepository";
export function bindCRUD(key: BindCRUDKey) {
    return bind((binding) => {
        binding.tag({
            crud: true,
            crudKey: key,
        });

        return binding;
    });
}
export function findCRUD(ctx: Context, key: BindCRUDKey) {
    const binding = ctx.findByTag({
        crud: true,
        crudKey: key,
    })[0];

    if (binding) {
        return binding.getValue(ctx);
    }
}

/** bindCacheDataSource */
export function bindCacheDataSource() {
    return bindCRUD("CacheDataSource");
}
