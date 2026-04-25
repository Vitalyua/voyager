import {
    FlightSegment,
    HourlyTemperature,
    LocationWeather,
    RealRouteInput,
    RouteTimings,
    RouteZone,
    SimulationLeg,
} from './temperature-chart.types';

const DEFAULT_GROUND_BEFORE_HOURS = 0.5;
const DEFAULT_GROUND_AFTER_HOURS = 2.0;
const DEFAULT_CRUISE_TEMP = 15;
const DEFAULT_SOLAR_FACTOR = 0.5;

/**
 * True iff every airport referenced by flights has at least one weather measurement.
 * Used to decide whether to run the full real-weather simulation or fall back to baseline-only.
 */
export function hasWeatherCoverage(input: RealRouteInput): boolean {
    if (input.flights.length === 0) return false;
    const airports = new Set<string>();
    for (const f of input.flights) {
        airports.add(f.origin);
        airports.add(f.destination);
    }
    for (const iata of airports) {
        const entry = input.weather.find(w => w.iataCode === iata);
        if (!entry || entry.hourlyTemperatures.length === 0) return false;
    }
    return true;
}

/**
 * Pure timings calculation — works without any weather data.
 * Reusable on lists / cards where we only need flight + transfer hours.
 */
export function computeTimings(
    flights: FlightSegment[],
    groundBeforeHours = DEFAULT_GROUND_BEFORE_HOURS,
    groundAfterHours = DEFAULT_GROUND_AFTER_HOURS,
): RouteTimings {
    if (flights.length === 0) {
        return {totalFlightHours: 0, totalTransferHours: 0, totalDurationHours: 0};
    }
    const sorted = [...flights].sort((a, b) => a.departure.getTime() - b.departure.getTime());

    let totalFlightHours = 0;
    for (const f of sorted) {
        totalFlightHours += hoursBetween(f.departure, f.arrival);
    }

    let layoverHours = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
        layoverHours += hoursBetween(sorted[i].arrival, sorted[i + 1].departure);
    }

    const totalTransferHours = groundBeforeHours + layoverHours + groundAfterHours;
    const totalDurationHours = totalFlightHours + totalTransferHours;
    return {totalFlightHours, totalTransferHours, totalDurationHours};
}

/**
 * Always-works route shape: flight cruise zones + collapsed ground/layover zones.
 * Used when weather data is missing — gives the chart something to render against the baseline.
 */
export function buildRouteSkeleton(input: RealRouteInput): {
    zones: RouteZone[];
    timings: RouteTimings;
    startTime: Date;
    totalHours: number;
} {
    const flights = [...input.flights].sort(
        (a, b) => a.departure.getTime() - b.departure.getTime(),
    );
    if (flights.length === 0) {
        throw new Error('At least one flight is required.');
    }

    const groundBefore = input.groundTimeBeforeDepartureHours ?? DEFAULT_GROUND_BEFORE_HOURS;
    const groundAfter = input.groundTimeAfterArrivalHours ?? DEFAULT_GROUND_AFTER_HOURS;

    const startTime = new Date(flights[0].departure.getTime() - groundBefore * 3600_000);
    const zones: RouteZone[] = [];

    // pre-departure (collapsed)
    zones.push({
        type: 'ground-departure',
        startHour: 0,
        endHour: hoursBetween(startTime, flights[0].departure),
        zoneLabel: flights[0].origin,
        hourlyLabels: [],
    });

    for (let i = 0; i < flights.length; i++) {
        const flight = flights[i];
        zones.push({
            type: 'cruise',
            startHour: hoursBetween(startTime, flight.departure),
            endHour: hoursBetween(startTime, flight.arrival),
            zoneLabel: `${flight.origin} → ${flight.destination}`,
            hourlyLabels: [],
        });
        const next = flights[i + 1];
        if (next) {
            zones.push({
                type: 'layover',
                startHour: hoursBetween(startTime, flight.arrival),
                endHour: hoursBetween(startTime, next.departure),
                zoneLabel: `${flight.destination} layover`,
                hourlyLabels: [],
            });
        }
    }

    const lastFlight = flights[flights.length - 1];
    const arrivalEnd = new Date(lastFlight.arrival.getTime() + groundAfter * 3600_000);
    zones.push({
        type: 'ground-arrival',
        startHour: hoursBetween(startTime, lastFlight.arrival),
        endHour: hoursBetween(startTime, arrivalEnd),
        zoneLabel: lastFlight.destination,
        hourlyLabels: [],
    });

    const tail = input.tailHours ?? 0;
    const totalHours = hoursBetween(startTime, arrivalEnd) + tail;
    const timings = computeTimings(flights, groundBefore, groundAfter);

    return {zones, timings, startTime, totalHours};
}

