import { BindingKey, CoreBindings } from "@loopback/core";

import { CRUDComponent } from "./component";

/**
 * Binding keys used by this component.
 */
export namespace CRUDBindings {
    export const COMPONENT = BindingKey.create<CRUDComponent>(
        `${CoreBindings.COMPONENTS}.CRUDComponent`
    );
}
