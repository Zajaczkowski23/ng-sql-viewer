# ng-sql-viewer

Display and edit SQL in Angular with syntax highlighting, formatting, and a copy button. Supports Angular 21 and 22.

[Try the report builder demo on StackBlitz](https://stackblitz.com/fork/github/Zajaczkowski23/ng-sql-viewer/tree/stackblitz-demo/examples/report-builder?file=main.ts).

## Get started

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

## Editing

Enable editing and bind the SQL to your component.

```html
<ng-sql-viewer [(sql)]="query" [editable]="true" />
```

The component edits text only. Your application handles saving or running queries.

### Angular Forms

For a reactive form, import `SqlViewerComponent`, `SqlViewerFormsDirective` from `ng-sql-viewer/forms`, and `ReactiveFormsModule` in your host component.

```html
<ng-sql-viewer [formControl]="queryControl" [editable]="true" />
```

Initialize `queryControl` with `new FormControl('', { nonNullable: true })`. Use `formControlName` inside a form group, or import `FormsModule` and use `[(ngModel)]="query"` for a template-driven form.

Use one value binding per viewer. The form supplies the SQL, receives edits and formatting changes in edit mode, and marks the control touched when the text area loses focus. Disabling the control also disables the toolbar.

Forms integration requires `@angular/forms` at the same version as your app's `@angular/core`. Plain `[sql]` and `[(sql)]` bindings only need `SqlViewerComponent`.

## Customize

For example, use PostgreSQL formatting, a dark theme, and a shorter viewer.

```html
<ng-sql-viewer [sql]="query" dialect="postgresql" theme="dark" height="240px" />
```

All inputs are optional.

- `sql` sets the query text. The viewer starts empty by default.
- `editable` enables typing. The viewer is read-only by default.
- `dialect` selects the SQL formatter dialect. The default is `sql`. Other options include `postgresql`, `mysql`, `sqlite`, and `tsql`.
- `theme` follows the system theme by default. Set it to `light` or `dark` to override it.
- `height` sets the viewer height as a CSS length. The default is `320px`.
- `wrap` wraps long lines when set to `true`. Wrapping is off by default.
- `showCopy` and `showFormat` show their toolbar buttons by default. Set either to `false` to hide it.
- `ariaLabel` sets the accessible label for the SQL text area. The default is `SQL query`.

## Toolbar

**Format** updates the displayed SQL and, in edit mode, the bound value. If formatting fails, the SQL stays as it was and `formatError` emits `{ message, dialect }`. If the browser blocks clipboard access, **Copy** shows instructions for copying manually.

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
