import {
    globalInterceptor,
    Interceptor,
    InvocationContext,
    InvocationResult,
    Provider,
    ValueOrPromise,
} from "@loopback/context";

import { authorize } from "@loopback/authorization";

import { mergeAccess, generateRootAccess, generateLeafAccess } from "./utils";

import { getCRUDMetadata } from "../decorators";

@globalInterceptor("crud", { tags: { name: "access" } })
export class TestInterceptor implements Provider<Interceptor> {
    value() {
        return this.intercept.bind(this);
    }

    async intercept(
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) {
        try {
            const metadata = getCRUDMetadata(
                invocationCtx.target,
                invocationCtx.methodName
            );

            if (metadata) {
                /** Get models or model or filter from request arguments */
                const entity = invocationCtx.args[metadata.filterIndex || -1];

                const access = mergeAccess(
                    generateLeafAccess(
                        metadata.type,
                        metadata.leafScope,
                        entity
                    ),
                    generateRootAccess(
                        metadata.type,
                        metadata.rootScope,
                        metadata.relations
                    )
                );

                await authorize(access)(
                    invocationCtx.target,
                    invocationCtx.methodName,
                    {}
                );
            }

            const result = await next();

            return result;
        } catch (err) {
            throw err;
        }
    }
}
