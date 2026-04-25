import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {RouterLink} from '@angular/router';
import QRCode from 'qrcode';
import {AWB_DETAIL, IATA, CARGO} from '../../../voyager-data';
import {TemperatureChartComponent} from '../../../shared/temperature-chart/temperature-chart.component';
import {CONTAINER_PRESETS} from '../../../shared/temperature-chart/container-presets';
import {RealRouteInput} from '../../../shared/temperature-chart/temperature-chart.types';

type TimelineTab = 'expected' | 'legs';

@Component({
    selector: 'app-awb-detail',
    standalone: true,
    imports: [RouterLink, TemperatureChartComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './shipments-details.component.html',
    styleUrl: './shipments-details.component.css',
})
export class ShipmentsDetailsComponent {
    public readonly d = AWB_DETAIL;

    /**
     * Demo dummy route for <app-temperature-chart>.
     * Replace flights/weather with real booking + forecast data when wiring to API.
     * Structure:
     *   - container       — pick preset from CONTAINER_PRESETS or pass a ContainerSpec
     *   - flights[]       — ordered flight legs (origin, destination, departure, arrival)
     *   - weather[]       — hourly air temps per IATA, must cover ground/layover windows
     *   - baselineAmbient — constant ambient (°C) for the green comparison line, null to hide
     */
    public readonly demoRoute: RealRouteInput = {
        container: CONTAINER_PRESETS['vaQMed21Premium'],
        flights: [
            {
                flightNumber: 'LH600',
                origin: 'FRA',
                destination: 'DXB',
                departure: new Date('2026-07-15T08:00:00Z'),
                arrival: new Date('2026-07-15T16:00:00Z'),
            },
            {
                flightNumber: 'CX734',
                origin: 'DXB',
                destination: 'HKG',
                departure: new Date('2026-07-16T01:00:00Z'),
                arrival: new Date('2026-07-16T13:30:00Z'),
            },
        ],
        weather: [
            {
                iataCode: 'FRA',
                hourlyTemperatures: [
                    {time: new Date('2026-07-15T07:00:00Z'), temp: 18},
                    {time: new Date('2026-07-15T08:00:00Z'), temp: 20},
                ],
                applySolar: false,
            },
            {
                iataCode: 'DXB',
                hourlyTemperatures: [
                    {time: new Date('2026-07-15T16:00:00Z'), temp: 42},
                    {time: new Date('2026-07-15T17:00:00Z'), temp: 41},
                    {time: new Date('2026-07-15T18:00:00Z'), temp: 40},
                    {time: new Date('2026-07-15T19:00:00Z'), temp: 38},
                    {time: new Date('2026-07-15T20:00:00Z'), temp: 36},
                    {time: new Date('2026-07-15T21:00:00Z'), temp: 34},
                    {time: new Date('2026-07-15T22:00:00Z'), temp: 33},
                    {time: new Date('2026-07-15T23:00:00Z'), temp: 32},
                    {time: new Date('2026-07-16T00:00:00Z'), temp: 31},
                    {time: new Date('2026-07-16T01:00:00Z'), temp: 31},
                ],
                applySolar: true,
            },
            {
                iataCode: 'HKG',
                hourlyTemperatures: [
                    {time: new Date('2026-07-16T13:00:00Z'), temp: 30},
                    {time: new Date('2026-07-16T14:00:00Z'), temp: 31},
                ],
                applySolar: true,
            },
        ],
        baselineAmbient: 20,
        tailHours: 0,
    };
    public readonly cargoLabel = CARGO[this.d.cargo]?.label ?? this.d.cargo;
    public readonly routeCities = this.d.route.map(c => IATA[c] ?? c).join(' → ');
    public readonly lateCount = this.d.timeline.filter(t => t.status === 'warn' || t.status === 'crit').length;
    public readonly selectedParties = this.d.parties.filter(p => p.sel).length;

    public readonly timelineTab = signal<TimelineTab>('expected');
    public readonly showQr = signal(false);

    public readonly qrTargetUrl = `https://voyager.awery.com/scan/${this.d.awb}`;
    public readonly qrSvg = signal<SafeHtml | null>(null);
    private qrSvgRaw = '';

    constructor(private readonly sanitizer: DomSanitizer) {
        QRCode.toString(this.qrTargetUrl, {
            type: 'svg',
            errorCorrectionLevel: 'M',
            margin: 1,
            color: {dark: '#0b0f14', light: '#ffffff'},
        }).then(svg => {
            this.qrSvgRaw = svg;
            this.qrSvg.set(this.sanitizer.bypassSecurityTrustHtml(svg));
        });
    }

    public printQr(): void {
        if (!this.qrSvgRaw) return;
        const win = window.open('', '_blank', 'width=420,height=560');
        if (!win) return;
        const awb = this.d.awb.replace(/[<>&]/g, '');
        win.document.open();
        win.document.write(`<!doctype html><html><head>
<meta charset="utf-8">
<title>QR ${awb}</title>
<style>
  @page { margin: 16mm; }
  html, body { margin: 0; padding: 0; }
  body {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 18px; padding: 24px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #0b0f14;
  }
  .qr { width: 320px; height: 320px; }
  .qr svg { width: 100%; height: 100%; display: block; }
  .awb { font-size: 22px; font-weight: 700; letter-spacing: 0.04em; }
</style>
</head><body>
  <div class="qr">${this.qrSvgRaw}</div>
  <div class="awb">${awb}</div>
  <script>
    window.addEventListener('load', () => {
      var closed = false;
      var closeSelf = function() {
        if (closed) return;
        closed = true;
        setTimeout(function() { window.close(); }, 50);
      };
      window.addEventListener('afterprint', closeSelf);
      var mql = window.matchMedia('print');
      if (mql && mql.addEventListener) {
        mql.addEventListener('change', function(e) { if (!e.matches) closeSelf(); });
      } else if (mql && mql.addListener) {
        mql.addListener(function(e) { if (!e.matches) closeSelf(); });
      }
      window.focus();
      window.print();
    });
  </script>
</body></html>`);
        win.document.close();
    }

    public initials(name: string): string {
        return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    }
}
