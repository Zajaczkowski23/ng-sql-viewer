import { Directive } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SqlViewerComponent } from 'ng-sql-viewer';

@Directive({
  selector: 'ng-sql-viewer[formControl], ng-sql-viewer[formControlName], ng-sql-viewer[ngModel]',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: SqlViewerComponent, multi: true }],
})
export class SqlViewerFormsDirective {}
