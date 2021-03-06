import { expect } from "@loopback/testlab";
import { juggler } from "@loopback/repository";

import { User } from "./test.model";
import { UserRepository } from "./test.repository";
import { UserController } from "./test.controller";

describe("Read Model", () => {
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

    it("readAll() Test", async () => {
        await userController.deleteAll();
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

        /**
         * Test readAll
         */
        expect(await userController.readAll({})).containDeep([
            {
                username: "user1",
            },
            {
                username: "user2",
            },
            {
                username: "user3",
            },
            {
                username: "user4",
            },
            {
                username: "parentUser2-1",
            },
            {
                username: "parentUser4-1",
            },
            {
                username: "childUser3-1",
            },
            {
                username: "childUser3-2",
            },
            {
                username: "childUser4-1",
            },
            {
                username: "childUser4-2",
            },
        ]);
    });

    it("readOne() Test", async () => {
        await userController.deleteAll();
        await userController.createAll([
            {
                id: "1",
                username: "user1",
            },
        ]);

        /**
         * Test readOne
         */
        expect(await userController.readOne("1")).containDeep({
            id: "1",
            username: "user1",
        });
    });
});
