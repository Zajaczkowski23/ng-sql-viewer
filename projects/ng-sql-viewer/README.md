# ng-sql-viewer

Display SQL in Angular with syntax highlighting, formatting, and a copy button. Enable editing when you need it.

Supports Angular 21 and 22. Styles and dependencies are included. No extra setup required.

## Get started

```sh
npm install ng-sql-viewer
```

Import the component and pass it your SQL:

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

## Enable editing

Use two-way binding to keep `query` updated as the user types:

```html
<ng-sql-viewer [(sql)]="query" [editable]="true" />
```

The component edits text only. Your application handles saving or running queries.

## Customize

For example, use PostgreSQL formatting, a dark theme, and a shorter viewer:

```html
<ng-sql-viewer [sql]="query" dialect="postgresql" theme="dark" height="240px" />
```

All inputs are optional:

- `sql`: SQL text. Defaults to `''`; supports two-way binding with `[(sql)]`.
- `editable`: allow editing. Defaults to `false`.
- `dialect`: SQL formatting dialect, such as `postgresql`, `mysql`, `sqlite`, or `tsql`. Defaults to `sql`.
- `theme`: `system`, `light`, or `dark`. Defaults to `system`.
- `height`: viewer height as a CSS length. Defaults to `320px`.
- `wrap`: wrap long lines. Defaults to `false`.
- `showCopy` / `showFormat`: show the toolbar buttons. Both default to `true`.
- `ariaLabel`: accessible label for the SQL text area. Defaults to `SQL query`.

## Formatting and copying

SQL stays as supplied until the user clicks **Format**. In read-only mode, formatting changes only the displayed text. In editing mode, it also updates the bound SQL through `sqlChange`.

If formatting fails, the SQL is kept and `formatError` emits `{ message, dialect }`. You can handle it with `(formatError)="onFormatError($event)"`.

**Copy** copies the displayed text. If the browser blocks clipboard access, the viewer shows instructions for copying manually.

## Development

```sh
npm ci
npm run typecheck
npm test -- --watch=false
npm run build
```

To try local changes in another app, run `npm pack ./dist/ng-sql-viewer` and install the generated tarball.

## License

[MIT](./LICENSE). Third-party licenses are included in `THIRD_PARTY_NOTICES.md` in the npm package.
