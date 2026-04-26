import {ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import QRCode from 'qrcode';
import {AWB_DETAIL, IATA, CARGO, ShipmentRow, ShipmentDetails, NotifyContacts} from '../../../voyager-data';
import {TemperatureChartComponent} from '../../../shared/temperature-chart/temperature-chart.component';
import {CONTAINER_PRESETS} from '../../../shared/temperature-chart/container-presets';
import {RealRouteInput} from '../../../shared/temperature-chart/temperature-chart.types';
import {takeUntilDestroyed, toSignal} from "@angular/core/rxjs-interop";
import {map} from "rxjs";
import {ShipmentService} from "../../../services/shipment.service";
import {AirportService} from "../../../services/airport.service";
import {CargoLabelPipe} from "../../../pipes/cargo.pipe";
import {StatusCodePipe, StatusLabelPipe} from "../../../pipes/status.pipe";
import {DatePipe} from "@angular/common";

type TimelineTab = 'expected' | 'legs';
type EditingId = number | 'new' | null;

interface ContactDraft {
    name: string;
    role: string;
    email: string;
    phone: string;
}

const EMPTY_DRAFT: ContactDraft = {name: '', role: '', email: '', phone: ''};

function deriveChannel(email: string | null, phone: string | null): string | null {
    const hasEmail = !!email?.trim();
    const hasPhone = !!phone?.trim();
    if (hasEmail && hasPhone) return 'Both';
    if (hasEmail) return 'Email';
    if (hasPhone) return 'WhatsApp';
    return null;
}

@Component({
    selector: 'app-awb-detail',
    standalone: true,
    imports: [RouterLink, FormsModule, TemperatureChartComponent, CargoLabelPipe, StatusCodePipe, StatusLabelPipe, DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './shipments-details.component.html',
    styleUrl: './shipments-details.component.css',
})
export class ShipmentsDetailsComponent {
    private readonly api = inject(ShipmentService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly route = inject(ActivatedRoute);
    private readonly airportsService = inject(AirportService);

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
    public readonly routeCities = computed(() => {
        if (!this.awbInfo() || !this.airportsService.iatas().size) return '';
        return [this.airportsService.getCity(this.awbInfo()!.flight!.legs[0].from), ...this.awbInfo()!.flight!.legs.map(c => this.airportsService.getCity(c.to) ?? c)].join(' → ')
    });
    public readonly lateCount = computed(()=>{
        if(!this.awbInfo()) return 0;
        return this.awbInfo()!.awb_events.filter((event:any)=>{
            return event.actual_time ?
                new Date(event.estimated_time).getTime() < new Date(event.actual_time).getTime() :
                new Date(event.estimated_time).getTime() < new Date().getTime();
        }).length;
    });
    public notifiedCount = computed(()=>{
        if(!this.awbInfo()) return 0;
        return this.awbInfo()!.notified_contacts?.filter((event:any)=>{
            return !!event.notified_at;
        }).length;
    })

    public readonly timelineTab = signal<TimelineTab>('expected');
    public readonly showQr = signal(false);

    public readonly editingId = signal<EditingId>(null);
    public draft: ContactDraft = {...EMPTY_DRAFT};
    public readonly saving = signal(false);

    public qrTargetUrl = `https://voyager.awery.com/scan/`;
    public readonly qrSvg = signal<SafeHtml | null>(null);
    private qrSvgRaw = '';

    public readonly awb = toSignal(
        this.route.paramMap.pipe(map(p => p.get('awb') ?? '')),
        {initialValue: ''},
    );
    public readonly awbInfo = signal<ShipmentDetails | null>(null);

    constructor(private readonly sanitizer: DomSanitizer) {
        this.airportsService.load();
        effect(() => {
            const a = this.awb();
            if (!a) return;
            this.api.getAwb(a.split('-')[0], a.split('-')[1])
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(info => {
                    info.awb_events.forEach(event => {
                       event.is_late = !!event.actual_time ?
                           new Date(event.actual_time).getTime() > new Date(event.estimated_time).getTime() :
                           new Date().getTime() > new Date(event.estimated_time).getTime();
                        if (event.is_late) {
                            event.delta = this.millSecToText(
                                !!event.actual_time ?
                                    new Date(event.actual_time).getTime() - new Date(event.estimated_time).getTime() :
                                    new Date().getTime() - new Date(event.estimated_time).getTime()
                            );
                        }
                    });

                    this.awbInfo.set(info);

                    this.qrTargetUrl += this.awbInfo()?.waybill_prefix + '-' + this.awbInfo()?.waybill_number;
                    QRCode.toString(this.qrTargetUrl, {
                        type: 'svg',
                        errorCorrectionLevel: 'M',
                        margin: 1,
                        color: {dark: '#0b0f14', light: '#ffffff'},
                    }).then(svg => {
                        this.qrSvgRaw = svg;
                        this.qrSvg.set(this.sanitizer.bypassSecurityTrustHtml(svg));
                    });
                });
        });
    }

    private millSecToText(mills: number): string {
        const totalMinutes = Math.floor(mills / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const parts: string[] = [];

        if (hours > 0) {
            parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
        }

        if (minutes > 0 || hours === 0) {
            parts.push(`${minutes} ${minutes === 1 ? 'min' : 'mins'}`);
        }

        return parts.join(' ');
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
        if (!name) return '';
        return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    }

    public channelOf(p: NotifyContacts): string | null {
        return p.channel ?? deriveChannel(p.email, p.phone);
    }

    public startEdit(p: NotifyContacts): void {
        if (this.saving()) return;
        this.editingId.set(p.id);
        this.draft = {
            name: p.name ?? '',
            role: p.role ?? '',
            email: p.email ?? '',
            phone: p.phone ?? '',
        };
    }

    public addNew(): void {
        if (this.saving() || this.editingId() === 'new') return;
        this.editingId.set('new');
        this.draft = {...EMPTY_DRAFT};
    }

    public cancelEdit(): void {
        if (this.saving()) return;
        this.editingId.set(null);
        this.draft = {...EMPTY_DRAFT};
    }

    public saveEdit(): void {
        const id = this.editingId();
        const info = this.awbInfo();
        if (id === null || !info || this.saving()) return;

        const name = this.draft.name.trim();
        if (!name) return;

        const email = this.draft.email.trim() || null;
        const phone = this.draft.phone.trim() || null;
        const role = this.draft.role.trim() || null;
        const channel = deriveChannel(email, phone);

        this.saving.set(true);

        if (id === 'new') {
            this.api.createNotifiedContact({
                notification_id: info.id,
                name,
                role,
                channel,
                email,
                phone,
            }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                next: created => {
                    const cur = this.awbInfo();
                    if (cur) {
                        this.awbInfo.set({
                            ...cur,
                            notified_contacts: [...(cur.notified_contacts ?? []), created],
                        });
                    }
                    this.editingId.set(null);
                    this.draft = {...EMPTY_DRAFT};
                    this.saving.set(false);
                },
                error: () => this.saving.set(false),
            });
        } else {
            this.api.updateNotifiedContact(id, {name, role, channel, email, phone})
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: updated => {
                        const cur = this.awbInfo();
                        if (cur) {
                            this.awbInfo.set({
                                ...cur,
                                notified_contacts: cur.notified_contacts.map(c =>
                                    c.id === id ? {...c, ...updated} : c,
                                ),
                            });
                        }
                        this.editingId.set(null);
                        this.draft = {...EMPTY_DRAFT};
                        this.saving.set(false);
                    },
                    error: () => this.saving.set(false),
                });
        }
    }

    public deleteContact(id: number): void {
        if (this.saving()) return;
        this.saving.set(true);
        this.api.deleteNotifiedContact(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    const cur = this.awbInfo();
                    if (cur) {
                        this.awbInfo.set({
                            ...cur,
                            notified_contacts: cur.notified_contacts.filter(c => c.id !== id),
                        });
                    }
                    if (this.editingId() === id) {
                        this.editingId.set(null);
                        this.draft = {...EMPTY_DRAFT};
                    }
                    this.saving.set(false);
                },
                error: () => this.saving.set(false),
            });
    }
}
