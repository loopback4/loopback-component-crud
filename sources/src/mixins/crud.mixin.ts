import { Context } from "@loopback/context";
import { Class, SchemaMigrationOptions } from "@loopback/repository";
import { CoreBindings } from "@loopback/core";

import { registerAuthenticationStrategy } from "@loopback/authentication";

import { findCRUD, CRUDBindings, PrivateCRUDBindings } from "../keys";
import { CRUDMixinConfig, CRUDPermissions } from "../types";

import {
    CRUDTokenService,
    CRUDTokenStrategy,
    MessageProvider,
    ActivateProvider,
} from "../providers";
import { User, Role, Session, Code } from "../models";
import { SessionRepository, CodeRepository } from "../repositories";

export function CRUDMixin<
    T extends Class<any>,
    Permissions extends CRUDPermissions
>(superClass: T) {
    const bootObservers = (ctx: Context) => {
        /**
         * Fix: servers start dependency bug
         */
        ctx.bind(CoreBindings.LIFE_CYCLE_OBSERVER_OPTIONS).to({
            orderedGroups: ["servers.REST", "servers.GraphQL"],
        });
    };

    const bootModels = (
        ctx: Context,
        configs: CRUDMixinConfig<Permissions>
    ) => {
        ctx.bind(PrivateCRUDBindings.SESSION_MODEL).to(
            configs.sessionModel || Session
        );
        ctx.bind(PrivateCRUDBindings.CODE_MODEL).to(configs.codeModel || Code);
    };

    const bootProviders = (
        ctx: Context,
        configs: CRUDMixinConfig<Permissions>
    ) => {
        ctx.bind(PrivateCRUDBindings.TOKEN_SERVICE).toClass(
            configs.tokenService || CRUDTokenService
        );
        ctx.bind(PrivateCRUDBindings.MESSAGE_PROVIDER).toProvider(
            configs.messageProvider || MessageProvider
        );
        ctx.bind(PrivateCRUDBindings.ACTIVATE_PROVIDER).toProvider(
            configs.activateProvider || ActivateProvider
        );

        registerAuthenticationStrategy(
            ctx,
            configs.tokenStrategy || CRUDTokenStrategy
        );
    };

    const bootConstants = (
        ctx: Context,
        configs: CRUDMixinConfig<Permissions>
    ) => {
        ctx.bind(PrivateCRUDBindings.CODE_TIMEOUT_CONSTANT).to(
            configs.codeTimeout
        );
        ctx.bind(PrivateCRUDBindings.SESSION_TIMEOUT_CONSTANT).to(
            configs.sessionTimeout
        );
    };

    const bootDataSources = (ctx: Context) => {
        let cacheDataSource = findCRUD(ctx, "CacheDataSource");
        if (cacheDataSource) {
            ctx.bind(PrivateCRUDBindings.CACHE_DATASOURCE).to(cacheDataSource);
        }
    };

    const bootRepositories = (ctx: Context) => {
        /**
         * Find, Bind Session Repository
         */
        let sessionRepository = findCRUD(ctx, "SessionRepository");
        if (sessionRepository) {
            ctx.bind(CRUDBindings.SESSION_REPOSITORY).to(sessionRepository);
        } else {
            ctx.bind(CRUDBindings.SESSION_REPOSITORY)
                .toClass(SessionRepository)
                .tag("repository");
        }

        /**
         * Find, Bind Code Repository
         */
        let codeRepository = findCRUD(ctx, "CodeRepository");
        if (codeRepository) {
            ctx.bind(CRUDBindings.CODE_REPOSITORY).to(codeRepository);
        } else {
            ctx.bind(CRUDBindings.CODE_REPOSITORY)
                .toClass(CodeRepository)
                .tag("repository");
        }
    };

    const migrateUsers = async (ctx: Context, adminUser: User) => {
        const userRepository = ctx.getSync(CRUDBindings.USER_REPOSITORY);

        /**
         * Migrate Administrator user
         */
        if (
            !(await userRepository.findOne({
                where: {
                    username: adminUser.username,
                },
            }))
        ) {
            await userRepository.create(adminUser);
        }
    };

    const migrateRoles = async (ctx: Context) => {
        const roleRepository = ctx.getSync(CRUDBindings.ROLE_REPOSITORY);

        /**
         * Migrate Users role
         */
        if (
            !(await roleRepository.findOne({
                where: {
                    name: "Users",
                },
            }))
        ) {
            await roleRepository.create(
                new Role({
                    name: "Users",
                    description: "System users",
                })
            );
        }

        /**
         * Migrate Admins role
         */
        if (
            !(await roleRepository.findOne({
                where: {
                    name: "Admins",
                },
            }))
        ) {
            await roleRepository.create(
                new Role({
                    name: "Admins",
                    description: "System admins",
                })
            );
        }
    };

    const migrateUsersRoles = async (ctx: Context, adminUser: User) => {
        const userRepository = ctx.getSync(CRUDBindings.USER_REPOSITORY);
        const roleRepository = ctx.getSync(CRUDBindings.ROLE_REPOSITORY);
        const userRoleRepository = ctx.getSync(
            CRUDBindings.USER_ROLE_REPOSITORY
        );

        /**
         * Get Administrator user
         */
        const administratorUser = await userRepository.findOne({
            where: {
                username: adminUser.username,
            },
        });

        /**
         * Get Admins role
         */
        const adminsRole = await roleRepository.findOne({
            where: {
                name: "Admins",
            },
        });

        if (administratorUser && adminsRole) {
            /**
             * Add Administrator to Admins
             */
            if (
                !(await userRoleRepository.findOne({
                    where: {
                        userId: administratorUser.id,
                        roleId: adminsRole.id,
                    },
                }))
            ) {
                await userRoleRepository.create({
                    userId: administratorUser.id,
                    roleId: adminsRole.id,
                });
            }
        }
    };

    const migrateRolesPermissions = async (
        ctx: Context,
        usersRolePermissions: (keyof Permissions)[]
    ) => {
        const roleRepository = ctx.getSync(CRUDBindings.ROLE_REPOSITORY);
        const permissionRepository = ctx.getSync(
            CRUDBindings.PERMISSION_REPOSITORY
        );
        const rolePermissionRepository = ctx.getSync(
            CRUDBindings.ROLE_PERMISSION_REPOSITORY
        );

        /**
         * Get Users role
         */
        const usersRole = await roleRepository.findOne({
            where: {
                name: "Users",
            },
        });

        /**
         * Get Admins role
         */
        const adminsRole = await roleRepository.findOne({
            where: {
                name: "Admins",
            },
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
                    roleId: usersRole.id,
                },
            });

            /**
             * Find addable permissions
             *
             * 1. Filter Users permissions
             * 2. Filter not added permissions
             */
            const addablePermissions = permissions
                .filter(
                    (permission) =>
                        usersRolePermissions.indexOf(permission.key as any) >= 0
                )
                .filter(
                    (permission) =>
                        rolePermissions
                            .map(
                                (rolePermission) => rolePermission.permissionId
                            )
                            .indexOf(permission.id) < 0
                );

            /**
             * Add new permissions to Users
             */
            await rolePermissionRepository.createAll(
                addablePermissions.map((permission) => ({
                    roleId: usersRole.id,
                    permissionId: permission.id,
                }))
            );
        }

        if (adminsRole) {
            /**
             * Get rolePermissions for Admins role
             */
            const rolePermissions = await rolePermissionRepository.find({
                where: {
                    roleId: adminsRole.id,
                },
            });

            /**
             * Find addable permissions
             *
             * 1. Filter not added permissions
             */
            const addablePermissions = permissions.filter(
                (permission) =>
                    rolePermissions
                        .map((rolePermission) => rolePermission.permissionId)
                        .indexOf(permission.id) < 0
            );

            /**
             * Add new permissions to Admins
             */
            await rolePermissionRepository.createAll(
                addablePermissions.map((permission) => ({
                    roleId: adminsRole.id,
                    permissionId: permission.id,
                }))
            );
        }
    };

    return class extends superClass {
        public crudConfigs: CRUDMixinConfig<Permissions> = {
            codeTimeout: 300e3,
            sessionTimeout: 300e3,
        };

        async boot() {
            bootObservers(this as any);

            await super.boot();

            bootModels(this as any, this.crudConfigs);
            bootProviders(this as any, this.crudConfigs);
            bootConstants(this as any, this.crudConfigs);
            bootDataSources(this as any);
            bootRepositories(this as any);
        }

        async migrateSchema(options?: SchemaMigrationOptions) {
            await super.migrateSchema(options);

            if (
                this.crudConfigs.adminUser &&
                this.crudConfigs.usersRolePermissions
            ) {
                await migrateUsers(this as any, this.crudConfigs.adminUser);
                await migrateRoles(this as any);
                await migrateUsersRoles(
                    this as any,
                    this.crudConfigs.adminUser
                );
                await migrateRolesPermissions(
                    this as any,
                    this.crudConfigs.usersRolePermissions
                );
            }
        }
    };
}
