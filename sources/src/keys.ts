import { MetadataAccessor } from "@loopback/context";

import { CRUDMetadata } from "./types";

/**
 * Public bindings used in application scope
 */
export namespace CRUDBindings {}

/**
 * Private binding used in component scope
 */
export namespace PrivateCRUDBindings {}

export const CRUD_METHOD_KEY = MetadataAccessor.create<
    CRUDMetadata<any, any, any, any>,
    MethodDecorator
>("crud:method");
