import { Provider } from "@loopback/core";
import {
    Authorizer,
    AuthorizationContext,
    AuthorizationMetadata,
    AuthorizationDecision,
} from "@loopback/authorization";

export class CRUDAuthorizerProvider implements Provider<Authorizer> {
    /**
     * @returns an authorizer function
     *
     */
    value(): Authorizer {
        return this.authorize.bind(this);
    }

    async authorize(
        context: AuthorizationContext,
        metadata: AuthorizationMetadata
    ) {
        if (
            context.resource === "OrderController.prototype.cancelOrder" &&
            context.principals[0].name === "user-01"
        ) {
            return AuthorizationDecision.DENY;
        }
        return AuthorizationDecision.ALLOW;
    }
}
