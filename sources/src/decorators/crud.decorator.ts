import { MethodDecoratorFactory, MetadataInspector } from "@loopback/context";
import { Entity } from "@loopback/repository";

import { CRUD_METHOD_KEY } from "../keys";
import { CRUDMetadata, CRUDController } from "../types";

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
