import { BindingKey, CoreBindings } from "@loopback/core";

import { CRUDComponent } from "./component";
import { CRUDApiBuilder } from "./api/builder.api";

/**
 * Binding keys used by this component.
 */
export namespace CRUDBindings {
    export const COMPONENT = BindingKey.create<CRUDComponent>(
        `${CoreBindings.COMPONENTS}.CRUDComponent`
    );

    export const CRUD_API_BUILDER = BindingKey.create<CRUDApiBuilder>(
        `CRUDApiBuilder`
    );
}
