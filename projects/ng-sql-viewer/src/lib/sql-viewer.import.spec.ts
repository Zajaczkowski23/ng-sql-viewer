import { vi } from 'vitest';

describe('SQL viewer module import', () => {
  it('leaves unrelated consumer code untouched by automatic highlighting', async () => {
    vi.useFakeTimers();
    const host = document.createElement('pre');
    host.innerHTML = '<code class="language-sql">select 1</code>';
    document.body.append(host);
    try {
      await import('../public-api');
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await vi.runOnlyPendingTimersAsync();
      expect(host.innerHTML).toBe('<code class="language-sql">select 1</code>');
      expect(host.hasAttribute('tabindex')).toBe(false);
    } finally {
      host.remove();
      vi.useRealTimers();
    }
  });
});
