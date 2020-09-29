import {
    Application,
    injectable,
    Component,
    config,
    ContextTags,
    CoreBindings,
    inject,
    createBindingFromClass,
} from "@loopback/core";

import { CRUDBindings } from "./keys";
import { DEFAULT_CRUD_OPTIONS, CRUDComponentOptions } from "./types";
import { CRUDApiBuilder } from "./api";

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
        this.application.add(createBindingFromClass(CRUDApiBuilder));
    }
}
