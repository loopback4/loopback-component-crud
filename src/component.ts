import {
    Application,
    injectable,
    Component,
    config,
    ContextTags,
    ContextBindings,
    CoreBindings,
    inject,
} from "@loopback/core";

import { CRUDBindings } from "./keys";
import { DEFAULT_CRUD_OPTIONS, CRUDComponentOptions } from "./types";
import { ExistInterceptor, LimitInterceptor } from "./interceptors";

@injectable({
    tags: {
        [ContextTags.KEY]: CRUDBindings.COMPONENT,
    },
})
export class CRUDComponent implements Component {
    constructor(
        @inject(CoreBindings.APPLICATION_INSTANCE)
        private application: Application,
        @config()
        private options: CRUDComponentOptions = DEFAULT_CRUD_OPTIONS
    ) {
        this.application.interceptor(ExistInterceptor);
        this.application.interceptor(LimitInterceptor);
        this.application
            .bind(ContextBindings.GLOBAL_INTERCEPTOR_ORDERED_GROUPS)
            .to(["exist", "limit", "authorization"]);
    }
}
