import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { AdminDashboardStore } from '@app/state/admin-dashboard.store';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';
import { EmptyState } from '@shared/ui/layout/empty-state/empty-state';
import { KpiCard } from '../../components/kpi-card/kpi-card';
import { RecentOrders } from '../../components/recent-orders/recent-orders';
import { StatusBreakdown } from '../../components/status-breakdown/status-breakdown';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [RouterLink, TuiButton, EmptyState, KpiCard, StatusBreakdown, RecentOrders],
  providers: [CurrencyFormatPipe],
  templateUrl: './admin-dashboard-page.html',
  styleUrl: './admin-dashboard-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPage {
  private readonly route = inject(ActivatedRoute);
  private readonly currency = inject(CurrencyFormatPipe);
  protected readonly store = inject(AdminDashboardStore);

  protected readonly loaded = computed(() => !this.store.loading() && !this.store.error());
  protected readonly revenueLabel = computed(() =>
    this.currency.transform(this.store.kpis().revenue),
  );
  protected readonly averageLabel = computed(() =>
    this.currency.transform(this.store.kpis().averageBasket),
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    const storeId = this.route.snapshot.paramMap.get('storeId') ?? 'demo';
    this.store.load(storeId);
  }
}
