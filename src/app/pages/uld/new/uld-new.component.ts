import {ChangeDetectionStrategy, Component, OnInit, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {AwrDropdownComponent, AwrDatepickerComponent} from '@awerysoftware/awr';
import {CARGO, IATA} from '../../../voyager-data';
import {AirportService} from '../../../services/airport.service';

interface UldType {
    code: string;
    desc: string;
    cap: string;
    ins: string;
}

interface Leg {
    o: string;
    d: string;
    dep: Date | null;
    arr: Date | null;
}

interface AwrDropdownOption {
    value: string;
    label: string;
    icon?: string;
}

@Component({
    selector: 'app-uld-new',
    standalone: true,
    imports: [RouterLink, FormsModule, AwrDropdownComponent, AwrDatepickerComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './uld-new.component.html',
    styleUrl: './uld-new.component.css',
})
export class UldNewComponent implements OnInit {
    public readonly airports = inject(AirportService);

    public readonly uldTypes: readonly UldType[] = [
        {code: 'AKE', desc: 'Small container', cap: '4.3 m³', ins: '0.60'},
        {code: 'RKN', desc: 'Cool container', cap: '4.3 m³', ins: '0.85'},
        {code: 'RAP', desc: 'Cool pallet', cap: '10.8 m³', ins: '0.80'},
        {code: 'PMC', desc: 'Pallet', cap: '11.6 m³', ins: '0.50'},
        {code: 'AAY', desc: 'Large container', cap: '17.5 m³', ins: '0.70'},
    ];

    public readonly cargoEntries = Object.entries(CARGO).map(([key, v]) => ({key, ...v}));

    public readonly uld = signal<string>('RKN');
    public readonly cargo = signal<string>('pharma');

    public readonly legs = signal<Leg[]>([
        {o: 'HKG', d: 'FRA', dep: new Date('2026-04-25T15:50:00Z'), arr: new Date('2026-04-25T23:05:00Z')},
        {o: 'FRA', d: 'JFK', dep: new Date('2026-04-26T01:30:00Z'), arr: new Date('2026-04-26T05:45:00Z')},
    ]);

    public readonly range = computed<readonly [number, number]>(
        () => CARGO[this.cargo()]?.range ?? [0, 0],
    );
    public readonly insulation = computed(
        () => this.uldTypes.find(t => t.code === this.uld())?.ins ?? '—',
    );

    public readonly previewStops = [
        {code: 'HKG', icon: 'sun', tone: 'warn', temp: '32°C'},
        {code: 'FRA', icon: 'cloud', tone: 'mut', temp: '8°C'},
        {code: 'JFK', icon: 'sun', tone: 'warn', temp: '18°C'},
    ];
    public readonly previewSegments = [
        {flight: '12h 15m · LH796', ground: 'ground 2h 25m'},
        {flight: '8h 15m · LH400', ground: ''},
    ];

    public ngOnInit(): void {
        this.airports.load();
    }

    public city(code: string): string {
        return IATA[code] ?? code;
    }

    public addLeg(): void {
        this.legs.update(arr => [...arr, {o: '', d: '', dep: null, arr: null}]);
    }

    public removeLeg(i: number): void {
        this.legs.update(arr => arr.filter((_, idx) => idx !== i));
    }

    public setLegAirport(i: number, side: 'o' | 'd', opt: AwrDropdownOption | null | undefined): void {
        const iata = opt?.value ?? '';
        this.legs.update(arr => arr.map((l, idx) => (idx === i ? {...l, [side]: iata} : l)));
    }

    public setLegDate(i: number, side: 'dep' | 'arr', date: Date | null): void {
        this.legs.update(arr => arr.map((l, idx) => (idx === i ? {...l, [side]: date} : l)));
    }
}
