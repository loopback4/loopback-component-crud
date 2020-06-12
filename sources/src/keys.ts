import { MetadataAccessor } from "@loopback/context";

import { CRUDMetadata } from "./types";

export const CRUD_METHOD_KEY = MetadataAccessor.create<
    CRUDMetadata<any, any, any, any>,
    MethodDecorator
>("crud:method");
