import { injectable } from "@loopback/core";
import {
    asModelApiBuilder,
    ModelApiBuilder,
} from "@loopback/model-api-builder";
import { ApplicationWithRepositories } from "@loopback/repository";
import { Model } from "@loopback/rest";

import { CRUDApiConfig } from "../types";
import { CRUDControllerMixin } from "../controllers";

@injectable(asModelApiBuilder)
export class CRUDApiBuilder implements ModelApiBuilder {
    readonly pattern: string = "CRUD";

    async build(
        application: ApplicationWithRepositories,
        modelClass: typeof Model & {
            prototype: Model;
        },
        config: CRUDApiConfig
    ): Promise<void> {
        let repoBindingName = `repositories.${modelClass.name}Repository`;

        CRUDControllerMixin(config);
        application.controller();
    }
}