/**
 * Build a sequence of constant-ambient legs from flights + hourly weather.
 *
 * Caller should guard with `hasWeatherCoverage(input)` first — this function
 * throws if any required airport lacks weather data.
 *
 * Assumes:
 *  - flights are pre-sorted by departure
 *  - between consecutive flights, the cargo sits on the open tarmac
 *    of the connecting airport for the full layover duration
 *  - 30 minutes before first departure on open air at origin
 *  - 2 hours after last arrival on open air at destination
 *  - within a ground/layover window, hourly weather is interpreted as
 *    a step function (last-known value until next measurement)
 */
export function buildLegsFromRoute(input: RealRouteInput): {
    legs: SimulationLeg[];
    zones: RouteZone[];
    timings: RouteTimings;
    totalHours: number;
    startTime: Date;
} {
    const flights = [...input.flights].sort(
        (a, b) => a.departure.getTime() - b.departure.getTime(),
    );
    if (flights.length === 0) {
        throw new Error('At least one flight is required.');
    }

    const groundBefore = input.groundTimeBeforeDepartureHours ?? DEFAULT_GROUND_BEFORE_HOURS;
    const groundAfter = input.groundTimeAfterArrivalHours ?? DEFAULT_GROUND_AFTER_HOURS;
    const cruiseDefault = input.defaultCruiseAmbientTemp ?? DEFAULT_CRUISE_TEMP;
    const solarFactor = input.solarFactor ?? DEFAULT_SOLAR_FACTOR;

    const startTime = new Date(flights[0].departure.getTime() - groundBefore * 3600_000);

    const legs: SimulationLeg[] = [];
    const zones: RouteZone[] = [];

    const firstOriginWeather = findWeather(input.weather, flights[0].origin);
    const preLegs = sliceGroundIntoHourlyLegs({
        airport: flights[0].origin,
        weather: firstOriginWeather,
        windowStart: startTime,
        windowEnd: flights[0].departure,
        legType: 'ground-departure',
        labelPrefix: `${flights[0].origin} pre-departure`,
        solarFactor,
        referenceStart: startTime,
    });
    legs.push(...preLegs);
    zones.push(buildZone('ground-departure', preLegs, flights[0].origin));

    for (let i = 0; i < flights.length; i++) {
        const flight = flights[i];

        const cruiseStart = hoursBetween(startTime, flight.departure);
        const cruiseEnd = hoursBetween(startTime, flight.arrival);
        const cruiseTemp = flight.cruiseAmbientTemp ?? cruiseDefault;
        legs.push({
            type: 'cruise',
            startHour: cruiseStart,
            endHour: cruiseEnd,
            ambientTemp: cruiseTemp,
            label: `${flight.origin} → ${flight.destination}`,
        });
        zones.push({
            type: 'cruise',
            startHour: cruiseStart,
            endHour: cruiseEnd,
            zoneLabel: `${flight.origin} → ${flight.destination}`,
            hourlyLabels: [],
        });

        const next = flights[i + 1];
        if (next) {
            const layoverWeather = findWeather(input.weather, flight.destination);
            const layoverLegs = sliceGroundIntoHourlyLegs({
                airport: flight.destination,
                weather: layoverWeather,
                windowStart: flight.arrival,
                windowEnd: next.departure,
                legType: 'layover',
                labelPrefix: `${flight.destination} layover`,
                solarFactor,
                referenceStart: startTime,
            });
            legs.push(...layoverLegs);
            zones.push(buildZone('layover', layoverLegs, flight.destination));
        }
    }

    const lastFlight = flights[flights.length - 1];
    const arrivalEnd = new Date(lastFlight.arrival.getTime() + groundAfter * 3600_000);
    const lastDestWeather = findWeather(input.weather, lastFlight.destination);
    const postLegs = sliceGroundIntoHourlyLegs({
        airport: lastFlight.destination,
        weather: lastDestWeather,
        windowStart: lastFlight.arrival,
        windowEnd: arrivalEnd,
        legType: 'ground-arrival',
        labelPrefix: `${lastFlight.destination} post-arrival`,
        solarFactor,
        referenceStart: startTime,
    });
    legs.push(...postLegs);
    zones.push(buildZone('ground-arrival', postLegs, lastFlight.destination));

    const tail = input.tailHours ?? 0;
    const totalHours = (postLegs.length > 0
        ? postLegs[postLegs.length - 1].endHour
        : hoursBetween(startTime, arrivalEnd)) + tail;

    const timings = computeTimings(flights, groundBefore, groundAfter);

    return {legs, zones, timings, totalHours, startTime};
}

