import {
    MetadataAccessor,
    MethodDecoratorFactory,
    MetadataInspector,
} from "@loopback/context";
import { Entity } from "@loopback/repository";

import { CRUDMetadata, CRUDController } from "../types";

export const CRUD_METHOD_KEY = MetadataAccessor.create<
    CRUDMetadata<any, any, any, any>,
    MethodDecorator
>("crud:method");

export function crud<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(metadata: CRUDMetadata<Model, ModelID, ModelRelations, Controller>) {
    return MethodDecoratorFactory.createDecorator<
        CRUDMetadata<Model, ModelID, ModelRelations, Controller>
    >(CRUD_METHOD_KEY, metadata);
}

export function getCRUDMetadata<
    Model extends Entity,
    ModelID,
    ModelRelations extends object,
    Controller extends CRUDController
>(target: object, methodName: string) {
    return MetadataInspector.getMethodMetadata<
        CRUDMetadata<Model, ModelID, ModelRelations, Controller>
    >(CRUD_METHOD_KEY, target, methodName);
}
