import { expect } from "@loopback/testlab";
import { juggler } from "@loopback/repository";

import { User } from "./test.model";
import { UserRepository } from "./test.repository";
import { UserController } from "./test.controller";

describe("Update Model", () => {
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

    it("updateAll() Test", async () => {
        await userController.deleteAll();
        await userController.createAll([
            {
                id: "user1",
                username: "user1",
                roles: ["role"],
                parent: {
                    username: "user1",
                },
                children: [
                    {
                        id: "child1",
                        username: "child1",
                    },
                    {
                        id: "child2",
                        username: "child2",
                    },
                ],
            },
        ]);
        await userController.updateAll(
            {
                password: "123",
                parent: {
                    password: "123",
                },
                children: [
                    {
                        id: "child1",
                        password: "123",
                    },
                    {
                        id: "child2",
                        password: "123",
                    },
                ],
            },
            {
                id: "user1",
            }
        );

        /**
         * Test updateAll
         */
        expect(
            await userController.readOne("user1", {
                include: [{ relation: "parent" }, { relation: "children" }],
            })
        ).containDeep({
            id: "user1",
            username: "user1",
            parent: {
                username: "user1",
                password: "123",
            },
            children: [
                {
                    username: "child1",
                    password: "123",
                },
                {
                    username: "child2",
                    password: "123",
                },
            ],
        });
    });

    it("updateOne() Test", async () => {
        await userController.deleteAll();
        await userController.createAll([
            {
                id: "user1",
                username: "user1",
                parent: {
                    username: "parentUser1-1",
                },
            },
        ]);
        await userController.updateOne("user1", {
            password: "123",
            roles: ["role"],
            parent: {
                password: "123",
            },
        });

        /**
         * Test updateOne
         */
        expect(
            await userController.readOne("user1", {
                include: [{ relation: "parent" }],
            })
        ).containDeep({
            id: "user1",
            username: "user1",
            roles: ["role"],
            parent: {
                username: "parentUser1-1",
                password: "123",
            },
        });
    });
});
