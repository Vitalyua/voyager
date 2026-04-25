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
import {ShipmentRow} from '../../voyager-data';
import {ShipmentService} from '../../services/shipment.service';
import {DatePipe} from "@angular/common";
import {StatusCodePipe, StatusLabelPipe} from '../../pipes/status.pipe';
import {CargoLabelPipe} from '../../pipes/cargo.pipe';

@Component({
    selector: 'app-shipments',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './shipments.component.html',
    styleUrl: './shipments.component.css',
    imports: [
        DatePipe,
        StatusCodePipe,
        StatusLabelPipe,
        CargoLabelPipe,
    ]
})
export class ShipmentsComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly api = inject(ShipmentService);
    private readonly destroyRef = inject(DestroyRef);

    public readonly allRows = signal<ShipmentRow[]>([]);

    public readonly search = signal('');
    public readonly activeFilter = signal<string>('all');
    public readonly loading = signal(false);

    public readonly filteredRows = computed(() => {
        const f = this.activeFilter();
        const q = this.search().toLowerCase().trim();

        let rows = this.allRows();
        if (f !== 'all') {
            rows = rows.filter(r => r.last_event.eventCode.code === f);
        }
        if (q) {
            rows = rows.filter(
                r =>
                    (r.waybill_prefix + '-' + r.waybill_number).toLowerCase().includes(q) ||
                    r.flight.legs.map(leg => leg.from).join(' ').toLowerCase().includes(q)/* ||
                    this.cargoLabel(r.cargo).toLowerCase().includes(q)*/,
            );
        }
        return rows;
    });

    public readonly existsStatuses = computed(() => {
        return [
            'all',
            ...this.allRows()
                .map(r => r.last_event.eventCode.code)
                .filter((value, index, self) =>
                    self.indexOf(value) === index)
        ];
    })

    public ngOnInit(): void {
        this.loading.set(true);
        this.api.list()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: rows => this.allRows.set(rows.items),
                complete: () => this.loading.set(false),
                error: () => this.loading.set(false),
            });
    }

    public filterCount(key: string): number {
        const rows = this.allRows();
        if (key === 'all') return rows.length;
        return rows.filter(r => r.last_event.eventCode.code === key).length;
    }

    public openDetail(awb: ShipmentRow): void {
        void this.router.navigate(['/shipments', awb.waybill_prefix + '-' + awb.waybill_number]);
    }

    public asInput(e: Event): HTMLInputElement {
        return e.target as HTMLInputElement;
    }
}
