import { Provider } from "@loopback/context";

import { MessageHandler } from "../types";

export class MessageProvider implements Provider<MessageHandler> {
    async value(): Promise<MessageHandler> {
        return async (userId, code, type) => {
            console.log(`Send Message ${type} to ${userId}: ${code}`);
        };
    }
}
