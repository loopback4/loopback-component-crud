import { Context } from "@loopback/context";
import { Class } from "@loopback/repository";
import { CoreBindings } from "@loopback/core";

import { AuthorizationTags } from "@loopback/authorization";

import { PrivateCRUDBindings } from "../keys";
import { CRUDMixinConfig } from "../types";

export function CRUDMixin<T extends Class<any>>(superClass: T) {
    const bootObservers = (ctx: Context) => {
        /**
         * Fix: servers start dependency bug
         */
        ctx.bind(CoreBindings.LIFE_CYCLE_OBSERVER_OPTIONS).to({
            orderedGroups: ["servers.REST", "servers.GraphQL"],
        });
    };

    const bootProviders = (ctx: Context, configs: CRUDMixinConfig) => {
        ctx.bind(PrivateCRUDBindings.TOKEN_SERVICE).toClass(
            configs.tokenService
        );
        ctx.bind(PrivateCRUDBindings.AUTHORIZER_PROVIDER)
            .toProvider(configs.authorizerProvider)
            .tag(AuthorizationTags.AUTHORIZER);
    };

    return class extends superClass {
        public crudConfigs: CRUDMixinConfig;

        async boot() {
            bootObservers(this as any);

            await super.boot();

            bootProviders(this as any, this.crudConfigs);
        }
    };
}
