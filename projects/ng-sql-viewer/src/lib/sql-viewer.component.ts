/// <reference path="../prism-core.d.ts" />
import { DOCUMENT } from '@angular/common';
import {
  afterEveryRender,
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import { format, type SqlLanguage } from 'sql-formatter';
import Prism from 'prismjs/components/prism-core.js';
import 'prismjs/components/prism-sql.js';

// Tokenize only this component's SQL; never scan the consumer application's DOM.
Prism.manual = true;

interface HighlightToken {
  text: string;
  type: string;
}

function flattenTokens(tokens: Prism.TokenStream, type = ''): HighlightToken[] {
  if (typeof tokens === 'string') return [{ text: tokens, type }];
  if (Array.isArray(tokens)) return tokens.flatMap((token) => flattenTokens(token, type));
  return flattenTokens(tokens.content, tokens.type);
}

export interface SqlFormatError {
  message: string;
  dialect: string;
}

@Component({
  selector: 'ng-sql-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sql-viewer.component.html',
  styleUrl: './sql-viewer.component.css',
  host: {
    '[class.ready]': 'ready()',
    '[class.composing]': 'composing()',
    '[attr.data-theme]': 'theme()',
  },
})
export class SqlViewerComponent implements OnChanges {
  readonly sql = input('');
  readonly theme = input<'system' | 'light' | 'dark'>('system');
  readonly height = input('320px');
  readonly wrap = input(false);
  readonly editable = input(false);
  readonly dialect = input<SqlLanguage>('sql');
  readonly showCopy = input(true);
  readonly showFormat = input(true);
  readonly ariaLabel = input('SQL query');
  readonly formatError = output<SqlFormatError>();
  readonly sqlChange = output<string>();

  protected readonly copyFeedback = signal('');
  private copyAttempt = 0;
  private readonly document = inject(DOCUMENT);
  protected readonly error = signal('');
  protected readonly displayed = signal('');
  protected readonly ready = signal(false);
  protected readonly composing = signal(false);
  protected readonly tokens = computed(() =>
    flattenTokens(Prism.tokenize(this.displayed(), Prism.languages['sql'])),
  );
  protected initialValue = '';
  private initialized = false;
  private applicationSql = '';
  private wasEditable = false;
  private readonly field = viewChild<ElementRef<HTMLTextAreaElement>>('field');
  private readonly layer = viewChild<ElementRef<HTMLPreElement>>('layer');
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.ready.set(true);
      const field = this.field()?.nativeElement;
      if (field && typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => this.syncScroll());
        observer.observe(field);
        this.destroyRef.onDestroy(() => observer.disconnect());
      }
    });
    afterEveryRender(() => {
      const field = this.field()?.nativeElement;
      // Native input already owns the current value. Assign only on an actual
      // external/programmatic replacement, preserving caret and browser undo.
      if (field && field.value !== this.displayed()) field.value = this.displayed();
      this.syncScroll();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) {
      this.initialValue = this.sql();
      this.initialized = true;
    }
    if (changes['sql'] && this.sql() !== this.applicationSql) {
      this.error.set('');
      this.applicationSql = this.sql();
      this.displayed.set(this.applicationSql);
    }
    if (this.editable() && !this.wasEditable) this.displayed.set(this.applicationSql);
    this.wasEditable = this.editable();
  }

  protected async copySql(): Promise<void> {
    const attempt = ++this.copyAttempt;
    this.copyFeedback.set('');
    try {
      const clipboard = this.document.defaultView?.navigator.clipboard;
      if (!clipboard) throw new Error('Clipboard unavailable');
      await clipboard.writeText(this.displayed());
      if (!this.destroyRef.destroyed && attempt === this.copyAttempt)
        this.copyFeedback.set('Copied SQL.');
    } catch {
      if (!this.destroyRef.destroyed && attempt === this.copyAttempt) {
        this.copyFeedback.set(
          'Copy unavailable. Select the SQL and use your device’s copy shortcut.',
        );
      }
    }
  }

  protected formatSql(): void {
    try {
      const formatted = format(this.displayed(), { language: this.dialect() });
      this.displayed.set(formatted);
      this.error.set('');
      if (this.editable()) {
        this.applicationSql = formatted;
        this.sqlChange.emit(formatted);
      }
    } catch {
      const message = 'Unable to format SQL. Check the query and selected dialect.';
      this.error.set(message);
      this.formatError.emit({ message, dialect: this.dialect() });
    }
  }

  protected onInput(event: Event): void {
    if (!this.editable()) return;
    const value = (event.target as HTMLTextAreaElement).value;
    this.error.set('');
    this.applicationSql = value;
    this.displayed.set(value);
    this.sqlChange.emit(value);
  }

  protected syncScroll(): void {
    const field = this.field()?.nativeElement;
    const layer = this.layer()?.nativeElement;
    if (!field || !layer) return;
    layer.style.width = `${field.clientWidth}px`;
    layer.style.height = `${field.clientHeight}px`;
    layer.scrollTop = field.scrollTop;
    layer.scrollLeft = field.scrollLeft;
  }
}
