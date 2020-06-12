import { Component, createBindingFromClass } from "@loopback/core";

import { ExistInterceptor, LimitInterceptor } from "./interceptors";

export class CRUDComponent implements Component {
    bindings = [
        createBindingFromClass(ExistInterceptor),
        createBindingFromClass(LimitInterceptor),
    ];
}
