import { vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SqlViewerComponent } from '../public-api';

describe('SQL viewer public component', () => {
  afterEach(() => vi.restoreAllMocks());
  it('displays verbatim Unicode SQL and trailing blank lines in a read-only field', async () => {
    const fixture = TestBed.createComponent(SqlViewerComponent);
    fixture.componentRef.setInput('sql', "  select 'Zażółć 🦊', '\t';\n\n");
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(field?.value).toBe("  select 'Zażółć 🦊', '\t';\n\n");
    expect(field.readOnly).toBe(true);
    expect(field.getAttribute('aria-label')).toBe('SQL query');
  });
  it('replaces the displayed value and clears it when the parent sends empty SQL', async () => {
    const fixture = TestBed.createComponent(SqlViewerComponent);
    fixture.componentRef.setInput('sql', 'select 1');
    await fixture.whenStable();
    fixture.componentRef.setInput('sql', 'select 2');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('textarea').value).toBe('select 2');
    fixture.componentRef.setInput('sql', '');
    fixture.componentRef.setInput('ariaLabel', 'Query history');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('textarea').value).toBe('');
    expect(fixture.nativeElement.querySelector('textarea').getAttribute('aria-label')).toBe(
      'Query history',
    );
  });

  it('highlights SQL while keeping markup inert and the exact source intact', async () => {
    const fixture = TestBed.createComponent(SqlViewerComponent);
    fixture.componentRef.setInput('sql', "select '<img src=x onerror=alert(1)>' as café;\n\n");
    await fixture.whenStable();
    const layer = fixture.nativeElement.querySelector('[aria-hidden="true"]');
    expect(layer?.textContent).toBe("select '<img src=x onerror=alert(1)>' as café;\n\n");
    expect(layer?.querySelector('.token.keyword')?.textContent).toBe('select');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    fixture.componentRef.setInput('sql', '');
    await fixture.whenStable();
    expect(layer.textContent).toBe('');
  });
  it('emits the entire edited SQL and preserves selection on a parent echo', async () => {
    const fixture = TestBed.createComponent(SqlViewerComponent);
    fixture.componentRef.setInput('sql', 'select 1');
    fixture.componentRef.setInput('editable', true);
    await fixture.whenStable();
    const changes: string[] = [];
    fixture.componentInstance.sqlChange.subscribe((value) => changes.push(value));
    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(field.readOnly).toBe(false);
    field.value = 'select 12';
    field.setSelectionRange(8, 8);
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(changes).toEqual(['select 12']);
    fixture.componentRef.setInput('sql', 'select 12');
    await fixture.whenStable();
    expect(field.selectionStart).toBe(8);
    expect(fixture.nativeElement.querySelector('pre').textContent).toBe('select 12');
    fixture.componentRef.setInput('editable', false);
    await fixture.whenStable();
    expect(field.readOnly).toBe(true);
    expect(field.value).toBe('select 12');
    fixture.componentRef.setInput('sql', 'select 3');
    await fixture.whenStable();
    expect(field.value).toBe('select 3');
    expect(changes).toEqual(['select 12']);
  });
  it('keeps an unbound edit when editing is disabled and other options change', async () => {
    const fixture = TestBed.createComponent(SqlViewerComponent);
    fixture.componentRef.setInput('sql', 'select 1');
    fixture.componentRef.setInput('editable', true);
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('textarea');
    field.value = 'select 42';
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.componentRef.setInput('editable', false);
    await fixture.whenStable();
    expect(field.value).toBe('select 42');
  });
  it('formats read-only presentation without emitting and restores application SQL on editing', async () => {
    const fixture = TestBed.createComponent(SqlViewerComponent);
    fixture.componentRef.setInput('sql', 'select id from users');
    await fixture.whenStable();
    const changes: string[] = [];
    fixture.componentInstance.sqlChange.subscribe((value) => changes.push(value));
    const button = fixture.nativeElement.querySelector(
      'button[data-action="format"]',
    ) as HTMLButtonElement;
    expect(button?.type).toBe('button');
    button.click();
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('textarea');
    expect(field.value).toBe('select\n  id\nfrom\n  users');
    expect(changes).toEqual([]);
    fixture.componentRef.setInput('editable', true);
    await fixture.whenStable();
    expect(field.value).toBe('select id from users');
    button.click();
    await fixture.whenStable();
    expect(changes).toEqual(['select\n  id\nfrom\n  users']);
  });
  it('preserves malformed SQL on format failure and clears the error on editing', async () => {
    const fixture = TestBed.createComponent(SqlViewerComponent);
    fixture.componentRef.setInput('sql', "select 'private unfinished");
    fixture.componentRef.setInput('editable', true);
    await fixture.whenStable();
    const errors: { message: string; dialect: string }[] = [];
    const changes: string[] = [];
    fixture.componentInstance.formatError.subscribe((value) => errors.push(value));
    fixture.componentInstance.sqlChange.subscribe((value) => changes.push(value));
    fixture.nativeElement.querySelector('[data-action="format"]').click();
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('textarea');
    expect(field.value).toBe("select 'private unfinished");
    expect(changes).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].dialect).toBe('sql');
    expect(errors[0].message).not.toContain('private');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      errors[0].message,
    );
    field.value = 'select 1';
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });
  it('copies the displayed SQL and reports success only after clipboard completion', async () => {
    const fixture = TestBed.createComponent(SqlViewerComponent);
    fixture.componentRef.setInput('sql', 'select id from users');
    await fixture.whenStable();
    let copied = '';
    let finish!: () => void;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (value: string) => {
          copied = value;
          return new Promise<void>((resolve) => {
            finish = resolve;
          });
        },
      },
    });
    fixture.nativeElement.querySelector('[data-action="format"]').click();
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('[data-action="copy"]') as HTMLButtonElement;
    expect(button?.type).toBe('button');
    button.click();
    await fixture.whenStable();
    expect(copied).toBe('select\n  id\nfrom\n  users');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).not.toContain(
      'Copied',
    );
    finish();
    await Promise.resolve();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Copied');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    button.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Select the SQL',
    );
    expect(fixture.nativeElement.querySelector('textarea').value).toBe(copied);
  });
  it('configures wrapping, height, theme, and independently hidden toolbar actions', async () => {
    const fixture = TestBed.createComponent(SqlViewerComponent);
    fixture.componentRef.setInput('height', '180px');
    fixture.componentRef.setInput('theme', 'dark');
    fixture.componentRef.setInput('wrap', true);
    fixture.componentRef.setInput('showCopy', false);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.surface').style.height).toBe('180px');
    expect(fixture.nativeElement.getAttribute('data-theme')).toBe('dark');
    expect(fixture.nativeElement.querySelector('textarea').wrap).toBe('soft');
    expect(fixture.nativeElement.querySelector('[data-action="copy"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-action="format"]')).not.toBeNull();
    fixture.componentRef.setInput('showCopy', true);
    fixture.componentRef.setInput('showFormat', false);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-action="format"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-action="copy"]')).not.toBeNull();
  });
  it('does not rewrite native text during input, composition, or parent echoes', async () => {
    const fixture = TestBed.createComponent(SqlViewerComponent);
    fixture.componentRef.setInput('editable', true);
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!;
    let writes = 0;
    Object.defineProperty(field, 'value', {
      get() {
        return descriptor.get!.call(this);
      },
      set(value) {
        writes++;
        descriptor.set!.call(this, value);
      },
    });
    field.value = 'select 日本語';
    writes = 0;
    field.setSelectionRange(7, 9);
    field.dispatchEvent(new Event('compositionstart'));
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.nativeElement.classList.contains('composing')).toBe(true);
    field.dispatchEvent(new Event('compositionend'));
    fixture.componentRef.setInput('sql', 'select 日本語');
    await fixture.whenStable();
    expect(writes).toBe(0);
    expect([field.selectionStart, field.selectionEnd]).toEqual([7, 9]);
    expect(fixture.nativeElement.classList.contains('composing')).toBe(false);
  });

  it('uses the selected dialect only on explicit Format and clears failures on replacement', async () => {
    const fixture = TestBed.createComponent(SqlViewerComponent);
    fixture.componentRef.setInput('sql', 'select [name] from [users]');
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('textarea');
    fixture.nativeElement.querySelector('[data-action="format"]').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    fixture.componentRef.setInput('dialect', 'tsql');
    await fixture.whenStable();
    expect(field.value).toBe('select [name] from [users]');
    fixture.nativeElement.querySelector('[data-action="format"]').click();
    await fixture.whenStable();
    expect(field.value).toBe('select\n  [name]\nfrom\n  [users]');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    fixture.componentRef.setInput('sql', '');
    await fixture.whenStable();
    fixture.nativeElement.querySelector('[data-action="format"]').click();
    await fixture.whenStable();
    expect(field.value).toBe('');
  });
});
