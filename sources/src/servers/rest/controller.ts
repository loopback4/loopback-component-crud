import { inject } from "@loopback/context";
import { Request, RestBindings } from "@loopback/rest";
import { AuthenticationBindings } from "@loopback/authentication";
import { UserProfile } from "@loopback/security";

export class CRUDController {
    constructor(
        @inject(RestBindings.Http.REQUEST)
        public request: Request,
        @inject(AuthenticationBindings.CURRENT_USER, { optional: true })
        public session: UserProfile
    ) {}
}
