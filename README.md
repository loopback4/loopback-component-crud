# loopback-component-crud

![checks](https://img.shields.io/github/checks-status/loopback4/loopback-component-crud/next)
![npm latest](https://img.shields.io/npm/v/loopback-component-crud/latest)
![npm next](https://img.shields.io/npm/v/loopback-component-crud/next)
![license](https://img.shields.io/github/license/loopback4/loopback-component-crud)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Floopback4%2Floopback-component-crud.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Floopback4%2Floopback-component-crud?ref=badge_shield)

Creating `CRUD` endpoints in any application is a repetitive and futile task.

Using this extension you can generate a configurable `CRUD` endpoints with these features:

-   **Authentication**
-   **Authorization**
-   **Validation**
-   **Nested Create**
-   **Nested Update**

## Installation

Use the package manager [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) to install `loopback-component-crud`.

```bash
npm i --save loopback-component-crud
```

## Usage

Follow these steps to add `CRUD` extension to your loopback4 application:

-   Add `CRUDComponent` to your application (bind `model-api-builder`)

    ```ts
    // application.ts
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

-   Add CRUD config files to `src/model-endpoints`

    ```ts
    // src/model-endpoints/mymodel.rest-config.ts
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

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

This project is licensed under the [MIT](LICENSE.md).  
Copyright (c) KoLiBer (koliberr136a1@gmail.com)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Floopback4%2Floopback-component-crud.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Floopback4%2Floopback-component-crud?ref=badge_large)
