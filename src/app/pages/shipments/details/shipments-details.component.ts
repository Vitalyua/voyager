import {ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import QRCode from 'qrcode';
import {ShipmentDetails, NotifyContacts} from '../../../voyager-data';
import {TemperatureChartComponent} from '../../../shared/temperature-chart/temperature-chart.component';
import {CONTAINER_PRESETS} from '../../../shared/temperature-chart/container-presets';
import {ContainerSpec, RealRouteInput} from '../../../shared/temperature-chart/temperature-chart.types';
import {buildRealRouteInput, deriveWeatherWindows} from '../../../shared/temperature-chart/route-input-builder';
import {takeUntilDestroyed, toObservable, toSignal} from "@angular/core/rxjs-interop";
import {filter, map, switchMap, take} from "rxjs";
import {ShipmentService} from "../../../services/shipment.service";
import {AirportService} from "../../../services/airport.service";
import {WeatherService, WeatherRequest} from "../../../services/weather.service";
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
    private readonly weatherService = inject(WeatherService);
    private readonly airportsReady$ = toObservable(this.airportsService.byIata).pipe(
        filter(m => m.size > 0),
        take(1),
    );

    public readonly realRoute = signal<RealRouteInput | null>(null);
    public readonly container = computed<ContainerSpec | null>(() => {
        const type = this.awbInfo()?.uld?.type;
        return type ? CONTAINER_PRESETS[type] ?? null : null;
    });
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
            this.realRoute.set(null);
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

                    this.fetchWeatherFor(info);
                });
        });
    }

    private fetchWeatherFor(info: ShipmentDetails): void {
        const legs = info.flight?.legs ?? [];
        if (legs.length === 0) {
            this.realRoute.set(null);
            return;
        }
        const targetId = info.id;
        const windows = deriveWeatherWindows(legs);

        this.airportsReady$.pipe(
            switchMap(byIata => {
                const requests: WeatherRequest[] = [];
                for (const [iata, win] of windows) {
                    const a = byIata.get(iata);
                    if (!a) continue;
                    requests.push({iata, lat: a.lat, lng: a.lng, start: win.start, end: win.end});
                }
                return this.weatherService.getHourlyForecast(requests);
            }),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe({
            next: weather => {
                if (this.awbInfo()?.id !== targetId) return;
                if (weather.size < windows.size) {
                    this.realRoute.set(null);
                    return;
                }
                const container = (info.uld?.type && CONTAINER_PRESETS[info.uld.type]) || CONTAINER_PRESETS['vaQMed21Premium'];
                this.realRoute.set(buildRealRouteInput({
                    legs,
                    weather,
                    container,
                }));
            },
            error: err => {
                console.warn('Weather forecast failed', err);
                if (this.awbInfo()?.id === targetId) this.realRoute.set(null);
            },
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
        const awb = (this.awbInfo()?.waybill_prefix + '-' + this.awbInfo()?.waybill_number).replace(/[<>&]/g, '');
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

    public resolveFailure(id: number): void {
        this.api.resolveFailureReason(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(updated => {
                const cur = this.awbInfo();
                if (!cur) return;
                this.awbInfo.set({
                    ...cur,
                    failure_reasons: cur.failure_reasons.map(f =>
                        f.id === id ? {...f, ...updated} : f,
                    ),
                });
            });
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
