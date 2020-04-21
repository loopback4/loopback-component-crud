import { inject } from "@loopback/context";
import { Request, RestBindings } from "@loopback/rest";
import { AuthenticationBindings, TokenService } from "@loopback/authentication";

import { MessageHandler, ActivateHandler } from "../../types";
import { ACLBindings, PrivateACLBindings } from "../../keys";

import {
    DefaultUserRepository,
    DefaultRoleRepository,
    DefaultPermissionRepository,
    DefaultUserRoleRepository,
    DefaultRolePermissionRepository,
    SessionRepository,
    CodeRepository
} from "../../repositories";

import { Session, Code } from "../../models";

export class ACLController {
    constructor(
        @inject(RestBindings.Http.REQUEST)
        public request: Request,
        @inject(AuthenticationBindings.CURRENT_USER, { optional: true })
        public session: Session
    ) {}
}

export class Controller extends ACLController {
    constructor(
        @inject(RestBindings.Http.REQUEST)
        public request: Request,
        @inject(AuthenticationBindings.CURRENT_USER, { optional: true })
        public session: Session,

        @inject(PrivateACLBindings.CODE_TIMEOUT_CONSTANT)
        public codeTimeout: number,
        @inject(PrivateACLBindings.SESSION_TIMEOUT_CONSTANT)
        public sessionTimeout: number,

        @inject(PrivateACLBindings.TOKEN_SERVICE)
        public tokenService: TokenService,
        @inject(PrivateACLBindings.MESSAGE_PROVIDER)
        public messageHandler: MessageHandler,
        @inject(PrivateACLBindings.ACTIVATE_PROVIDER)
        public activateHandler: ActivateHandler,

        @inject(ACLBindings.USER_REPOSITORY)
        public userRepository: DefaultUserRepository,
        @inject(ACLBindings.ROLE_REPOSITORY)
        public roleRepository: DefaultRoleRepository,
        @inject(ACLBindings.PERMISSION_REPOSITORY)
        public permissionRepository: DefaultPermissionRepository,
        @inject(ACLBindings.USER_ROLE_REPOSITORY)
        public userRoleRepository: DefaultUserRoleRepository,
        @inject(ACLBindings.ROLE_PERMISSION_REPOSITORY)
        public rolePermissionRepository: DefaultRolePermissionRepository,
        @inject(ACLBindings.SESSION_REPOSITORY)
        public sessionRepository: SessionRepository<Session>,
        @inject(ACLBindings.CODE_REPOSITORY)
        public codeRepository: CodeRepository<Code>
    ) {
        super(request, session);
    }
}
