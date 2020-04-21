import { inject } from "@loopback/context";
import { Request, RestBindings } from "@loopback/rest";
import { AuthenticationBindings, TokenService } from "@loopback/authentication";

import { MessageHandler, ActivateHandler } from "../../types";
import { CRUDBindings, PrivateCRUDBindings } from "../../keys";

import {
    DefaultUserRepository,
    DefaultRoleRepository,
    DefaultPermissionRepository,
    DefaultUserRoleRepository,
    DefaultRolePermissionRepository,
    SessionRepository,
    CodeRepository,
} from "../../repositories";

import { Session, Code } from "../../models";

export class CRUDController {
    constructor(
        @inject(RestBindings.Http.REQUEST)
        public request: Request,
        @inject(AuthenticationBindings.CURRENT_USER, { optional: true })
        public session: Session
    ) {}
}

export class Controller extends CRUDController {
    constructor(
        @inject(RestBindings.Http.REQUEST)
        public request: Request,
        @inject(AuthenticationBindings.CURRENT_USER, { optional: true })
        public session: Session,

        @inject(PrivateCRUDBindings.CODE_TIMEOUT_CONSTANT)
        public codeTimeout: number,
        @inject(PrivateCRUDBindings.SESSION_TIMEOUT_CONSTANT)
        public sessionTimeout: number,

        @inject(PrivateCRUDBindings.TOKEN_SERVICE)
        public tokenService: TokenService,
        @inject(PrivateCRUDBindings.MESSAGE_PROVIDER)
        public messageHandler: MessageHandler,
        @inject(PrivateCRUDBindings.ACTIVATE_PROVIDER)
        public activateHandler: ActivateHandler,

        @inject(CRUDBindings.USER_REPOSITORY)
        public userRepository: DefaultUserRepository,
        @inject(CRUDBindings.ROLE_REPOSITORY)
        public roleRepository: DefaultRoleRepository,
        @inject(CRUDBindings.PERMISSION_REPOSITORY)
        public permissionRepository: DefaultPermissionRepository,
        @inject(CRUDBindings.USER_ROLE_REPOSITORY)
        public userRoleRepository: DefaultUserRoleRepository,
        @inject(CRUDBindings.ROLE_PERMISSION_REPOSITORY)
        public rolePermissionRepository: DefaultRolePermissionRepository,
        @inject(CRUDBindings.SESSION_REPOSITORY)
        public sessionRepository: SessionRepository<Session>,
        @inject(CRUDBindings.CODE_REPOSITORY)
        public codeRepository: CodeRepository<Code>
    ) {
        super(request, session);
    }
}
