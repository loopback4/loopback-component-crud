import {
    inject,
    lifeCycleObserver,
    CoreBindings,
    Application,
} from "@loopback/core";
import { Ctor } from "loopback-component-history";

/** Swagger binding imports */
import { RestServer, RestComponent } from "@loopback/rest";
import { RestExplorerComponent } from "@loopback/rest-explorer";

/** Authentication binding imports */
import { AuthenticationComponent } from "@loopback/authentication";

import { CRUDBindings, PrivateCRUDBindings } from "../../keys";
import { CRUDRestServerConfig } from "../../types";
import { Sequence } from "../../servers";

import {
    User,
    Role,
    Permission,
    UserRole,
    RolePermission,
    Session,
    Code,
} from "../../models";

import {
    GenerateUsersController,
    GenerateUsersSelfController,
    GenerateUsersSessionController,
    GenerateUsersAccountController,
    GenerateUsersPasswordController,
    GenerateRolesController,
    GeneratePermissionsController,
} from "../../servers/rest/controllers";

@lifeCycleObserver("servers.REST")
export class CRUDRestServer extends RestServer {
    constructor(
        @inject(CoreBindings.APPLICATION_INSTANCE)
        app: Application,
        @inject(CRUDBindings.REST_SERVER_CONFIG)
        config: CRUDRestServerConfig = {},
        @inject(PrivateCRUDBindings.USER_MODEL)
        userCtor: Ctor<User>,
        @inject(PrivateCRUDBindings.ROLE_MODEL)
        roleCtor: Ctor<Role>,
        @inject(PrivateCRUDBindings.PERMISSION_MODEL)
        permissionCtor: Ctor<Permission>,
        @inject(PrivateCRUDBindings.USER_ROLE_MODEL)
        userRoleCtor: Ctor<UserRole>,
        @inject(PrivateCRUDBindings.ROLE_PERMISSION_MODEL)
        rolePermissionCtor: Ctor<RolePermission>,
        @inject(PrivateCRUDBindings.SESSION_MODEL)
        sessionCtor: Ctor<Session>,
        @inject(PrivateCRUDBindings.CODE_MODEL)
        codeCtor: Ctor<Code>
    ) {
        super(app, config);

        /** Fix rest application to rest server bug */
        (this as any).restServer = this;

        /** Set up default home page */
        if (config.homePath) {
            this.static("/", config.homePath);
        }

        /** Bind authentication component */
        app.component(AuthenticationComponent);

        /** Bind swagger component */
        app.component(RestComponent);
        app.bind("RestExplorerComponent.KEY").to(
            new RestExplorerComponent(this as any, {
                path: "/explorer",
            })
        );

        /** Set up the custom sequence */
        this.sequence(Sequence);

        /** Bind users controllers */
        app.controller(GenerateUsersController<User>(userCtor));
        app.controller(GenerateUsersSelfController<User>(userCtor));
        app.controller(
            GenerateUsersSessionController<Session, User>(sessionCtor, userCtor)
        );
        app.controller(
            GenerateUsersAccountController<Code, User>(codeCtor, userCtor)
        );
        app.controller(
            GenerateUsersPasswordController<Code, User>(codeCtor, userCtor)
        );

        /** Bind roles controllers */
        app.controller(GenerateRolesController<Role>(roleCtor));

        /** Bind permissions controllers */
        app.controller(
            GeneratePermissionsController<Permission>(permissionCtor)
        );
    }

    async start() {
        await super.start();

        console.log(`REST Server is running on url ${this.url}`);
    }
    async stop() {
        await super.stop();

        console.log(`REST Server is stopped!`);
    }
}
