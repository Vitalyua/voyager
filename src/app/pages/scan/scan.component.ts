import {ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {
    AwrDropdownComponent,
    AwrCheckboxComponent,
    AwrSwitchComponent,
    AwrToggleGroupComponent
} from '@awerysoftware/awr';
import {EHCP_L1, EHCP_L2, EHCP_L3, EhcpOption} from '../../data/ehcp-codes';
import {ScanService, ScanAwbInfo} from '../../services/scan.service';

type Step = 'foh' | 'choose' | 'failure' | 'doneFail' | 'doneOk';
type Channel = 'Email' | 'WhatsApp' | 'Both';

interface Reason {
    l1: string | null;
    l2: string | null;
    l3: string | null;
    comment: string;
    files: File[];
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES_PER_REASON = 10;

interface Party {
    name: string;
    role: string;
}

interface Contact {
    on: boolean;
    ch: Channel;
}

interface DropdownOption {
    value: string;
    label: string;
}

@Component({
    selector: 'app-scan',
    standalone: true,
    imports: [FormsModule, AwrDropdownComponent, AwrCheckboxComponent, AwrSwitchComponent, AwrToggleGroupComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './scan.component.html',
    styleUrl: './scan.component.css',
})
export class ScanComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly api = inject(ScanService);
    private readonly destroyRef = inject(DestroyRef);

    public readonly awb = toSignal(
        this.route.paramMap.pipe(map(p => p.get('awb') ?? '')),
        {initialValue: ''},
    );

    public readonly awbInfo = signal<ScanAwbInfo | null>(null);
    public readonly notificationId = signal<number | null>(null);
    public readonly loading = signal<boolean>(true);

    public readonly step = signal<Step>('foh');
    public readonly fohConfirmedAt = signal<string | null>(null);

    constructor() {
        effect(() => {
            const a = this.awb();
            if (!a) return;
            this.api.getAwb(a)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(info => {
                    this.awbInfo.set(info);
                    this.notificationId.set(info?.notification_id ?? null);
                    if (info?.fohConfirmedAt) {
                        this.fohConfirmedAt.set(info.fohConfirmedAt);
                    }
                    this.contacts.set(
                        (info?.parties ?? []).map(() => ({on: true, ch: 'Email' as const})),
                    );
                    this.loading.set(false);
                });
        });
    }

    public readonly channels: Channel[] = ['Email', 'WhatsApp', 'Both'];

    public readonly reasonsL1 = EHCP_L1;
    public readonly reasonsL2 = EHCP_L2;
    public readonly reasonsL3 = EHCP_L3;

    public readonly reasons = signal<Reason[]>([
        {l1: null, l2: null, l3: null, comment: '', files: []},
    ]);

    public readonly fileError = signal<string | null>(null);

    public readonly notify = signal<boolean>(true);

    public readonly parties = computed<Party[]>(() => this.awbInfo()?.parties ?? []);
    public readonly contacts = signal<Contact[]>([]);

    public readonly canSendFailure = computed(() =>
        this.reasons().some(r => r.l1 && r.l2 && r.l3),
    );

    public readonly doneSummary = computed(() =>
        this.step() === 'doneFail'
            ? `${this.reasons().filter(r => r.l1 && r.l2 && r.l3).length} exception(s) filed · ` +
            `${this.contacts().filter(c => c.on).length} contact(s) notified`
            : 'Acceptance check cleared · RCS issued',
    );

    public readonly l1DropdownOptions: DropdownOption[] = this.toDropdown(this.reasonsL1);

    public l2Options(l1: string | null): EhcpOption[] {
        return l1 ? this.reasonsL2[l1] ?? [] : [];
    }

    public l3Options(l1: string | null, l2: string | null): EhcpOption[] {
        if (!l1 || !l2) return [];
        return this.reasonsL3[`${l1}/${l2}`] ?? [];
    }

    public l2DropdownOptions(l1: string | null): DropdownOption[] {
        return this.toDropdown(this.l2Options(l1));
    }

    public l3DropdownOptions(l1: string | null, l2: string | null): DropdownOption[] {
        return this.toDropdown(this.l3Options(l1, l2));
    }

    public ehcpCode(r: Reason): string {
        return [r.l1, r.l2, r.l3].filter(Boolean).join('');
    }

    private toDropdown(opts: EhcpOption[]): DropdownOption[] {
        return opts.map(o => ({value: o.value, label: `${o.value} — ${o.label}`}));
    }

    public confirmFoh(): void {
        const d = new Date();
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        const ts = `${hh}:${mm}Z`;
        this.fohConfirmedAt.set(ts);
        this.api.confirmFoh(this.awb()).subscribe();
    }

    public performPhysicalCheck(): void {
        this.api.confirmRcs(this.awb()).subscribe();
        this.step.set('choose');
    }

    public accept(): void {
        this.api
            .submitAcceptance({
                awb: this.awb(),
                fohConfirmedAt: this.fohConfirmedAt(),
            })
            .subscribe();
        this.step.set('doneOk');
    }

    public openFailure(): void {
        this.step.set('failure');
    }

    public backToChoose(): void {
        this.step.set('choose');
    }

    public sendFailure(): void {
        if (!this.canSendFailure()) return;
        const parties = this.parties();
        const contacts = this.contacts();
        const payload = {
            awb: this.awb(),
            notification_id: this.notificationId(),
            reasons: this.reasons()
                .filter(r => r.l1 && r.l2 && r.l3)
                .map(r => ({
                    code: this.ehcpCode(r),
                    comment: r.comment,
                    files: r.files,
                })),
            notify: this.notify(),
            contacts: this.notify()
                ? parties
                    .map((p, i) => ({...p, on: contacts[i]?.on ?? false, ch: contacts[i]?.ch ?? 'Email' as Channel}))
                    .filter(c => c.on)
                    .map(({name, role, ch}) => ({name, role, channel: ch}))
                : [],
        };
        this.api.submitFailure(payload).subscribe();
        this.step.set('doneFail');
    }

    public scanAnother(): void {
        this.step.set('foh');
    }

    public viewAwb(): void {
        void this.router.navigate(['/shipments', this.awb()]);
    }

    public addReason(): void {
        this.reasons.update(arr => [
            ...arr,
            {l1: null, l2: null, l3: null, comment: '', files: []},
        ]);
    }

    public addFiles(i: number, fileList: FileList | null): void {
        if (!fileList || fileList.length === 0) return;
        const incoming = Array.from(fileList);

        for (const f of incoming) {
            if (!ALLOWED_MIME.includes(f.type)) {
                this.fileError.set(`Unsupported file type: ${f.name}`);
                return;
            }
            if (f.size > MAX_FILE_SIZE) {
                this.fileError.set(`File too large (max 10 MB): ${f.name}`);
                return;
            }
        }

        this.fileError.set(null);
        this.reasons.update(arr =>
            arr.map((r, idx) => {
                if (idx !== i) return r;
                const merged = [...r.files, ...incoming].slice(0, MAX_FILES_PER_REASON);
                return {...r, files: merged};
            }),
        );
    }

    public removeFile(reasonIdx: number, fileIdx: number): void {
        this.reasons.update(arr =>
            arr.map((r, idx) =>
                idx === reasonIdx ? {...r, files: r.files.filter((_, k) => k !== fileIdx)} : r,
            ),
        );
    }

    public previewUrl(file: File): string {
        return file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    }

    public formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }

    public removeReason(i: number): void {
        this.reasons.update(arr => arr.filter((_, idx) => idx !== i));
    }

    public setReasonL1(i: number, value: string): void {
        this.reasons.update(arr =>
            arr.map((r, idx) => (idx === i ? {...r, l1: value || null, l2: null, l3: null} : r)),
        );
    }

    public setReasonL2(i: number, value: string): void {
        this.reasons.update(arr =>
            arr.map((r, idx) => (idx === i ? {...r, l2: value || null, l3: null} : r)),
        );
    }

    public setReasonL3(i: number, value: string): void {
        this.reasons.update(arr =>
            arr.map((r, idx) => (idx === i ? {...r, l3: value || null} : r)),
        );
    }

    public setReasonComment(i: number, value: string): void {
        this.reasons.update(arr =>
            arr.map((r, idx) => (idx === i ? {...r, comment: value} : r)),
        );
    }

    public setContactOn(i: number, value: boolean | null): void {
        this.contacts.update(arr =>
            arr.map((c, idx) => (idx === i ? {...c, on: !!value} : c)),
        );
    }

    public setContactChannel(i: number, ch: Channel): void {
        this.contacts.update(arr =>
            arr.map((c, idx) => (idx === i ? {...c, ch} : c)),
        );
    }

    public asValue(e: Event): string {
        return (e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
    }

    public asInput(e: Event): HTMLInputElement {
        return e.target as HTMLInputElement;
    }
}
