import { Class, Filter } from "@loopback/repository";
import { Ctor } from "loopback-component-history";
import {
    get,
    put,
    param,
    requestBody,
    getModelSchemaRef,
    getFilterSchemaFor,
} from "@loopback/rest";
import { authenticate } from "@loopback/authentication";
import { authorize } from "loopback-component-authorization";

import { CRUDPermissions } from "../../../../../types";

import { Controller } from "../../../../../servers";
import { User } from "../../../../../models";

import { intercept } from "@loopback/core";
import { unique, filter } from "../../../../../interceptors";

export function GenerateUsersSelfController<UserModel extends User>(
    userCtor: Ctor<UserModel>
): Class<Controller> {
    class UsersSelfController extends Controller {
        @authorize<CRUDPermissions>("USERS_READ_SELF")
        @authenticate("crud")
        @get("/users/self", {
            responses: {
                "200": {
                    description: `Read self`,
                    content: {
                        "application/json": {
                            schema: getModelSchemaRef(userCtor, {
                                includeRelations: true,
                            }),
                        },
                    },
                },
            },
        })
        async read(): Promise<User> {
            return await this.userRepository.findById(this.session.userId);
        }

        @intercept(
            unique<User, CRUDPermissions, Controller>(
                userCtor,
                {
                    repositoryGetter: (controller) => controller.userRepository,
                    read: ["USERS_READ", async (context, where) => where],
                    include: {},
                },
                0,
                false
            )
        )
        @authorize<CRUDPermissions>("USERS_WRITE_SELF")
        @authenticate("crud")
        @put("/users/self", {
            responses: {
                "204": {
                    description: `Update self`,
                },
            },
        })
        async update(
            @requestBody({
                content: {
                    "application/json": {
                        schema: getModelSchemaRef(userCtor, { partial: true }),
                    },
                },
            })
            user: User
        ): Promise<void> {
            await this.userRepository.updateById(this.session.userId, user);
        }

        @intercept(
            filter<User, CRUDPermissions, Controller>(
                userCtor,
                {
                    repositoryGetter: (controller) => controller.userRepository,
                    read: ["USERS_READ", async (context, where) => where],
                    history: ["USERS_HISTORY", async (context, where) => where],
                    include: {},
                },
                "history",
                "filter",
                undefined,
                (controller) => controller.session.userId,
                { index: 0, type: "filter" }
            )
        )
        @authorize<CRUDPermissions>("USERS_HISTORY_SELF")
        @authenticate("crud")
        @get("/users/self/history", {
            responses: {
                "200": {
                    description: `Get self history by filter`,
                    content: {
                        "application/json": {
                            schema: {
                                type: "array",
                                items: getModelSchemaRef(userCtor, {
                                    includeRelations: true,
                                }),
                            },
                        },
                    },
                },
            },
        })
        async history(
            @param.query.object("filter", getFilterSchemaFor(userCtor), {
                description: `Filter self`,
            })
            filter?: Filter<UserModel>
        ): Promise<User[]> {
            return await this.userRepository.find(arguments[1]);
        }
    }

    return UsersSelfController;
}
