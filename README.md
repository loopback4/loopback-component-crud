# loopback-component-crud

[![Build Status](https://travis-ci.com/loopback4/loopback-component-crud.svg?branch=master)](https://travis-ci.com/loopback4/loopback-component-crud)

Creating `CRUD` controllers in any application is a repetitive and futile task.

Using this extension you can generate a configurable `CRUD` controller with these features:

1. **Authentication**
2. **Authorization**
3. **Filtering**
4. **Validating**
5. etc

## Installation

```bash
npm i --save loopback-component-crud
```

## Usage

Follow these steps to add `CRUD` extension to your loopback4 application

1. Define your Relational and Cache `dataSources`
2. Add `CRUDMixin` to your application
3. Bind `CRUDRestServer`

Now, let's try:

---

### Step 1 (Application Mixin)

Edit your `application.ts` file:

```ts
import {
    CRUDMixin,
    CRUDRestServer,
    CRUDGQLServer,
} from "loopback-component-crud";

import { MyTokenService, MyAuthorizerProvider } from "./providers";

export class TestApplication extends CRUDMixin(
    BootMixin(ServiceMixin(RepositoryMixin(Application)))
) {
    constructor(options: ApplicationConfig = {}) {
        super(options);

        // Add configs to crud mixin
        this.crudConfigs = {
            tokenService: MyTokenService,
            authorizerProvider: MyAuthorizerProvider,
        };

        // Bind servers
        this.server(CRUDRestServer);
        this.server(CRUDGQLServer);
    }
}
```

---

### Step 2 (Controller Mixin)

Now, you can generate your `CRUD` controller using `CRUDControllerMixin`:

```ts
import { CRUDControllerMixin, CRUDController } from "loopback-component-crud";

export class UserController extends CRUDControllerMixin(
    User,
    CRUDController,
    {
        modelValidator: (context, models) => true,
        repositoryGetter: (controller) => controller.usersController,
    },
    ""
) {}
```

---

## Contributions

-   [KoLiBer](https://www.linkedin.com/in/mohammad-hosein-nemati-665b1813b/)

## License

This project is licensed under the [MIT license](LICENSE).  
Copyright (c) KoLiBer (koliberr136a1@gmail.com)
