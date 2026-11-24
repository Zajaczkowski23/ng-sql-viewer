import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SqlViewerFormsDirective } from '../../forms/public-api';
import { SqlViewerComponent } from '../public-api';

@Component({
  imports: [ReactiveFormsModule, SqlViewerComponent, SqlViewerFormsDirective],
  template: `
    <form [formGroup]="form">
      <ng-sql-viewer formControlName="query" [editable]="editable" />
    </form>
  `,
})
class ReactiveHost {
  readonly query = new FormControl('select 1', Validators.required);
  readonly form = new FormGroup({ query: this.query });
  editable = true;
}

@Component({
  imports: [ReactiveFormsModule, SqlViewerComponent, SqlViewerFormsDirective],
  template: `<ng-sql-viewer [formControl]="query" [editable]="editable()" />`,
})
class StandaloneControlHost {
  readonly query = new FormControl(
    { value: 'select 1', disabled: true },
    { nonNullable: true, updateOn: 'blur' },
  );
  readonly editable = signal(false);
}

@Component({
  imports: [FormsModule, SqlViewerComponent, SqlViewerFormsDirective],
  template: `<ng-sql-viewer [(ngModel)]="query" [editable]="true" />`,
})
class TemplateDrivenHost {
  readonly query = signal('select 1');
}

describe('SQL viewer with Angular Forms', () => {
  it('uses a named reactive form control as the source of SQL', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    await fixture.whenStable();

    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(field.value).toBe('select 1');

    const query = fixture.componentInstance.query;
    const changes: (string | null)[] = [];
    query.valueChanges.subscribe((value) => changes.push(value));
    query.setValue('select 2');
    await fixture.whenStable();
    expect(field.value).toBe('select 2');

    query.reset();
    await fixture.whenStable();
    expect(field.value).toBe('');
    expect(query.hasError('required')).toBe(true);
    expect(changes).toEqual(['select 2', null]);
  });

  it('reports user edits and formatting once each to the reactive form', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    await fixture.whenStable();

    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    const format = fixture.nativeElement.querySelector(
      '[data-action="format"]',
    ) as HTMLButtonElement;
    const query = fixture.componentInstance.query;
    const changes: (string | null)[] = [];
    query.valueChanges.subscribe((value) => changes.push(value));

    field.value = 'select id from users';
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(query.value).toBe('select id from users');
    expect(query.dirty).toBe(true);

    format.click();
    await fixture.whenStable();
    expect(query.value).toBe('select\n  id\nfrom\n  users');
    expect(field.value).toBe(query.value);
    expect(changes).toEqual(['select id from users', 'select\n  id\nfrom\n  users']);
    expect(query.untouched).toBe(true);

    field.dispatchEvent(new Event('blur'));
    expect(query.touched).toBe(true);
  });

  it('disables the standalone control and toolbar and restores configured editability', async () => {
    const fixture = TestBed.createComponent(StandaloneControlHost);
    await fixture.whenStable();

    const host = fixture.componentInstance;
    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    const copy = fixture.nativeElement.querySelector('[data-action="copy"]') as HTMLButtonElement;
    const format = fixture.nativeElement.querySelector(
      '[data-action="format"]',
    ) as HTMLButtonElement;
    expect(field.disabled).toBe(true);
    expect(copy.disabled).toBe(true);
    expect(format.disabled).toBe(true);

    host.query.setValue('select 2');
    await fixture.whenStable();
    expect(field.value).toBe('select 2');

    host.query.enable();
    await fixture.whenStable();
    expect(field.disabled).toBe(false);
    expect(field.readOnly).toBe(true);
    expect(copy.disabled).toBe(false);
    expect(format.disabled).toBe(false);
    format.click();
    await fixture.whenStable();
    expect(field.value).toBe('select\n  2');
    expect(host.query.value).toBe('select 2');
    expect(host.query.pristine).toBe(true);

    host.editable.set(true);
    await fixture.whenStable();
    expect(field.readOnly).toBe(false);
    expect(field.value).toBe('select 2');

    format.click();
    await fixture.whenStable();
    expect(host.query.value).toBe('select 2');

    format.dispatchEvent(new Event('blur'));
    expect(host.query.value).toBe('select\n  2');
    expect(host.query.touched).toBe(true);
  });

  it('supports two-way ngModel binding', async () => {
    const fixture = TestBed.createComponent(TemplateDrivenHost);
    await fixture.whenStable();

    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(field.value).toBe('select 1');

    field.value = 'select 3';
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.componentInstance.query()).toBe('select 3');

    fixture.componentInstance.query.set('select 4');
    await fixture.whenStable();
    expect(field.value).toBe('select 4');
  });
});
