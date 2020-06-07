import {
    /* inject, */
    globalInterceptor,
    Interceptor,
    InvocationContext,
    InvocationResult,
    Provider,
    ValueOrPromise,
} from "@loopback/context";

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@globalInterceptor("crud", { tags: { name: "test" } })
export class TestInterceptor implements Provider<Interceptor> {
    value() {
        return this.intercept.bind(this);
    }

    async intercept(
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) {
        try {
            // Add pre-invocation logic here
            const result = await next();
            // Add post-invocation logic here
            return result;
        } catch (err) {
            // Add error handling logic here
            throw err;
        }
    }
}
