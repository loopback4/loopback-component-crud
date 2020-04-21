import {
    put,
    post,
    param,
    requestBody,
    getModelSchemaRef
} from "@loopback/rest";
import { Class, EntityNotFoundError } from "@loopback/repository";
import { Ctor } from "loopback-history-extension";

import { Controller } from "../../../../../servers";
import { Code, User } from "../../../../../models";

const randomize = require("randomatic");

export function GenerateUsersPasswordController<
    CodeModel extends Code,
    UserModel extends User
>(codeCtor: Ctor<CodeModel>, userCtor: Ctor<UserModel>): Class<Controller> {
    class UsersPasswordController extends Controller {
        @put("/users/password", {
            responses: {
                "204": {
                    description: "Resend Reset Password Code"
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

            const userField = Object.entries(user)[0];
            if (userField) {
            }

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
                    codeObject.type === "Password" &&
                    codeObject.userId === userObject.id
                ) {
                    await this.codeRepository.delete(code);
                }
            }

            /** Generate Code And Send */
            await this.generateCodeAndSend(userObject.id);
        }

        @post("/users/password/{code}", {
            responses: {
                "204": {
                    description: "Reset Password"
                }
            }
        })
        async reset(
            @param.path.string("code") code: string,
            @requestBody({
                content: {
                    "application/json": {
                        schema: getModelSchemaRef(userCtor, {
                            exclude: Object.keys(
                                userCtor.definition.properties
                            ).filter(key => key !== "password") as any
                        })
                    }
                }
            })
            user: User
        ): Promise<void> {
            /**
             * 1. Find Code Object
             * 2. Check Code Object
             * 3. Change Password
             */

            /** Find activation code object */
            const codeObject = await this.codeRepository.get(code);

            /** Check activation code object type */
            if (!codeObject || codeObject.type !== "Password") {
                throw new EntityNotFoundError(codeCtor, code);
            } else {
                await this.codeRepository.delete(code);
            }

            /** Change password */
            await this.userRepository.updateById(
                codeObject.userId,
                new User({
                    password: user.password
                })
            );
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
                    type: "Password",
                    userId: userId
                })
            );

            /** Set activation code object expiration time (in millis) */
            await this.codeRepository.expire(code, this.codeTimeout);

            /** Send activation email */
            await this.messageHandler(userId, code, "ResetPassword");
        }
    }

    return UsersPasswordController;
}
