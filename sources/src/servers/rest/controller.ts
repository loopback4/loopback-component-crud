import { inject } from "@loopback/context";
import { Request, Response, RestBindings } from "@loopback/rest";
import { SecurityBindings, UserProfile } from "@loopback/security";

export class CRUDController {
    constructor(
        @inject(RestBindings.Http.REQUEST)
        public request: Request,
        @inject(RestBindings.Http.RESPONSE)
        public response: Response,
        @inject(SecurityBindings.USER, { optional: true })
        public session: UserProfile
    ) {}
}
