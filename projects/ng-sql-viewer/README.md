# ng-sql-viewer

A standalone Angular component for displaying and optionally editing SQL.

```sh
npm install ng-sql-viewer
```

```ts
import { Component } from '@angular/core';
import { SqlViewerComponent } from 'ng-sql-viewer';

@Component({
  selector: 'app-query',
  imports: [SqlViewerComponent],
  template: `<ng-sql-viewer [sql]="query" />`,
})
export class QueryDetails {
  query = 'select * from users';
}
```

The package name is provisional; this project has not been published. For local use, run `npm run build` and `npm pack ./dist/ng-sql-viewer`, then install the resulting tarball in your application.

Prism SQL highlighting, formatter dialects, and component styles ship through the package. No stylesheet imports, providers, themes, or extra highlighter/formatter installs are needed.

## Editing

```html
<ng-sql-viewer [(sql)]="query" [editable]="true" />
```

Each native input emits the complete current SQL immediately. Initial values and parent replacements do not emit. Parent echoes preserve native selection and scrolling. Disabling editing retains the draft. Your application owns persistence; the component does not execute queries, connect to a database, or provide Save.

## Configuration

```html
<ng-sql-viewer
  [(sql)]="query"
  [editable]="true"
  dialect="postgresql"
  theme="dark"
  height="240px"
  [wrap]="true"
  [showCopy]="true"
  [showFormat]="true"
  ariaLabel="Order query"
  (formatError)="onFormatError($event)"
/>
```

- `sql`: string, default `''`; paired with `sqlChange: string` for two-way binding.
- `editable`: boolean, default `false`.
- `dialect`: supported sql-formatter identifier, default `'sql'`. Includes `bigquery`, `db2`, `db2i`, `duckdb`, `hive`, `mariadb`, `mysql`, `tidb`, `n1ql`, `plsql`, `postgresql`, `redshift`, `spark`, `sqlite`, `sql`, `trino`, `transactsql`, `singlestoredb`, `snowflake`, and alias `tsql`.
- `theme`: `'system' | 'light' | 'dark'`, default `'system'`, following preference changes through CSS.
- `height`: CSS length string, default `'320px'`; the text surface scrolls internally.
- `wrap`: boolean, default `false`, preserving horizontal scrolling.
- `showCopy` and `showFormat`: booleans, each default `true`, independently hiding actions.
- `ariaLabel`: string, default `'SQL query'`, naming the native text surface.
- `formatError`: `SqlFormatError` output containing `{ message: string; dialect: string }`. Messages do not include source SQL or raw dependency errors.

## Formatting and copying

SQL is initially preserved verbatim, including whitespace and trailing lines. Only the Format button invokes sql-formatter. Dialect changes leave text unchanged. Generic Prism SQL highlighting is lexical coloring, not validation.

In read-only mode, Format changes temporary presentation only; Copy uses that displayed text. Entering editing restores application SQL. In editing mode, Format replaces the draft and emits one value. Parent replacements supersede temporary presentation. Format failures preserve SQL and emit one error per attempt. A successful format, new application SQL, or user edit clears the error.

Incomplete or dialect-specific SQL may not format successfully. Native undo works for ordinary text edits; preserving undo history across programmatic Format or parent replacement is not guaranteed. No custom indentation, autocomplete, diagnostics, line numbers, Angular Forms adapter, or imperative API is provided. Tab moves focus normally.

Copy reports success only after clipboard completion. Browser permission and secure-context restrictions can prevent access; inline feedback explains how to use native selection and copy instead. Clipboard failure does not emit `formatError` or change SQL.

## Compatibility and validation

Targets Angular 21 and 22 through peer dependencies, without bundling an Angular runtime. Packed consumers were verified on Angular 21.2.25 and 22.2.3 during implementation. Chromium checks covered editing, native undo, scrolling, wrapping, resizing, and SSR hydration. Firefox, WebKit, real mobile/IME input, and assistive-technology validation remain outstanding.

Server output preserves readable native SQL. Browser-only observers are initialized after rendering and disconnected on destruction. Forced-colors mode exposes native text. Consumers use their application's ordinary Angular SSR/hydration setup.

Prism and the formatter's nearley dependency produce CommonJS optimization warnings. All formatter dialects are included eagerly; no size or large-query performance guarantee is made.

## Development

```sh
npm ci
npm run typecheck
npm test -- --watch=false
npm run build
npm pack ./dist/ng-sql-viewer
```

The repository contains the component library, its tests, and Angular library build configuration.

No npm publication is performed. The project uses the MIT license. The final package identity requires a release decision. Third-party runtime licenses are included in `THIRD_PARTY_NOTICES.md`.
