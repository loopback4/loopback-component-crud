# Changelog

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
