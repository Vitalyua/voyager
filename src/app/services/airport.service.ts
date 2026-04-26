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
    public readonly iatas = computed(() => {
        const map = new Map<string, AirportRecord>();
        for (const a of this._airports()) {
            if (a.iata) map.set(a.iata, a);
        }
        return map;
    })


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

    public getCity(iata: string){
        return this.iatas().get(iata)?.city ?? '';
    }
}
