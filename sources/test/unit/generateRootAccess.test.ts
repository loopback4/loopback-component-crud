import { expect } from "@loopback/testlab";

import { UsersScope } from "./test.model";

import { generateRootAccess } from "../../src";

describe("Generate Root Access", () => {
    it("generateRootAccess Test", () => {
        console.log(generateRootAccess("create", UsersScope, []));
        expect(generateRootAccess("create", UsersScope, [])).deepEqual([]);
    });
});
