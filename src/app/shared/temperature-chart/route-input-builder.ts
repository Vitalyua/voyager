import {Legs} from '../../voyager-data';
import {
    ContainerSpec,
    FlightSegment,
    HourlyTemperature,
    LocationWeather,
    RealRouteInput,
} from './temperature-chart.types';

const HOUR_MS = 3600_000;

const ORIGIN_BUFFER_BEFORE_HOURS = 1;
const ORIGIN_BUFFER_AFTER_HOURS = 1;
const TRANSIT_BUFFER_HOURS = 1;
const DESTINATION_BUFFER_BEFORE_HOURS = 1;
const DESTINATION_BUFFER_AFTER_HOURS = 3;

const GROUND_AFTER_ARRIVAL_HOURS = 2;

export interface AirportWindow {
    start: Date;
    end: Date;
}

/**
 * For each airport in the route, derive the time window we need weather data for.
 * Origin: dep-1h..dep+1h. Destination: arr-1h..arr+3h. Transit: arr-1h..nextDep+1h.
 * If an airport plays multiple roles (e.g., return flight), windows are merged.
 */
export function deriveWeatherWindows(legs: Legs[]): Map<string, AirportWindow> {
    const out = new Map<string, AirportWindow>();
    if (legs.length === 0) return out;

    const merge = (iata: string, start: Date, end: Date): void => {
        const cur = out.get(iata);
        if (!cur) {
            out.set(iata, {start, end});
        } else {
            out.set(iata, {
                start: cur.start.getTime() < start.getTime() ? cur.start : start,
                end: cur.end.getTime() > end.getTime() ? cur.end : end,
            });
        }
    };

    for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        const dep = new Date(leg.departure);
        const arr = new Date(leg.arrival);
        const isFirst = i === 0;
        const isLast = i === legs.length - 1;

        if (isFirst) {
            merge(
                leg.from,
                addHours(dep, -ORIGIN_BUFFER_BEFORE_HOURS),
                addHours(dep, +ORIGIN_BUFFER_AFTER_HOURS),
            );
        }

        if (isLast) {
            merge(
                leg.to,
                addHours(arr, -DESTINATION_BUFFER_BEFORE_HOURS),
                addHours(arr, +DESTINATION_BUFFER_AFTER_HOURS),
            );
        } else {
            const next = legs[i + 1];
            const nextDep = new Date(next.departure);
            merge(
                leg.to,
                addHours(arr, -TRANSIT_BUFFER_HOURS),
                addHours(nextDep, +TRANSIT_BUFFER_HOURS),
            );
        }
    }

    return out;
}

export interface BuildRealRouteOptions {
    legs: Legs[];
    weather: Map<string, HourlyTemperature[]>;
    container: ContainerSpec;
}

/**
 * Build a RealRouteInput for <app-temperature-chart> from real shipment legs +
 * fetched Open-Meteo hourly temperatures. Solar correction is enabled for every
 * airport (the route builder applies the multiplier exactly once internally).
 */
export function buildRealRouteInput(opts: BuildRealRouteOptions): RealRouteInput {
    const flights: FlightSegment[] = opts.legs.map(leg => ({
        flightNumber: leg.flight,
        origin: leg.from,
        destination: leg.to,
        departure: new Date(leg.departure),
        arrival: new Date(leg.arrival),
    }));

    const airports = new Set<string>();
    for (const leg of opts.legs) {
        airports.add(leg.from);
        airports.add(leg.to);
    }

    const weather: LocationWeather[] = [...airports].map(iata => ({
        iataCode: iata,
        hourlyTemperatures: opts.weather.get(iata) ?? [],
        applySolar: true,
    }));

    return {
        container: opts.container,
        flights,
        weather,
        baselineAmbient: 20,
        groundTimeAfterArrivalHours: GROUND_AFTER_ARRIVAL_HOURS,
        tailHours: 0,
    };
}

function addHours(d: Date, h: number): Date {
    return new Date(d.getTime() + h * HOUR_MS);
}
