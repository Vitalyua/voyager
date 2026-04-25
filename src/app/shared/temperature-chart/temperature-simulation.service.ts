import {Injectable} from '@angular/core';
import {
    buildLegsFromRoute,
    buildRouteSkeleton,
    hasWeatherCoverage,
} from './temperature-route-builder';
import {
    ContainerSpec,
    RealRouteInput,
    RouteSimulation,
    RouteSummary,
    SimulationLeg,
    SimulationPoint,
    SimulationResult,
} from './temperature-chart.types';

@Injectable({providedIn: 'root'})
export class TemperatureSimulationService {
    /**
     * Full bundle for the chart: zones, timings, real-weather run (if data available),
     * and constant-ambient baseline. `real` is null when any required airport has no
     * weather — chart falls back to baseline-only rendering.
     */
    public buildRouteSimulation(input: RealRouteInput): RouteSimulation {
        const dt = input.timeStepHours ?? 0.25;
        const baselineAmbient = input.baselineAmbient ?? 20;

        if (hasWeatherCoverage(input)) {
            const {legs, zones, timings, totalHours} = buildLegsFromRoute(input);
            const real = this.runFromLegs(input.container, legs, totalHours, dt);
            const baseline = baselineAmbient === null
                ? null
                : this.runConstant(input.container, baselineAmbient, totalHours, dt);
            return {real, baseline, zones, timings};
        }

        const {zones, timings, totalHours} = buildRouteSkeleton(input);
        const baseline = baselineAmbient === null
            ? null
            : this.runConstant(input.container, baselineAmbient, totalHours, dt);
        return {real: null, baseline, zones, timings};
    }

    /**
     * Real-weather simulation only. Returns null when weather is missing for any
     * airport along the route. Cheap to call from list views.
     */
    public simulateRealRoute(input: RealRouteInput): SimulationResult | null {
        if (!hasWeatherCoverage(input)) return null;
        const {legs, totalHours} = buildLegsFromRoute(input);
        const dt = input.timeStepHours ?? 0.25;
        return this.runFromLegs(input.container, legs, totalHours, dt);
    }

    /**
     * Compact summary of a route — the four metrics shown under the chart and
     * intended for list/card consumers (e.g. ULD list). When weather is missing,
     * `realFinalInsideTemp / excursionAtHours / pcmDoneAtHours` are null but
     * `ambientFinalInsideTemp` and the timings are still computed.
     */
    public computeSummary(input: RealRouteInput): RouteSummary {
        const sim = this.buildRouteSimulation(input);
        const ambient = sim.baseline ?? this.runConstant(
            input.container,
            input.baselineAmbient ?? 20,
            sim.timings.totalDurationHours,
            input.timeStepHours ?? 0.25,
        );

        return {
            container: input.container,
            ...sim.timings,
            ambientFinalInsideTemp: ambient.finalInsideTemp,
            realFinalInsideTemp: sim.real?.finalInsideTemp ?? null,
            excursionAtHours: sim.real?.excursionAtHours ?? null,
            pcmDoneAtHours: sim.real?.pcmDoneAtHours ?? null,
            hasWeather: sim.real !== null,
        };
    }

    private runFromLegs(
        container: ContainerSpec,
        legs: SimulationLeg[],
        totalHours: number,
        dt: number,
    ): SimulationResult {
        const ambientFn = (t: number): number => {
            for (const leg of legs) {
                if (t >= leg.startHour && t < leg.endHour) return leg.ambientTemp;
            }
            return legs.length > 0 ? legs[legs.length - 1].ambientTemp : 20;
        };
        return this.runSimulation(container, ambientFn, totalHours, dt);
    }

    private runConstant(
        container: ContainerSpec,
        ambient: number,
        totalHours: number,
        dt: number,
    ): SimulationResult {
        return this.runSimulation(container, () => ambient, totalHours, dt);
    }

    private runSimulation(
        container: ContainerSpec,
        ambientFn: (t: number) => number,
        totalHours: number,
        dt: number,
    ): SimulationResult {
        const {budgetKelvinHours: budget, tauHours: tau, targetRange, initialInsideTemp} = container;
        const tMin = targetRange.min;
        const tMax = targetRange.max;

        let used = 0;
        let inside = initialInsideTemp;
        let pcmDoneAt: number | null = null;
        let excursionAt: number | null = null;
        const points: SimulationPoint[] = [];

        for (let t = 0; t <= totalHours + 1e-6; t += dt) {
            const ambient = ambientFn(t);

            if (used < budget) {
                const dQ = Math.max(0, ambient - inside) * dt;
                used += dQ;
                const p = Math.min(1, used / budget);
                inside = tMin + (tMax - tMin) * (0.7 * p + 0.3 * p * p);
                if (used >= budget && pcmDoneAt === null) pcmDoneAt = t;
            } else {
                inside = ambient - (ambient - inside) * Math.exp(-dt / tau);
            }

            if (excursionAt === null && inside > tMax) excursionAt = t;

            points.push({
                t: round(t, 3),
                insideTemp: round(inside, 2),
                ambientTemp: round(ambient, 2),
                usedKelvinHours: round(used, 1),
                pcmRatio: round(Math.min(1, used / budget), 3),
            });
        }

        return {
            points,
            pcmDoneAtHours: pcmDoneAt,
            excursionAtHours: excursionAt,
            finalInsideTemp: points[points.length - 1].insideTemp,
            totalKelvinHoursUsed: round(used, 1),
        };
    }
}

function round(v: number, digits: number): number {
    const f = Math.pow(10, digits);
    return Math.round(v * f) / f;
}
