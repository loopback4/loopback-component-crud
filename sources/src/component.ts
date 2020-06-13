import { Component, Binding, createBindingFromClass } from "@loopback/core";
import { ContextBindings } from "@loopback/context";

import { ExistInterceptor, LimitInterceptor } from "./interceptors";

export class CRUDComponent implements Component {
    bindings: Binding[] = [
        createBindingFromClass(ExistInterceptor),
        createBindingFromClass(LimitInterceptor),
        Binding.bind(ContextBindings.GLOBAL_INTERCEPTOR_ORDERED_GROUPS).to([
            "exist",
            "limit",
            "authorization",
        ]),
    ];
}
