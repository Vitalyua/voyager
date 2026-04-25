import {DecimalPipe} from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    OnDestroy,
    ViewChild,
    computed,
    effect,
    inject,
    input,
} from '@angular/core';
import {Chart, ChartConfiguration, registerables} from 'chart.js';
import annotationPlugin, {AnnotationOptions} from 'chartjs-plugin-annotation';
import {TemperatureSimulationService} from './temperature-simulation.service';
import {
    RealRouteInput,
    RouteSimulation,
    RouteZone,
} from './temperature-chart.types';

Chart.register(...registerables, annotationPlugin);

const ZONE_COLORS: Record<RouteZone['type'], { bg: string; border: string; text: string }> = {
    'ground-departure': {bg: 'rgba(211, 209, 199, 0.35)', border: '#888780', text: '#5F5E5A'},
    'cruise':           {bg: 'rgba(181, 212, 244, 0.30)', border: '#378ADD', text: '#185FA5'},
    'layover':          {bg: 'rgba(250, 199, 117, 0.35)', border: '#BA7517', text: '#854F0B'},
    'ground-arrival':   {bg: 'rgba(211, 209, 199, 0.35)', border: '#888780', text: '#5F5E5A'},
};

@Component({
    selector: 'app-temperature-chart',
    standalone: true,
    imports: [DecimalPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="chart-wrapper" [style.height.px]="height()">
            <canvas #canvas role="img" [attr.aria-label]="ariaLabel()"></canvas>
        </div>
        @if (showSummary()) {
            <div class="summary">
                <div class="stat">
                    <span class="stat-label">Ambient condition (+{{ baselineAmbient() }}°C)</span>
                    <span class="stat-value">{{ ambientFinalInside() | number:'1.1-1' }}°C</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Real condition</span>
                    @if (realFinalInside() !== null) {
                        <span class="stat-value">{{ realFinalInside() | number:'1.1-1' }}°C</span>
                    } @else {
                        <span class="stat-value muted">— no weather</span>
                    }
                </div>
                <div class="stat">
                    <span class="stat-label">Total flight time</span>
                    <span class="stat-value mono">{{ flightTimeLabel() }}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Total transfer time</span>
                    <span class="stat-value mono">{{ transferTimeLabel() }}</span>
                </div>
            </div>
            @if (excursionAt() !== null || pcmDoneAt() !== null) {
                <div class="warn-row">
                    @if (excursionAt() !== null) {
                        <span class="warn">Excursion at t = {{ excursionAt() | number:'1.1-1' }}h</span>
                    }
                    @if (pcmDoneAt() !== null) {
                        <span class="warn">PCM exhausted at t = {{ pcmDoneAt() | number:'1.1-1' }}h</span>
                    }
                </div>
            }
        }
    `,
    styleUrl: './temperature-chart.component.css',
})
export class TemperatureChartComponent implements AfterViewInit, OnDestroy {
    @ViewChild('canvas', {static: true}) public canvasRef!: ElementRef<HTMLCanvasElement>;

    public data = input.required<RealRouteInput>();
    public height = input<number>(420);
    public showSummary = input<boolean>(true);
    public showHourlyLabels = input<boolean>(true);
    public darkMode = input<boolean | null>(null);

    private readonly sim = inject(TemperatureSimulationService);
    private chart: Chart | null = null;

    public result = computed<RouteSimulation>(() => this.sim.buildRouteSimulation(this.data()));
    public ariaLabel = computed(() =>
        `Temperature chart for ${this.data().container.name}, ${this.data().flights.length} flights`,
    );
    public baselineAmbient = computed(() => this.data().baselineAmbient ?? 20);
    public ambientFinalInside = computed(() => this.result().baseline?.finalInsideTemp ?? 0);
    public realFinalInside = computed(() => this.result().real?.finalInsideTemp ?? null);
    public excursionAt = computed(() => this.result().real?.excursionAtHours ?? null);
    public pcmDoneAt = computed(() => this.result().real?.pcmDoneAtHours ?? null);
    public flightTimeLabel = computed(() => formatHours(this.result().timings.totalFlightHours));
    public transferTimeLabel = computed(() => formatHours(this.result().timings.totalTransferHours));

    constructor() {
        effect(() => {
            this.data();
            this.height();
            this.showHourlyLabels();
            this.darkMode();
            if (this.chart) this.rebuildChart();
        });
    }

    public ngAfterViewInit(): void {
        this.rebuildChart();
    }

    public ngOnDestroy(): void {
        this.chart?.destroy();
    }

    private isDark(): boolean {
        if (this.darkMode() !== null) return !!this.darkMode();
        return typeof window !== 'undefined'
            && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    }

    private rebuildChart(): void {
        this.chart?.destroy();
        this.chart = new Chart(this.canvasRef.nativeElement, this.buildChartConfig());
    }

    private buildChartConfig(): ChartConfiguration {
        const data = this.data();
        const r = this.result();
        const real = r.real;
        const baseline = r.baseline;
        const zones = r.zones;

        // labels come from whichever simulation we have — prefer baseline (always present),
        // fall back to real if baselineAmbient was null.
        const referencePoints = baseline?.points ?? real?.points ?? [];
        const labels = referencePoints.map(p => p.t);
        const tMin = data.container.targetRange.min;
        const tMax = data.container.targetRange.max;

        const dark = this.isDark();
        const palette = {
            insideReal: '#993C1D',
            insideBaseline: '#0F6E56',
            ambientReal: '#A32D2D',
            ambientBaseline: dark ? '#B4B2A9' : '#5F5E5A',
            band: 'rgba(192, 221, 151, 0.35)',
            grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            text: dark ? '#D3D1C7' : '#444441',
        };

        const datasets: ChartConfiguration['data']['datasets'] = [
            {
                label: '__band_top',
                data: labels.map(() => tMax),
                borderColor: 'transparent', backgroundColor: palette.band,
                pointRadius: 0, fill: '+1', yAxisID: 'y', order: 100,
            },
            {
                label: '__band_bot',
                data: labels.map(() => tMin),
                borderColor: 'transparent', backgroundColor: 'transparent',
                pointRadius: 0, fill: false, yAxisID: 'y', order: 101,
            },
        ];

        if (real) {
            datasets.push(
                {
                    label: 'Inside (real route)',
                    data: real.points.map(p => p.insideTemp),
                    borderColor: palette.insideReal, backgroundColor: 'transparent',
                    pointRadius: 0, borderWidth: 2.5, tension: 0.25, yAxisID: 'y',
                },
                {
                    label: 'Ambient (real route)',
                    data: real.points.map(p => p.ambientTemp),
                    borderColor: palette.ambientReal, borderDash: [5, 4],
                    backgroundColor: 'transparent', pointRadius: 0, borderWidth: 1.5,
                    yAxisID: 'y1',
                },
            );
        }

        if (baseline) {
            datasets.push(
                {
                    label: `Inside (baseline ${data.baselineAmbient ?? 20}°C)`,
                    data: baseline.points.map(p => p.insideTemp),
                    borderColor: palette.insideBaseline, backgroundColor: 'transparent',
                    pointRadius: 0, borderWidth: 2.5, tension: 0.25, yAxisID: 'y',
                },
                {
                    label: `Ambient (baseline ${data.baselineAmbient ?? 20}°C)`,
                    data: baseline.points.map(p => p.ambientTemp),
                    borderColor: palette.ambientBaseline, borderDash: [3, 3],
                    backgroundColor: 'transparent', pointRadius: 0, borderWidth: 1.5,
                    yAxisID: 'y1',
                },
            );
        }

        const totalHours = labels[labels.length - 1] ?? 1;
        const insideValues = [
            ...(real?.points.map(p => p.insideTemp) ?? []),
            ...(baseline?.points.map(p => p.insideTemp) ?? []),
        ];
        const ambientValues = [
            ...(real?.points.map(p => p.ambientTemp) ?? []),
            ...(baseline?.points.map(p => p.ambientTemp) ?? []),
            data.baselineAmbient ?? 20,
        ];
        const yMaxLeft = Math.max(tMax + 4, ...insideValues) + 2;
        const yMaxRight = Math.max(...ambientValues) + 8;

        const annotations = this.buildAnnotations(zones, yMaxRight);

        return {
            type: 'line',
            data: {labels, datasets},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                interaction: {mode: 'index', intersect: false},
                plugins: {
                    annotation: {annotations},
                    legend: {
                        display: true, position: 'top',
                        labels: {
                            filter: (item) => !item.text.startsWith('__band'),
                            color: palette.text, font: {size: 11},
                            boxWidth: 14, boxHeight: 3,
                        },
                    },
                    tooltip: {
                        boxPadding: 8,
                        callbacks: {
                            title: (items) => `t = ${(+items[0].label).toFixed(1)} h`,
                            label: (item) => {
                                if (item.dataset.label?.startsWith('__band')) return '';
                                return `${item.dataset.label}: ${item.formattedValue}°C`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        type: 'linear', min: 0, max: totalHours,
                        title: {display: true, text: 'hours from start', color: palette.text, font: {size: 11}},
                        ticks: {color: palette.text, font: {size: 10}},
                        grid: {color: palette.grid},
                    },
                    y: {
                        type: 'linear', position: 'left',
                        min: Math.min(0, tMin - 2), max: yMaxLeft,
                        title: {display: true, text: 'inside °C', color: palette.insideReal, font: {size: 11}},
                        ticks: {color: palette.insideReal, font: {size: 10}},
                        grid: {color: palette.grid},
                    },
                    y1: {
                        type: 'linear', position: 'right',
                        min: 0, max: yMaxRight,
                        title: {display: true, text: 'ambient °C', color: palette.ambientReal, font: {size: 11}},
                        ticks: {color: palette.ambientReal, font: {size: 10}},
                        grid: {display: false},
                    },
                },
            },
        };
    }

    private buildAnnotations(zones: RouteZone[], yMaxRight: number): Record<string, AnnotationOptions> {
        const annotations: Record<string, AnnotationOptions> = {};
        const showHourly = this.showHourlyLabels();

        zones.forEach((zone, zi) => {
            const colors = ZONE_COLORS[zone.type];

            annotations[`box_${zi}`] = {
                type: 'box',
                xMin: zone.startHour, xMax: zone.endHour,
                yScaleID: 'y1', yMin: 0, yMax: yMaxRight,
                backgroundColor: colors.bg,
                borderWidth: 0,
                drawTime: 'beforeDatasetsDraw',
            };

            annotations[`label_${zi}`] = {
                type: 'label',
                xValue: (zone.startHour + zone.endHour) / 2,
                yScaleID: 'y1',
                yValue: yMaxRight - 2,
                content: zone.zoneLabel,
                color: colors.text,
                font: {size: 10, weight: 'bold'},
                backgroundColor: 'rgba(255,255,255,0.7)',
                padding: {top: 2, bottom: 2, left: 6, right: 6},
                borderRadius: 3,
            };

            if (showHourly && zone.hourlyLabels.length > 0
                && (zone.type === 'layover'
                    || zone.type === 'ground-departure'
                    || zone.type === 'ground-arrival')) {
                zone.hourlyLabels.forEach((h, hi) => {
                    annotations[`htemp_${zi}_${hi}`] = {
                        type: 'label',
                        xValue: h.hourOffset,
                        yScaleID: 'y1',
                        yValue: yMaxRight * 0.55,
                        content: `${Math.round(h.temp)}°`,
                        rotation: -90,
                        color: colors.text,
                        font: {size: 10, weight: 'normal'},
                        padding: {top: 1, bottom: 1, left: 1, right: 1},
                    };
                });
            }
        });

        return annotations;
    }
}

function formatHours(hours: number): string {
    if (!isFinite(hours) || hours <= 0) return '0h';
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}
