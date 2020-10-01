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
                id: "user4",
                username: "user4",
                parent: {
                    username: "parentUser4-1",
                },
                children: [
                    {
                        id: "childUser4-1",
                        username: "childUser4-1",
                    },
                    {
                        id: "childUser4-2",
                        username: "childUser4-2",
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
                    { id: "childUser4-1" },
                    { id: "childUser4-2", password: "123" },
                    { username: "childUser4-3" },
                ],
            },
            {
                id: "user4",
            }
        );

        /**
         * Test updateAll
         */
        expect(await userController.readAll()).containDeep([
            {
                id: "user4",
                username: "user4",
                parent: {
                    username: "parentUser4-1",
                    password: "123",
                },
                children: [
                    {
                        id: "childUser4-2",
                        username: "childUser4-2",
                        password: "123",
                    },
                    {
                        username: "childUser4-3",
                    },
                ],
            },
        ]);
    });

    it("updateOne() Test", async () => {
        await userController.deleteAll();
        await userController.createAll([
            {
                id: "user4",
                username: "user4",
                parent: {
                    username: "parentUser4-1",
                },
                children: [
                    {
                        id: "childUser4-1",
                        username: "childUser4-1",
                    },
                    {
                        id: "childUser4-2",
                        username: "childUser4-2",
                    },
                ],
            },
        ]);
        await userController.updateOne("user4", {
            password: "123",
            parent: {
                password: "123",
            },
            children: [
                { id: "childUser4-1" },
                { id: "childUser4-2", password: "123" },
                { username: "childUser4-3" },
            ],
        });

        /**
         * Test updateOne
         */
        expect(await userController.readAll()).containDeep([
            {
                id: "user4",
                username: "user4",
                parent: {
                    username: "parentUser4-1",
                    password: "123",
                },
                children: [
                    {
                        id: "childUser4-2",
                        username: "childUser4-2",
                        password: "123",
                    },
                    {
                        username: "childUser4-3",
                    },
                ],
            },
        ]);
    });
});
