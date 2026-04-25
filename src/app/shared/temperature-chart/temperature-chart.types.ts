// ============================================================
// Container model
// ============================================================

export interface ContainerSpec {
    name: string;
    budgetKelvinHours: number;
    tauHours: number;
    initialInsideTemp: number;
    targetRange: { min: number; max: number };
}

// ============================================================
// High-level real route input
// ============================================================

export interface FlightSegment {
    flightNumber?: string;
    /** IATA code of departure airport, e.g. "FRA" */
    origin: string;
    /** IATA code of arrival airport, e.g. "DXB" */
    destination: string;
    /** Scheduled departure (timezone-aware Date). */
    departure: Date;
    /** Scheduled arrival (timezone-aware Date). */
    arrival: Date;
    /** Override default cruise ambient (+15°C) for this specific flight. */
    cruiseAmbientTemp?: number;
}

export interface HourlyTemperature {
    /** Timestamp of this measurement. Hourly grid expected. */
    time: Date;
    /** Air temperature in °C (raw, before solar correction). */
    temp: number;
}

export interface LocationWeather {
    /** IATA code matching FlightSegment.origin / destination. */
    iataCode: string;
    /** Hourly temperatures for the period covering this airport's
     *  ground/layover windows. Sorted by time recommended but not required. */
    hourlyTemperatures: HourlyTemperature[];
    /** If false, skip solar correction at this airport. Default: true. */
    applySolar?: boolean;
}

export interface RealRouteInput {
    container: ContainerSpec;
    flights: FlightSegment[];
    /** Weather per airport. Must cover all ground/layover windows. */
    weather: LocationWeather[];

    /** Ground time on open air before departure of first flight (hours). Default: 0.5 */
    groundTimeBeforeDepartureHours?: number;
    /** Ground time on open air after arrival of last flight (hours). Default: 0.5 */
    groundTimeAfterArrivalHours?: number;

    /** Default cruise ambient if not specified per flight. Default: 15 */
    defaultCruiseAmbientTemp?: number;

    /** Multiplicative solar factor. T_eff = T_air * (1 + SOLAR_FACTOR). Default: 0.5 */
    solarFactor?: number;

    /** Optional simulation tail beyond delivery (hours). Default: 0 */
    tailHours?: number;

    /** Baseline constant ambient for comparison. Default: 20. Set null to disable. */
    baselineAmbient?: number | null;

    /** Integration step (hours). Default: 0.25 */
    timeStepHours?: number;
}

// ============================================================
// Internal representation after route building
// ============================================================

export type LegType =
    | 'ground-departure'
    | 'cruise'
    | 'layover'
    | 'ground-arrival';

export interface SimulationLeg {
    type: LegType;
    startHour: number;
    endHour: number;
    ambientTemp: number;
    airport?: string;
    label: string;
    rawTemp?: number;
    showHourlyLabel?: boolean;
}

export interface RouteZone {
    type: LegType;
    startHour: number;
    endHour: number;
    zoneLabel: string;
    hourlyLabels: { hourOffset: number; temp: number; rawTemp: number }[];
}

// ============================================================
// Simulation result types
// ============================================================

export interface SimulationPoint {
    t: number;
    insideTemp: number;
    ambientTemp: number;
    usedKelvinHours: number;
    pcmRatio: number;
}

export interface SimulationResult {
    points: SimulationPoint[];
    pcmDoneAtHours: number | null;
    excursionAtHours: number | null;
    finalInsideTemp: number;
    totalKelvinHoursUsed: number;
}

export interface RouteTimings {
    /** Sum of cruise leg durations (hours). */
    totalFlightHours: number;
    /** Sum of ground-departure + layover + ground-arrival durations (hours). */
    totalTransferHours: number;
    /** Whole route from t=0 to last leg end (hours). */
    totalDurationHours: number;
}

export interface RouteSimulation {
    /** Real-weather run. null if any required airport has no weather data. */
    real: SimulationResult | null;
    /** Constant-ambient comparison run. null only when input.baselineAmbient === null. */
    baseline: SimulationResult | null;
    zones: RouteZone[];
    timings: RouteTimings;
}

export interface RouteSummary extends RouteTimings {
    container: ContainerSpec;
    /** Always available — uses input.baselineAmbient (default 20°C). */
    ambientFinalInsideTemp: number;
    /** null when no weather coverage. */
    realFinalInsideTemp: number | null;
    /** null when no weather coverage OR no excursion. */
    excursionAtHours: number | null;
    /** null when no weather coverage OR PCM budget not exhausted. */
    pcmDoneAtHours: number | null;
    hasWeather: boolean;
}
