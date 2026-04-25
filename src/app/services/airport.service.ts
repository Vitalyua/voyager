import {Injectable, signal, computed} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AirportCdn, AirportRecord} from '../models/airport.model';

const CDN_URL = 'https://cdn.awery.com/assets/erp/lists/airports.json';

@Injectable({providedIn: 'root'})
export class AirportService {
    private readonly _airports = signal<AirportRecord[]>([]);
    private loaded = false;

    public readonly airports = this._airports.asReadonly();

    public readonly byIata = computed(() => {
        const map = new Map<string, AirportRecord>();
        for (const a of this._airports()) {
            if (a.iata) map.set(a.iata, a);
        }
        return map;
    });

    public readonly dropdownOptions = computed(() =>
        this._airports()
            .filter(a => a.iata)
            .map(a => ({
                value: a.iata,
                label: `${a.iata} — ${a.name}, ${a.city}`,
                icon: a.countryCode ? `awr-flag awr-flag-${a.countryCode}` : '',
                active: false,
                disabled: false,
            }))
    );

    constructor(private readonly http: HttpClient) {
    }

    public load(): void {
        if (this.loaded) return;
        this.loaded = true;

        this.http.get<AirportCdn[]>(CDN_URL).subscribe(raw => {
            const records: AirportRecord[] = raw
                .filter(r => r.iata && r.iata.length === 3)
                .map(r => ({
                    iata: r.iata,
                    icao: r.icao ?? '',
                    name: r.airport_name,
                    city: r.city,
                    country: r.country_name,
                    countryCode: r.country_code,
                    lat: r.latitude,
                    lng: r.longitude,
                    timezone: r.timezone ?? '',
                    gmt: r.gmt ?? '',
                }));
            this._airports.set(records);
        });
    }

    public get(iata: string): AirportRecord | undefined {
        return this.byIata().get(iata);
    }

    public label(iata: string): string {
        const a = this.get(iata);
        return a ? `${a.iata} — ${a.name}` : iata;
    }

    public distance(from: string, to: string): number | null {
        const a = this.get(from);
        const b = this.get(to);
        if (!a || !b) return null;
        const R = 6371;
        const dLat = (b.lat - a.lat) * Math.PI / 180;
        const dLng = (b.lng - a.lng) * Math.PI / 180;
        const sinLat = Math.sin(dLat / 2);
        const sinLng = Math.sin(dLng / 2);
        const h = sinLat * sinLat +
            Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLng * sinLng;
        return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }
}
