import { expect } from "@loopback/testlab";
import { juggler } from "@loopback/repository";

import { User } from "./test.model";
import { UserRepository } from "./test.repository";
import { UserController } from "./test.controller";

describe("Delete Model", () => {
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

    it("deleteAll() Test", async () => {
        await userController.deleteAll();

        /**
         * Test deleteAll
         */
        expect(
            await userController.createAll([
                {
                    username: "user1",
                },
                {
                    username: "user2",
                },
            ])
        ).containDeep([
            {
                username: "user1",
            },
            {
                username: "user2",
            },
        ]);
    });

    it("deleteOne() Test", async () => {
        await userController.deleteAll();

        /**
         * Test deleteOne
         */
        expect(
            await userController.createOne({
                username: "user1",
            })
        ).containDeep({
            username: "user1",
        });
    });
});
