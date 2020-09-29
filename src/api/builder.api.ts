import { injectable, inject } from "@loopback/core";
import {
    asModelApiBuilder,
    ModelApiBuilder,
} from "@loopback/model-api-builder";
import {
    ApplicationWithRepositories,
    repository,
    EntityCrudRepository,
} from "@loopback/repository";
import { Model, RestBindings, Request, Response } from "@loopback/rest";
import { SecurityBindings, UserProfile } from "@loopback/security";

import { CRUDApiConfig, CRUDController } from "../types";
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
        class Controller implements CRUDController<any, any> {
            constructor(
                @repository(config.repository || `${modelClass.name}Repository`)
                public repository: EntityCrudRepository<any, any>,
                @inject(RestBindings.Http.REQUEST)
                public request: Request,
                @inject(RestBindings.Http.RESPONSE)
                public response: Response,
                @inject(SecurityBindings.USER, { optional: true })
                public session: UserProfile
            ) {}
        }

        application.controller(
            CRUDControllerMixin(config)(config.controller || Controller)
        );
    }
}
