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

        /**
         * Test updateAll
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

    it("updateOne() Test", async () => {
        await userController.deleteAll();

        /**
         * Test updateOne
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
