import {
    inject,
    lifeCycleObserver,
    Context,
    Server,
    CoreBindings,
    Application,
} from "@loopback/core";
import { RestBindings } from "@loopback/rest";

import { CRUDBindings } from "../../keys";
import { CRUDGraphQLServerConfig } from "../../types";
import { CRUDRestServer } from "../../servers";

import { ApolloServer } from "apollo-server";
import { createGraphQLSchema } from "openapi-to-graphql";

@lifeCycleObserver("servers.GraphQL")
export class CRUDGraphQLServer extends Context implements Server {
    private _listening: boolean = false;
    private _server: ApolloServer;

    constructor(
        @inject(CoreBindings.APPLICATION_INSTANCE)
        app: Application,
        @inject(CRUDBindings.GRAPHQL_SERVER_CONFIG)
        public config: CRUDGraphQLServerConfig = {}
    ) {
        super(app);
    }

    get listening() {
        return this._listening;
    }
    async start() {
        let openApiSpec = await this.getApiSpec();

        const { schema, report } = await createGraphQLSchema(openApiSpec, {
            fillEmptyResponses: true,
        });

        this._server = new ApolloServer({ schema });

        const url = (await this._server.listen(this.config)).url;
        this._listening = true;

        console.log(`GraphQL Server is running on url ${url}`);
    }
    async stop() {
        await this._server.stop();
        this._listening = false;

        console.log(`QraphQL Server is stopped!`);
    }

    private getApiSpec() {
        const restServer = this.getSync<CRUDRestServer>(
            "servers.CRUDRestServer"
        );

        let spec = Object.assign({}, this.getSync(RestBindings.API_SPEC));

        spec.paths = (restServer as any).httpHandler.describeApiPaths();
        spec.components = {
            ...spec.components,
            schemas: (restServer as any).httpHandler.getApiDefinitions(),
        };

        /** hotfix: openapi default servers not added */
        spec.servers = [{ url: restServer.url || "/" }];

        return spec as any;
    }
}
