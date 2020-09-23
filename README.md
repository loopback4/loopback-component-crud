# loopback-component-crud

![Travis (.org) branch](https://img.shields.io/travis/loopback4/loopback-component-crud/master)
![npm](https://img.shields.io/npm/v/loopback-component-crud)
![npm bundle size](https://img.shields.io/bundlephobia/min/loopback-component-crud)
![GitHub](https://img.shields.io/github/license/loopback4/loopback-component-crud)

Creating `CRUD` controllers in any application is a repetitive and futile task.

Using this extension you can generate a configurable `CRUD` controller with these features:

1. **Authentication**
2. **Authorization**
3. **Validation**
4. **Limit**
5. etc

## Installation

```bash
npm i --save loopback-component-crud
```

## Usage

Follow these steps to add `CRUD` extension to your loopback4 application

1. Add `CRUDComponent` to your application (binding global interceptors)
2. Extends your controller from `CRUDControllerMixin`

Now, let's try:

---

### Step 1 (CRUD Component)

Edit your `application.ts` file:

```ts
import { CRUDComponent } from "loopback-component-crud";

export class TestApplication extends BootMixin(
    ServiceMixin(RepositoryMixin(RestApplication))
) {
    constructor(options: ApplicationConfig = {}) {
        super(options);

        // Add crud component
        this.component(CRUDComponent);
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
        repositoryGetter: (controller) => controller.usersController,

        create: {
            authentication: { strategy: "jwt" },
            authorization: {},
        },
        read: {
            authentication: { strategy: "jwt" },
            authorization: {},
        },
        update: {
            authentication: { strategy: "jwt" },
            authorization: {},
        },
        delete: {
            authentication: { strategy: "jwt" },
            authorization: {},
        },

        include: {},
    },
    ""
) {}
```

---

## Contributors

-   [KoLiBer](https://www.linkedin.com/in/mohammad-hosein-nemati-665b1813b/)

## License

This project is licensed under the [MIT license](LICENSE.md).  
Copyright (c) KoLiBer (koliberr136a1@gmail.com)
