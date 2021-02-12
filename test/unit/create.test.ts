import { expect } from "@loopback/testlab";
import { juggler } from "@loopback/repository";

import { User } from "./test.model";
import { UserRepository } from "./test.repository";
import { UserController } from "./test.controller";

describe("Create Model", () => {
    let userController: any;
    before(async () => {
        const dataSource = new juggler.DataSource({
            name: "db",
            connector: "memory",
        });

        userController = new UserController(
            new UserRepository(User, dataSource),
            { headers: {} } as any,
            { setHeader: (key: string, value: string) => {} } as any,
            null as any
        );
    });

    it("createAll() Test", async () => {
        await userController.deleteAll();

        /**
         * Test createAll
         */
        expect(
            await userController.createAll([
                {
                    username: "user1",
                },
                {
                    username: "user2",
                    parent: {
                        username: "parentUser2-1",
                    },
                },
                {
                    username: "user3",
                    children: [
                        {
                            username: "childUser3-1",
                        },
                        {
                            username: "childUser3-2",
                        },
                    ],
                },
                {
                    username: "user4",
                    parent: {
                        username: "parentUser4-1",
                    },
                    roles: ["role"],
                    children: [
                        {
                            username: "childUser4-1",
                        },
                        {
                            username: "childUser4-2",
                        },
                    ],
                },
            ])
        ).containDeep([
            {
                username: "user1",
            },
            {
                username: "user2",
                parent: {
                    username: "parentUser2-1",
                },
            },
            {
                username: "user3",
                children: [
                    {
                        username: "childUser3-1",
                    },
                    {
                        username: "childUser3-2",
                    },
                ],
            },
            {
                username: "user4",
                parent: {
                    username: "parentUser4-1",
                },
                roles: ["role"],
                children: [
                    {
                        username: "childUser4-1",
                    },
                    {
                        username: "childUser4-2",
                    },
                ],
            },
        ]);
    });

    it("createOne() Test", async () => {
        await userController.deleteAll();

        /**
         * Test createOne
         */
        expect(
            await userController.createOne({
                username: "user4",
                roles: ["role"],
                parent: {
                    username: "parentUser4-1",
                },
                children: [
                    {
                        username: "childUser4-1",
                    },
                    {
                        username: "childUser4-2",
                    },
                ],
            })
        ).containDeep({
            username: "user4",
            roles: ["role"],
            parent: {
                username: "parentUser4-1",
            },
            children: [
                {
                    username: "childUser4-1",
                },
                {
                    username: "childUser4-2",
                },
            ],
        });
    });
});