function hoursBetween(a: Date, b: Date): number {
    return (b.getTime() - a.getTime()) / 3600_000;
}

function findWeather(weather: LocationWeather[], iata: string): LocationWeather {
    const found = weather.find(w => w.iataCode === iata);
    if (!found) {
        throw new Error(`No weather data provided for airport: ${iata}`);
    }
    return found;
}

interface SliceParams {
    airport: string;
    weather: LocationWeather;
    windowStart: Date;
    windowEnd: Date;
    legType: 'ground-departure' | 'layover' | 'ground-arrival';
    labelPrefix: string;
    solarFactor: number;
    referenceStart: Date;
}

function sliceGroundIntoHourlyLegs(params: SliceParams): SimulationLeg[] {
    const {weather, windowStart, windowEnd, legType, labelPrefix, solarFactor, referenceStart, airport} = params;
    const applySolar = weather.applySolar !== false;
    const sorted = [...weather.hourlyTemperatures].sort(
        (a, b) => a.time.getTime() - b.time.getTime(),
    );
    if (sorted.length === 0) {
        throw new Error(`Empty hourlyTemperatures for ${airport}`);
    }

    const breakpoints: Date[] = [windowStart];
    for (const m of sorted) {
        if (m.time.getTime() > windowStart.getTime() && m.time.getTime() < windowEnd.getTime()) {
            breakpoints.push(m.time);
        }
    }
    breakpoints.push(windowEnd);

    const legs: SimulationLeg[] = [];
    for (let i = 0; i < breakpoints.length - 1; i++) {
        const segStart = breakpoints[i];
        const segEnd = breakpoints[i + 1];
        if (segEnd.getTime() <= segStart.getTime()) continue;

        const rawTemp = lookupTemp(sorted, segStart);
        const effectiveTemp = applySolar ? rawTemp * (1 + solarFactor) : rawTemp;

        legs.push({
            type: legType,
            startHour: hoursBetween(referenceStart, segStart),
            endHour: hoursBetween(referenceStart, segEnd),
            ambientTemp: effectiveTemp,
            airport,
            label: `${labelPrefix} ${formatHHMM(segStart)}`,
            rawTemp,
            showHourlyLabel: true,
        });
    }
    return legs;
}

function lookupTemp(sorted: HourlyTemperature[], queryTime: Date): number {
    let chosen = sorted[0];
    for (const m of sorted) {
        if (m.time.getTime() <= queryTime.getTime()) chosen = m;
        else break;
    }
    return chosen.temp;
}

function buildZone(
    type: 'ground-departure' | 'layover' | 'ground-arrival',
    legs: SimulationLeg[],
    airport: string,
): RouteZone {
    if (legs.length === 0) {
        return {type, startHour: 0, endHour: 0, zoneLabel: airport, hourlyLabels: []};
    }
    const startHour = legs[0].startHour;
    const endHour = legs[legs.length - 1].endHour;

    const labels: RouteZone['hourlyLabels'] = legs.map(leg => ({
        hourOffset: (leg.startHour + leg.endHour) / 2,
        temp: leg.ambientTemp,
        rawTemp: leg.rawTemp ?? leg.ambientTemp,
    }));

    let zoneLabel: string;
    switch (type) {
        case 'ground-departure':
            zoneLabel = `${airport}`;
            break;
        case 'ground-arrival':
            zoneLabel = `${airport}`;
            break;
        case 'layover':
            zoneLabel = `${airport} layover`;
            break;
    }

    return {type, startHour, endHour, zoneLabel, hourlyLabels: labels};
}

function formatHHMM(d: Date): string {
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}
