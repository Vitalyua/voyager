import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {AWB_DETAIL, IATA, CARGO} from '../../../voyager-data';

type TimelineTab = 'expected' | 'legs';

interface QrCell {
    x: number;
    y: number;
}

@Component({
    selector: 'app-awb-detail',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './shipments-details.component.html',
    styleUrl: './shipments-details.component.css',
})
export class ShipmentsDetailsComponent {
    public readonly d = AWB_DETAIL;
    public readonly cargoLabel = CARGO[this.d.cargo]?.label ?? this.d.cargo;
    public readonly routeCities = this.d.route.map(c => IATA[c] ?? c).join(' → ');
    public readonly lateCount = this.d.timeline.filter(t => t.status === 'warn' || t.status === 'crit').length;
    public readonly selectedParties = this.d.parties.filter(p => p.sel).length;

    public readonly timelineTab = signal<TimelineTab>('expected');
    public readonly showQr = signal(false);

    public readonly qrCells: QrCell[] = this.buildQrCells();

    public initials(name: string): string {
        return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    }


    private buildQrCells(): QrCell[] {
        const N = 25;
        const cells: QrCell[] = [];
        let seed = 1234;
        const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                const cornerTL = x < 7 && y < 7;
                const cornerTR = x >= N - 7 && y < 7;
                const cornerBL = x < 7 && y >= N - 7;
                let on = false;

                if (cornerTL || cornerTR || cornerBL) {
                    const bx = cornerTR ? x - (N - 7) : x;
                    const by = cornerBL ? y - (N - 7) : y;
                    const border = bx === 0 || bx === 6 || by === 0 || by === 6;
                    const inner = bx >= 2 && bx < 5 && by >= 2 && by < 5;
                    on = border || inner;
                } else {
                    on = rnd() > 0.52;
                }

                if (on) cells.push({x, y});
            }
        }
        return cells;
    }
}
