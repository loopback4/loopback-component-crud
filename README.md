# loopback-component-crud

![Travis (.org) branch](https://img.shields.io/travis/loopback4/loopback-component-crud/master)
![npm](https://img.shields.io/npm/v/loopback-component-crud)
![npm bundle size](https://img.shields.io/bundlephobia/min/loopback-component-crud)
![GitHub](https://img.shields.io/github/license/loopback4/loopback-component-crud)

Creating `CRUD` endpoints in any application is a repetitive and futile task.

Using this extension you can generate a configurable `CRUD` endpoints with these features:

1. **Authentication**
2. **Authorization**
3. **Validation**
4. **Nested Create**
5. **Nested Update**

## Installation

```bash
npm i --save loopback-component-crud
```

## Usage

Follow these steps to add `CRUD` extension to your loopback4 application

1. Add `CRUDComponent` to your application (bind `model-api-builder`)
2. Add CRUD config files to `src/model-endpoints`

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

### Step 2 (Model Endpoint)

Now, you can generate your `CRUD` endpoints by creating `src/model-endpoints/mymodel.rest-config.ts`:

```ts
import { CRUDApiConfig } from "loopback-component-crud";
import { MyModel } from "../models";

module.exports = {
    model: MyModel,
    pattern: "CRUD",
    dataSource: "MyDataSource",
    basePath: "/mymodel",
    create: {},
    read: {},
    update: {},
    delete: {},
} as CRUDApiConfig;
```

---

## Contributors

-   [KoLiBer](https://www.linkedin.com/in/mohammad-hosein-nemati-665b1813b/)

## License

This project is licensed under the [MIT license](LICENSE.md).  
Copyright (c) KoLiBer (koliberr136a1@gmail.com)
