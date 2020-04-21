import { Class } from "@loopback/repository";
import { Ctor } from "loopback-component-history";
import { post, get, del, requestBody, getModelSchemaRef } from "@loopback/rest";
import { authenticate } from "@loopback/authentication";

import { Controller } from "../../../../../servers";
import { Session, User } from "../../../../../models";

export function GenerateUsersSessionController<
    SessionModel extends Session,
    UserModel extends User
>(
    sessionCtor: Ctor<SessionModel>,
    userCtor: Ctor<UserModel>
): Class<Controller> {
    class UsersSessionController extends Controller {
        @post("/users/session", {
            responses: {
                "200": {
                    description: "Create Session",
                    content: {
                        "application/json": {
                            schema: getModelSchemaRef(sessionCtor, {
                                includeRelations: true,
                            }),
                        },
                    },
                },
            },
        })
        async signIn(
            @requestBody({
                content: {
                    "application/json": {
                        schema: getModelSchemaRef(userCtor, {
                            exclude: Object.keys(
                                userCtor.definition.properties
                            ).filter(
                                (key) =>
                                    key !== "username" && key !== "password"
                            ) as any,
                        }),
                    },
                },
            })
            user: User
        ): Promise<Session> {
            const token = await this.tokenService.generateToken({
                ...this.request,
                ...user,
            } as any);

            return this.sessionRepository.get(token);
        }

        @authenticate("acl")
        @get("/users/session", {
            responses: {
                "200": {
                    description: "Get Session",
                    content: {
                        "application/json": {
                            schema: getModelSchemaRef(sessionCtor, {
                                includeRelations: true,
                            }),
                        },
                    },
                },
            },
        })
        async sign(): Promise<Session> {
            return this.session;
        }

        @authenticate("acl")
        @del("/users/session", {
            responses: {
                "204": {
                    description: "Delete Session",
                },
            },
        })
        async signOut(): Promise<void> {
            await this.sessionRepository.delete(this.session.token);
        }
    }

    return UsersSessionController;
}
