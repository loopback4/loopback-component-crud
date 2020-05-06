import { inject } from "@loopback/context";
import { Request, Response, RestBindings } from "@loopback/rest";
import { AuthenticationBindings } from "@loopback/authentication";
import { UserProfile } from "@loopback/security";

export class CRUDController {
    constructor(
        @inject(RestBindings.Http.REQUEST)
        public request: Request,
        @inject(RestBindings.Http.RESPONSE)
        public response: Response,
        @inject(AuthenticationBindings.CURRENT_USER, { optional: true })
        public session: UserProfile
    ) {}
}
