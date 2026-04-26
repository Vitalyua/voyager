import {ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Router} from '@angular/router';
import {DatePipe} from '@angular/common';
import {forkJoin} from 'rxjs';
import {ShipmentService} from '../../services/shipment.service';
import {AwbWithUld, FailureReasonSummary, LateAwb, StatisticsSummary} from '../../voyager-data';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [DatePipe],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
    private readonly api = inject(ShipmentService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    public readonly stats = signal<StatisticsSummary | null>(null);
    public readonly lateAwbs = signal<LateAwb[]>([]);
    public readonly failureReasons = signal<FailureReasonSummary[]>([]);
    public readonly awbsWithUld = signal<AwbWithUld[]>([]);
    public readonly loading = signal(true);

    public readonly onTimePct = computed(() => {
        const s = this.stats();
        if (!s || !s.total_awb) return '—';
        return ((s.on_time_awb / s.total_awb) * 100).toFixed(1) + '%';
    });

    public ngOnInit(): void {
        forkJoin({
            stats: this.api.getStatistics(),
            late: this.api.getLateAwb(),
            reasons: this.api.getFailureReasonsFeed(),
            ulds: this.api.getAwbWithUld(),
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: ({stats, late, reasons, ulds}) => {
                    this.stats.set(stats);
                    this.lateAwbs.set(late);
                    this.failureReasons.set(reasons);
                    this.awbsWithUld.set(ulds);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false),
            });
    }

    public openAwb(prefix: string, number: string): void {
        void this.router.navigate(['/shipments', prefix + '-' + number]);
    }

    public timeAgo(iso: string | null): string {
        if (!iso) return '—';
        const t = new Date(iso.replace(' ', 'T') + 'Z').getTime();
        if (Number.isNaN(t)) return '—';
        const diff = Math.max(0, Math.floor((Date.now() - t) / 1000));
        if (diff < 60) return diff + 's';
        if (diff < 3600) return Math.floor(diff / 60) + 'm';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h';
        return Math.floor(diff / 86400) + 'd';
    }
}
