import { Provider } from "@loopback/context";

import { ActivateHandler } from "../types";

export class ActivateProvider implements Provider<ActivateHandler> {
    async value(): Promise<ActivateHandler> {
        return async userId => {
            console.log(`User ${userId} Activated`);
        };
    }
}
