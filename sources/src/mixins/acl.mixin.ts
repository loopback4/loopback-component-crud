import { Context } from "@loopback/context";
import { Class, SchemaMigrationOptions } from "@loopback/repository";
import { CoreBindings } from "@loopback/core";

import { registerAuthenticationStrategy } from "@loopback/authentication";

import { findACL, ACLBindings, PrivateACLBindings } from "../keys";
import { ACLMixinConfig, ACLPermissions } from "../types";

import {
    ACLTokenService,
    ACLTokenStrategy,
    MessageProvider,
    ActivateProvider
} from "../providers";
import { User, Role, Session, Code } from "../models";
import { SessionRepository, CodeRepository } from "../repositories";

export function ACLMixin<
    T extends Class<any>,
    Permissions extends ACLPermissions
>(superClass: T) {
    const bootObservers = (ctx: Context) => {
        /**
         * Fix: servers start dependency bug
         */
        ctx.bind(CoreBindings.LIFE_CYCLE_OBSERVER_OPTIONS).to({
            orderedGroups: ["servers.REST", "servers.GraphQL"]
        });
    };

    const bootModels = (ctx: Context, configs: ACLMixinConfig<Permissions>) => {
        ctx.bind(PrivateACLBindings.SESSION_MODEL).to(
            configs.sessionModel || Session
        );
        ctx.bind(PrivateACLBindings.CODE_MODEL).to(configs.codeModel || Code);
    };

    const bootProviders = (
        ctx: Context,
        configs: ACLMixinConfig<Permissions>
    ) => {
        ctx.bind(PrivateACLBindings.TOKEN_SERVICE).toClass(
            configs.tokenService || ACLTokenService
        );
        ctx.bind(PrivateACLBindings.MESSAGE_PROVIDER).toProvider(
            configs.messageProvider || MessageProvider
        );
        ctx.bind(PrivateACLBindings.ACTIVATE_PROVIDER).toProvider(
            configs.activateProvider || ActivateProvider
        );

        registerAuthenticationStrategy(
            ctx,
            configs.tokenStrategy || ACLTokenStrategy
        );
    };

    const bootConstants = (
        ctx: Context,
        configs: ACLMixinConfig<Permissions>
    ) => {
        ctx.bind(PrivateACLBindings.CODE_TIMEOUT_CONSTANT).to(
            configs.codeTimeout
        );
        ctx.bind(PrivateACLBindings.SESSION_TIMEOUT_CONSTANT).to(
            configs.sessionTimeout
        );
    };

    const bootDataSources = (ctx: Context) => {
        let cacheDataSource = findACL(ctx, "CacheDataSource");
        if (cacheDataSource) {
            ctx.bind(PrivateACLBindings.CACHE_DATASOURCE).to(cacheDataSource);
        }
    };

    const bootRepositories = (ctx: Context) => {
        /**
         * Find, Bind Session Repository
         */
        let sessionRepository = findACL(ctx, "SessionRepository");
        if (sessionRepository) {
            ctx.bind(ACLBindings.SESSION_REPOSITORY).to(sessionRepository);
        } else {
            ctx.bind(ACLBindings.SESSION_REPOSITORY)
                .toClass(SessionRepository)
                .tag("repository");
        }

        /**
         * Find, Bind Code Repository
         */
        let codeRepository = findACL(ctx, "CodeRepository");
        if (codeRepository) {
            ctx.bind(ACLBindings.CODE_REPOSITORY).to(codeRepository);
        } else {
            ctx.bind(ACLBindings.CODE_REPOSITORY)
                .toClass(CodeRepository)
                .tag("repository");
        }
    };

    const migrateUsers = async (ctx: Context, adminUser: User) => {
        const userRepository = ctx.getSync(ACLBindings.USER_REPOSITORY);

        /**
         * Migrate Administrator user
         */
        if (
            !(await userRepository.findOne({
                where: {
                    username: adminUser.username
                }
            }))
        ) {
            await userRepository.create(adminUser);
        }
    };

    const migrateRoles = async (ctx: Context) => {
        const roleRepository = ctx.getSync(ACLBindings.ROLE_REPOSITORY);

        /**
         * Migrate Users role
         */
        if (
            !(await roleRepository.findOne({
                where: {
                    name: "Users"
                }
            }))
        ) {
            await roleRepository.create(
                new Role({
                    name: "Users",
                    description: "System users"
                })
            );
        }

        /**
         * Migrate Admins role
         */
        if (
            !(await roleRepository.findOne({
                where: {
                    name: "Admins"
                }
            }))
        ) {
            await roleRepository.create(
                new Role({
                    name: "Admins",
                    description: "System admins"
                })
            );
        }
    };

    const migrateUsersRoles = async (ctx: Context, adminUser: User) => {
        const userRepository = ctx.getSync(ACLBindings.USER_REPOSITORY);
        const roleRepository = ctx.getSync(ACLBindings.ROLE_REPOSITORY);
        const userRoleRepository = ctx.getSync(
            ACLBindings.USER_ROLE_REPOSITORY
        );

        /**
         * Get Administrator user
         */
        const administratorUser = await userRepository.findOne({
            where: {
                username: adminUser.username
            }
        });

        /**
         * Get Admins role
         */
        const adminsRole = await roleRepository.findOne({
            where: {
                name: "Admins"
            }
        });

        if (administratorUser && adminsRole) {
            /**
             * Add Administrator to Admins
             */
            if (
                !(await userRoleRepository.findOne({
                    where: {
                        userId: administratorUser.id,
                        roleId: adminsRole.id
                    }
                }))
            ) {
                await userRoleRepository.create({
                    userId: administratorUser.id,
                    roleId: adminsRole.id
                });
            }
        }
    };

    const migrateRolesPermissions = async (
        ctx: Context,
        usersRolePermissions: (keyof Permissions)[]
    ) => {
        const roleRepository = ctx.getSync(ACLBindings.ROLE_REPOSITORY);
        const permissionRepository = ctx.getSync(
            ACLBindings.PERMISSION_REPOSITORY
        );
        const rolePermissionRepository = ctx.getSync(
            ACLBindings.ROLE_PERMISSION_REPOSITORY
        );

        /**
         * Get Users role
         */
        const usersRole = await roleRepository.findOne({
            where: {
                name: "Users"
            }
        });

        /**
         * Get Admins role
         */
        const adminsRole = await roleRepository.findOne({
            where: {
                name: "Admins"
            }
        });

        /**
         * Get All permissions
         */
        const permissions = await permissionRepository.find();

        if (usersRole) {
            /**
             * Get rolePermissions for Users role
             */
            const rolePermissions = await rolePermissionRepository.find({
                where: {
                    roleId: usersRole.id
                }
            });

            /**
             * Find addable permissions
             *
             * 1. Filter Users permissions
             * 2. Filter not added permissions
             */
            const addablePermissions = permissions
                .filter(
                    permission =>
                        usersRolePermissions.indexOf(permission.key as any) >= 0
                )
                .filter(
                    permission =>
                        rolePermissions
                            .map(rolePermission => rolePermission.permissionId)
                            .indexOf(permission.id) < 0
                );

            /**
             * Add new permissions to Users
             */
            await rolePermissionRepository.createAll(
                addablePermissions.map(permission => ({
                    roleId: usersRole.id,
                    permissionId: permission.id
                }))
            );
        }

        if (adminsRole) {
            /**
             * Get rolePermissions for Admins role
             */
            const rolePermissions = await rolePermissionRepository.find({
                where: {
                    roleId: adminsRole.id
                }
            });

            /**
             * Find addable permissions
             *
             * 1. Filter not added permissions
             */
            const addablePermissions = permissions.filter(
                permission =>
                    rolePermissions
                        .map(rolePermission => rolePermission.permissionId)
                        .indexOf(permission.id) < 0
            );

            /**
             * Add new permissions to Admins
             */
            await rolePermissionRepository.createAll(
                addablePermissions.map(permission => ({
                    roleId: adminsRole.id,
                    permissionId: permission.id
                }))
            );
        }
    };

    return class extends superClass {
        public aclConfigs: ACLMixinConfig<Permissions> = {
            codeTimeout: 300e3,
            sessionTimeout: 300e3
        };

        async boot() {
            bootObservers(this as any);

            await super.boot();

            bootModels(this as any, this.aclConfigs);
            bootProviders(this as any, this.aclConfigs);
            bootConstants(this as any, this.aclConfigs);
            bootDataSources(this as any);
            bootRepositories(this as any);
        }

        async migrateSchema(options?: SchemaMigrationOptions) {
            await super.migrateSchema(options);

            if (
                this.aclConfigs.adminUser &&
                this.aclConfigs.usersRolePermissions
            ) {
                await migrateUsers(this as any, this.aclConfigs.adminUser);
                await migrateRoles(this as any);
                await migrateUsersRoles(this as any, this.aclConfigs.adminUser);
                await migrateRolesPermissions(
                    this as any,
                    this.aclConfigs.usersRolePermissions
                );
            }
        }
    };
}
