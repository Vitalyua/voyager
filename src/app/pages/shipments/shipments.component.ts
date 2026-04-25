import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    OnInit,
    computed,
    inject,
    signal,
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Router} from '@angular/router';
import {SEED_SHIPMENTS, CARGO, ShipmentRow} from '../../voyager-data';
import {ShipmentService} from '../../services/shipment.service';

type StatusFilter = 'all' | 'booked' | 'in_transit' | 'delivered' | 'distressed';

@Component({
    selector: 'app-shipments',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './shipments.component.html',
    styleUrl: './shipments.component.css',
})
export class ShipmentsComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly api = inject(ShipmentService);
    private readonly destroyRef = inject(DestroyRef);

    private readonly allRows = signal<ShipmentRow[]>(SEED_SHIPMENTS);

    public readonly search = signal('');
    public readonly activeFilter = signal<StatusFilter>('all');

    public readonly filters: { key: StatusFilter; label: string }[] = [
        {key: 'all', label: 'All'},
        {key: 'booked', label: 'Booked'},
        {key: 'in_transit', label: 'In Transit'},
        {key: 'delivered', label: 'Delivered'},
        {key: 'distressed', label: 'Distressed'},
    ];

    public readonly filteredRows = computed(() => {
        const f = this.activeFilter();
        const q = this.search().toLowerCase().trim();

        let rows = this.allRows();
        if (f !== 'all') {
            rows = rows.filter(r => r.status === f);
        }
        if (q) {
            rows = rows.filter(
                r =>
                    r.awb.toLowerCase().includes(q) ||
                    r.route.join(' ').toLowerCase().includes(q) ||
                    this.cargoLabel(r.cargo).toLowerCase().includes(q),
            );
        }
        return rows;
    });

    public ngOnInit(): void {
        this.api.list()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(rows => this.allRows.set(rows));
    }

    public filterCount(key: StatusFilter): number {
        const rows = this.allRows();
        if (key === 'all') return rows.length;
        return rows.filter(r => r.status === key).length;
    }

    public cargoLabel(key: string): string {
        return CARGO[key]?.label ?? key;
    }

    public statusLabel(s: string): string {
        return s.replace('_', ' ');
    }

    public openDetail(awb: string): void {
        void this.router.navigate(['/shipments', awb]);
    }

    public asInput(e: Event): HTMLInputElement {
        return e.target as HTMLInputElement;
    }
}
