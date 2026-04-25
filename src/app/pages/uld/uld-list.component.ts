import {ChangeDetectionStrategy, Component, computed, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {SEED_ULDS, ULDItem, CARGO} from '../../voyager-data';

type StatusFilter = 'All' | 'Red' | 'Yellow' | 'Green';
type CargoFilter = 'All' | 'Pharma' | 'Perish' | 'Live' | 'DG' | 'General';

@Component({
    selector: 'app-uld-list',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './uld-list.component.html',
    styleUrl: './uld-list.component.css',
})
export class UldListComponent {
    private readonly all: ULDItem[] = SEED_ULDS;

    public readonly status = signal<StatusFilter>('All');
    public readonly ctype = signal<CargoFilter>('All');

    public readonly statusFilters: StatusFilter[] = ['All', 'Red', 'Yellow', 'Green'];
    public readonly cargoFilters: CargoFilter[] = ['All', 'Pharma', 'Perish', 'Live', 'DG', 'General'];

    public readonly items = computed<ULDItem[]>(() => {
        const s = this.status();
        const c = this.ctype();
        return this.all
            .filter(u =>
                s === 'All' ||
                (s === 'Red' && u.status === 'crit') ||
                (s === 'Yellow' && u.status === 'warn') ||
                (s === 'Green' && u.status === 'ok'),
            )
            .filter(u => c === 'All' || u.cargo === c.toLowerCase())
            .sort((a, b) => {
                const rank: Record<string, number> = {crit: 0, warn: 1, ok: 2};
                return (rank[a.status] ?? 3) - (rank[b.status] ?? 3);
            });
    });

    public readonly redCount = this.all.filter(u => u.status === 'crit').length;
    public readonly yellowCount = this.all.filter(u => u.status === 'warn').length;

    public statusLabel(s: string): string {
        return s === 'crit' ? 'Red' : s === 'warn' ? 'Yellow' : s === 'ok' ? 'Green' : s;
    }

    public cargoLabel(key: string): string {
        return CARGO[key]?.label ?? key;
    }

    public corridor(range: readonly [number, number], current: number): {
        bandLeft: number;
        bandWidth: number;
        needleLeft: number;
        over: boolean;
    } {
        const min = -10;
        const max = 40;
        const span = max - min;
        const left = ((range[0] - min) / span) * 100;
        const right = ((range[1] - min) / span) * 100;
        const pos = ((current - min) / span) * 100;
        return {
            bandLeft: left,
            bandWidth: right - left,
            needleLeft: pos,
            over: current < range[0] || current > range[1],
        };
    }

    public sparkPoints(spark: readonly number[]): string {
        if (spark.length === 0) return '';
        const min = Math.min(...spark);
        const max = Math.max(...spark);
        const range = max - min || 1;
        const step = 100 / Math.max(1, spark.length - 1);
        return spark
            .map((v, i) => {
                const x = i * step;
                const y = 28 - ((v - min) / range) * 26;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
    }
}
