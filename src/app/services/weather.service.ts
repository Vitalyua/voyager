import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, map, of} from 'rxjs';
import {HourlyTemperature} from '../shared/temperature-chart/temperature-chart.types';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export interface WeatherRequest {
    iata: string;
    lat: number;
    lng: number;
    start: Date;
    end: Date;
}

interface OpenMeteoForecast {
    hourly: {
        time: string[];
        temperature_2m: number[];
    };
}

@Injectable({providedIn: 'root'})
export class WeatherService {
    private readonly http = inject(HttpClient);
    private readonly cache = new Map<string, HourlyTemperature[]>();

    public getHourlyForecast(
        requests: WeatherRequest[],
    ): Observable<Map<string, HourlyTemperature[]>> {
        if (requests.length === 0) {
            return of(new Map());
        }

        const result = new Map<string, HourlyTemperature[]>();
        const toFetch: WeatherRequest[] = [];
        for (const r of requests) {
            const hit = this.cache.get(cacheKey(r));
            if (hit) result.set(r.iata, hit);
            else toFetch.push(r);
        }

        if (toFetch.length === 0) {
            return of(result);
        }

        const minStart = toFetch.reduce((m, r) => r.start < m ? r.start : m, toFetch[0].start);
        const maxEnd = toFetch.reduce((m, r) => r.end > m ? r.end : m, toFetch[0].end);

        const params = new HttpParams()
            .set('latitude', toFetch.map(r => r.lat).join(','))
            .set('longitude', toFetch.map(r => r.lng).join(','))
            .set('hourly', 'temperature_2m')
            .set('start_hour', formatOpenMeteoHour(minStart))
            .set('end_hour', formatOpenMeteoHour(maxEnd))
            .set('timezone', 'UTC');

        return this.http.get<OpenMeteoForecast | OpenMeteoForecast[]>(FORECAST_URL, {params}).pipe(
            map(resp => {
                const list = Array.isArray(resp) ? resp : [resp];
                list.forEach((item, i) => {
                    const r = toFetch[i];
                    if (!item?.hourly?.time || !item?.hourly?.temperature_2m) return;
                    const all: HourlyTemperature[] = item.hourly.time.map((t, idx) => ({
                        time: new Date(t + 'Z'),
                        temp: item.hourly.temperature_2m[idx],
                    }));
                    const trimmed = all.filter(p =>
                        p.time.getTime() >= r.start.getTime() &&
                        p.time.getTime() <= r.end.getTime(),
                    );
                    result.set(r.iata, trimmed);
                    this.cache.set(cacheKey(r), trimmed);
                });
                return result;
            }),
        );
    }
}

function cacheKey(r: WeatherRequest): string {
    return `${r.iata}|${r.start.toISOString()}|${r.end.toISOString()}`;
}

function formatOpenMeteoHour(d: Date): string {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
