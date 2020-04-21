import {
    post,
    put,
    del,
    param,
    requestBody,
    getModelSchemaRef
} from "@loopback/rest";
import { Class, EntityNotFoundError } from "@loopback/repository";
import { Ctor } from "loopback-history-extension";

import { ACLPermissions } from "../../../../../types";

import { Controller } from "../../../../../servers";
import { Code, User, UserRole } from "../../../../../models";

import { intercept } from "@loopback/core";
import { unique } from "../../../../../interceptors";

const randomize = require("randomatic");

export function GenerateUsersAccountController<
    CodeModel extends Code,
    UserModel extends User
>(codeCtor: Ctor<CodeModel>, userCtor: Ctor<UserModel>): Class<Controller> {
    class UsersAccountController extends Controller {
        @intercept(
            unique<User, ACLPermissions, Controller>(
                userCtor,
                {
                    repositoryGetter: controller => controller.userRepository,
                    read: ["USERS_READ", async (context, where) => where],
                    include: {}
                },
                0,
                false
            )
        )
        @post("/users/account", {
            responses: {
                "204": {
                    description: "Create Account"
                }
            }
        })
        async create(
            @requestBody({
                content: {
                    "application/json": {
                        schema: getModelSchemaRef(userCtor, {
                            exclude: Object.keys(
                                userCtor.definition.properties
                            ).filter(
                                key =>
                                    key === "uid" ||
                                    key === "beginDate" ||
                                    key === "endDate" ||
                                    key === "id" ||
                                    key === "status"
                            ) as any
                        })
                    }
                }
            })
            user: User
        ): Promise<void> {
            /**
             * 1. Create User
             * 2. Generate Code And Send
             */

            /** Create user */
            const userObject = await this.userRepository.create(
                new User({
                    ...user,
                    status: "Register"
                })
            );

            /** Generate Code And Send */
            await this.generateCodeAndSend(userObject.id);
        }

        @put("/users/account", {
            responses: {
                "204": {
                    description: "Resend Register Account Code"
                }
            }
        })
        async resend(
            @requestBody({
                content: {
                    "application/json": {
                        schema: getModelSchemaRef(userCtor, {
                            partial: true,
                            exclude: Object.keys(
                                userCtor.definition.properties
                            ).filter(
                                key => key !== "email" && key !== "phone"
                            ) as any
                        })
                    }
                }
            })
            user: User
        ): Promise<void> {
            /**
             * 1. Find User
             * 2. Find Old Code Object
             * 3. Invalidate Old Code Object
             * 4. Generate Code And Send
             */

            /** Find user object by username or email */
            const userObject = await this.userRepository.findOne({
                where: user as any
            });
            if (!userObject || Object.keys(user).length <= 0) {
                throw new EntityNotFoundError(userCtor, user);
            }

            /** Find activation code object */
            for await (const code of this.codeRepository.keys()) {
                const codeObject = await this.codeRepository.get(code);

                if (
                    codeObject.type === "Account" &&
                    codeObject.userId === userObject.id
                ) {
                    await this.codeRepository.delete(code);
                }
            }

            /** Generate Code And Send */
            await this.generateCodeAndSend(userObject.id);
        }

        @post("/users/account/{code}", {
            responses: {
                "204": {
                    description: "Activate Account"
                }
            }
        })
        async activate(@param.path.string("code") code: string): Promise<void> {
            /**
             * 1. Find Code Object
             * 2. Check Code Object
             * 3. Activate User
             * 4. Add User to Users Role
             */

            /** Find activation code object */
            const codeObject = await this.codeRepository.get(code);

            /** Check activation code object type */
            if (!codeObject || codeObject.type !== "Account") {
                throw new EntityNotFoundError(codeCtor, code);
            } else {
                await this.codeRepository.delete(code);
            }

            /** Activate user */
            await this.userRepository.updateById(
                codeObject.userId,
                new User({
                    status: "Active"
                })
            );

            /** Add user to Users role */
            const usersRole = await this.roleRepository.findOne({
                where: {
                    name: "Users"
                }
            });
            if (usersRole) {
                await this.userRoleRepository.create(
                    new UserRole({
                        userId: codeObject.userId,
                        roleId: usersRole.id
                    })
                );
            }

            /** Activate handler - default user configs, etc */
            await this.activateHandler(codeObject.userId);
        }

        @del("/users/account", {
            responses: {
                "204": {
                    description: "Delete Account"
                }
            }
        })
        async delete(
            @requestBody({
                content: {
                    "application/json": {
                        schema: getModelSchemaRef(userCtor, {
                            exclude: Object.keys(
                                userCtor.definition.properties
                            ).filter(
                                key => key !== "username" && key !== "password"
                            ) as any
                        })
                    }
                }
            })
            user: User
        ): Promise<void> {
            /** Delete user */
            await this.userRepository.deleteAll({
                username: user.username,
                password: user.password
            });
        }

        private async generateCodeAndSend(userId: string) {
            /**
             * 1. Generate Code
             * 2. Save Code Object
             * 3. Set Code Object Expire-Time
             * 4. Send Activation Email
             */

            /** Generate activation code */
            const code = randomize("0", 6);

            /** Save activation code object */
            await this.codeRepository.set(
                code,
                new Code({
                    type: "Account",
                    userId: userId
                })
            );

            /** Set activation code object expiration time (in millis) */
            await this.codeRepository.expire(code, this.codeTimeout);

            /** Send activation email */
            await this.messageHandler(userId, code, "ActivateAccount");
        }
    }

    return UsersAccountController;
}
