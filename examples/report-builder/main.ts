import { Component, computed, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SqlViewerComponent } from 'ng-sql-viewer';

@Component({
  selector: 'app-sales-report',
  imports: [SqlViewerComponent],
  template: `
    <main>
      <h1>Monthly sales query</h1>
      <p>Pick a report year to preview the generated PostgreSQL query.</p>
      <div class="controls">
        <label>
          Report year
          <select #reportYear [value]="year()" (change)="year.set(+reportYear.value)">
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </label>
        <label><input type="checkbox" (change)="editable.set(!editable())" /> Enable editing</label>
      </div>
      <ng-sql-viewer
        [sql]="query()"
        [editable]="editable()"
        [wrap]="true"
        dialect="postgresql"
        ariaLabel="Monthly sales SQL"
        height="240px"
      />
    </main>
  `,
})
class SalesReport {
  readonly year = signal(2026);
  readonly editable = signal(false);

  readonly query = computed(() => {
    const year = this.year();
    return `select date_trunc('month', paid_at) as month, sum(total) as sales
from orders where paid_at >= date '${year}-01-01'
and paid_at < date '${year + 1}-01-01' group by 1 order by 1;`;
  });
}

bootstrapApplication(SalesReport).catch(console.error);
