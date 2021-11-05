## [1.7.1](https://github.com/loopback4/loopback-component-crud/compare/1.7.0...1.7.1) (2021-11-05)


### Bug Fixes

* change README, clean project ([e94f55d](https://github.com/loopback4/loopback-component-crud/commit/e94f55d14007714f28693214334bc5dafe914ba8))

## [1.7.1-next.1](https://github.com/loopback4/loopback-component-crud/compare/1.7.0...1.7.1-next.1) (2021-09-12)


### Bug Fixes

* change README, clean project ([e94f55d](https://github.com/loopback4/loopback-component-crud/commit/e94f55d14007714f28693214334bc5dafe914ba8))

# [1.7.0](https://github.com/loopback4/loopback-component-crud/compare/1.6.0...1.7.0) (2021-09-12)


### Bug Fixes

* add checkout step ([5bb6c46](https://github.com/loopback4/loopback-component-crud/commit/5bb6c46ee086cf687298142a5e3b6b89533b476b))
* add checkout step to version workflow ([028b21e](https://github.com/loopback4/loopback-component-crud/commit/028b21eae031d51dff5a6750a9d60e5652f4018d))
* ci add coreutils tar error cache ([11022fc](https://github.com/loopback4/loopback-component-crud/commit/11022fc4801240c19d82d1fd684438aa8a23b61c))
* ci add needs dependency ([10867fa](https://github.com/loopback4/loopback-component-crud/commit/10867fa3f0d3cf469765e7d5caf903d084a67545))
* ci add tar ([154fe77](https://github.com/loopback4/loopback-component-crud/commit/154fe771c872f594409af0d08f9688994dd8a897))
* ci cache key ([8b71ed0](https://github.com/loopback4/loopback-component-crud/commit/8b71ed08a3d4c9cc9f59b0b79a9ed32bd8f05102))
* ci prefix ([b1ee9f0](https://github.com/loopback4/loopback-component-crud/commit/b1ee9f0f0a88031a011805c58d80fe0f6664faa0))
* enable cache ([2f795bb](https://github.com/loopback4/loopback-component-crud/commit/2f795bb3e169a001d83e3fd4b989d5b4c0006d6c))
* semantic problem in .releaserc.yml ([e5ed255](https://github.com/loopback4/loopback-component-crud/commit/e5ed255c5a888bab1e77c3e957aa2e987400456c))
* syntax error in ci file ([89ac297](https://github.com/loopback4/loopback-component-crud/commit/89ac2979a9279783245c570b8e6bc580a526f78c))
* workflow file ([c585edc](https://github.com/loopback4/loopback-component-crud/commit/c585edc3f2e03be9bfb3226d559b53c426fcdebc))


### Features

* add cache for actions ([44ea04a](https://github.com/loopback4/loopback-component-crud/commit/44ea04a2896e1c8c690d9d08ee1ed3a707fd75f9))
* add github actions ([eb96c49](https://github.com/loopback4/loopback-component-crud/commit/eb96c49b018a9293af73768461bd18cba29c8c7b))
* add gitpod ([8783106](https://github.com/loopback4/loopback-component-crud/commit/87831063ca1b560979ab8c60b81256352b287ed5))
* add new CI/CD files ([fba5c61](https://github.com/loopback4/loopback-component-crud/commit/fba5c61e4073fca34794c1d13607f1b0f99400c6))
* add release workflow ([9d00a19](https://github.com/loopback4/loopback-component-crud/commit/9d00a199c3e625409b82a439eb6dcbd4a7f7fdd4))
* add semantic-release ([e576273](https://github.com/loopback4/loopback-component-crud/commit/e576273555030202d988ab2c6bab25e610353de2))
* add vscode theme to gitpod ([02b9c2f](https://github.com/loopback4/loopback-component-crud/commit/02b9c2f40408d6360f97c992477087784a05493a))

## v1.6.0

-   **feat**: support `object types` in nested create, update

## v1.5.0

-   **feat**: support `multiple` authentication `strategy`
-   **deps**: `update` packages

## v1.4.0

-   **Fix**: update nested hasMany relation fix `null id update all` bug

## v1.3.0

-   **Feat**: add `hasMany` update nested

## v1.2.0

-   **Feat**: get hasOne, hasMany `TargetRepository` from relation
-   **Fix**: add `context` to nestedUpdate method
-   **Fix**: check `target` repository is not undefined
-   **Fix**: add `includeRelations` to update apis
-   **Deps**: update `packages`

## v1.1.0

-   **Feat**: add CRUD `model-api-builder`
-   **Feat**: add `create nested`
-   **Feat**: add `update nested`
-   **Clean**: remove `relations` in controllers
-   **Deps**: update packages

## v1.0.1

-   **Fix**: remove sources folder from ci file

## v1.0.0

-   **Deps**: update packages
-   **Clean**: remove `sources` folder
-   **Clean**: remove `model-mapper` method
-   **Feat**: use `buildWhereForId` in utils and limit interceptor
-   **Fix**: disable filter for empty object (`mongo` error: `and` with empty array)
-   **Docs**: add shields to `README`

## v0.11.0

-   **Feat**: add `getAccess` method for getting nested authorization metadata
-   **Feat**: add `INTERCEPTOR_ORDERED_GROUPS` binding
-   **Feat**: add authentication `metadata`

## v0.10.0

-   **Refactor**: remove servers, providers, change project for signle goal reponsibility (CRUD controller)
-   **Feat**: merge interceptors into `exist`, `limit` global interceptors
-   **Feat**: add crud decorator for controller methods

## v0.9.0

-   **Fix**: swagger component bind `app`
-   **Deps**: update packages

## v0.8.1

-   **Feat**: add `Filter` instead of `Where` for `Update`, `Delete`, for cascade support
-   **Feat**: add unit tests for `utils.ts`
-   **Fix**: change `crud` option to `history`
-   **Fix**: check nested models in `validate` interceptor
-   **Deps**: update packages

## v0.6.0

-   **Feat**: add CI file
-   **Feat**: add `excludeProperties` to model settings
-   **Fix**: filter generator, fix bugs
-   **Fix**: add http `X-Total` header for count
-   **Fix**: change `interceptors` order

## v0.5.0

-   **Deps**: update packages
-   **Refactor**: remove `history`, `authorization` packages
-   **Feat**: add `exist`, `validate`,`limit` interceptors
-   **Feat:** add `TargetsManyController`, `TargetsOneController`

## v0.3.0

-   **Deps**: update `history`, `authorization` packages

## v0.2.0

-   **Docs**: update KPS
-   **Fix**: controller mixin, remove `put` response

## v0.1.0 - Initial release
