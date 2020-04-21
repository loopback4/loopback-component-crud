import {
    inject,
    lifeCycleObserver,
    Context,
    Server,
    CoreBindings,
    Application
} from "@loopback/core";

import { ACLBindings } from "../../keys";
import { ACLGraphQLServerConfig } from "../../types";
import { ACLRestServer } from "../../servers";

import { ApolloServer } from "apollo-server";
import { createGraphQlSchema } from "openapi-to-graphql";

@lifeCycleObserver("servers.GraphQL")
export class ACLGraphQLServer extends Context implements Server {
    private _listening: boolean = false;
    private _server: ApolloServer;

    constructor(
        @inject(CoreBindings.APPLICATION_INSTANCE)
        app: Application,
        @inject(ACLBindings.GRAPHQL_SERVER_CONFIG)
        public config: ACLGraphQLServerConfig = {}
    ) {
        super(app);
    }

    get listening() {
        return this._listening;
    }
    async start() {
        const restServer = this.getSync<ACLRestServer>("servers.ACLRestServer");

        let openApiSpec = await restServer.getApiSpec();

        /** hotfix: openapi default servers not added */
        openApiSpec.servers = [{ url: restServer.url || "/" }];

        /** hotfix: rest put methods don't return data */
        openApiSpec.paths = Object.entries(openApiSpec.paths)
            .map(pair => {
                const value = pair[1];
                if (value.put && value.put.responses["200"]) {
                    delete value.put.responses["200"].schema;
                }

                return pair;
            })
            .reduce((prev: any, current: any) => {
                prev[current[0]] = current[1];

                return prev;
            }, {});

        /** get OpenAPI specs from restServer and bind REST url to it */
        const { schema, report } = await createGraphQlSchema(
            openApiSpec as any,
            {
                fillEmptyResponses: true
            }
        );

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
}
