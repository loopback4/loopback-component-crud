import { MixinTarget } from "@loopback/core";
import {
    Entity,
    Count,
    CountSchema,
    Class,
    Filter,
    EntityNotFoundError,
    RelationType,
} from "@loopback/repository";
import {
    get,
    post,
    put,
    del,
    param,
    requestBody,
    getModelSchemaRef,
    getFilterSchemaFor,
} from "@loopback/rest";

import { AuthenticationMetadata, authenticate } from "@loopback/authentication";
import { AuthorizationMetadata, authorize } from "@loopback/authorization";

import { CRUDApiConfig } from "../types";

/**
 * Create controller mixin, add Create rest operations
 */
export function CreateControllerMixin(
    authentication?: AuthenticationMetadata,
    authorization?: AuthorizationMetadata
) {
    return function <R extends MixinTarget<object>>(superClass: R) {
        class MixedController extends superClass {}

        return MixedController;
    };
}

/**
 * Read controller mixin, add Read rest operations
 */
export function ReadControllerMixin(
    authentication?: AuthenticationMetadata,
    authorization?: AuthorizationMetadata
) {
    return function <R extends MixinTarget<object>>(superClass: R) {
        class MixedController extends superClass {}

        return MixedController;
    };
}

/**
 * Update controller mixin, add Update rest operations
 */
export function UpdateControllerMixin(
    authentication?: AuthenticationMetadata,
    authorization?: AuthorizationMetadata
) {
    return function <R extends MixinTarget<object>>(superClass: R) {
        class MixedController extends superClass {}

        return MixedController;
    };
}

/**
 * Delete controller mixin, add Delete rest operations
 */
export function DeleteControllerMixin(
    authentication?: AuthenticationMetadata,
    authorization?: AuthorizationMetadata
) {
    return function <R extends MixinTarget<object>>(superClass: R) {
        class MixedController extends superClass {}

        return MixedController;
    };
}

/**
 * CRUD controller mixin, add CRUD rest operations
 */
export function CRUDControllerMixin(config: CRUDApiConfig) {
    return function <R extends MixinTarget<object>>(superClass: R) {
        if (config.create) {
            superClass = CreateControllerMixin(
                config.create.authentication,
                config.create.authorization
            )(superClass);
        }

        if (config.read) {
            superClass = ReadControllerMixin(
                config.read.authentication,
                config.read.authorization
            )(superClass);
        }

        if (config.update) {
            superClass = UpdateControllerMixin(
                config.update.authentication,
                config.update.authorization
            )(superClass);
        }

        if (config.delete) {
            superClass = DeleteControllerMixin(
                config.delete.authentication,
                config.delete.authorization
            )(superClass);
        }

        return superClass;
    };
}
