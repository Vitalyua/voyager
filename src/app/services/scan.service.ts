import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export interface ScanAwbParty {
    name: string;
    role: string;
}

export interface ScanAwbInfo {
    awb: string;
    notification_id: number | null;
    route: string[];
    cargo: string | null;
    pcs: number;
    kg: string | number;
    fohConfirmedAt: string | null;
    parties: ScanAwbParty[];
}

export interface ScanFailureReason {
    code: string;
    text?: string;
    description?: string;
    comment: string;
    files?: File[];
}

export interface ScanFailureContact {
    name: string;
    role: string;
    channel: 'Email' | 'WhatsApp' | 'Both';
}

export interface ScanFailurePayload {
    awb: string;
    notification_id: number | null;
    reasons: ScanFailureReason[];
    notify: boolean;
    contacts: ScanFailureContact[];
}

export interface ScanAcceptancePayload {
    awb: string;
    fohConfirmedAt: string | null;
}

export interface ScanResult {
    ok: boolean;
    id?: string;
}

@Injectable({providedIn: 'root'})
export class ScanService {
    private readonly http = inject(HttpClient);

    public getAwb(awb: string): Observable<ScanAwbInfo> {
        return this.http.get<ScanAwbInfo>(`scan/${encodeURIComponent(awb)}`);
    }

    public confirmFoh(awb: string): Observable<ScanResult> {
        return this.http.post<ScanResult>(`scan/${encodeURIComponent(awb)}/foh`, {});
    }

    public confirmRcs(awb: string): Observable<ScanResult> {
        return this.http.post<ScanResult>(`scan/${encodeURIComponent(awb)}/rcs`, {});
    }

    public submitAcceptance(payload: ScanAcceptancePayload): Observable<ScanResult> {
        return this.http.post<ScanResult>(`scan/${encodeURIComponent(payload.awb)}/accept`, payload);
    }

    public submitFailure(payload: ScanFailurePayload): Observable<ScanResult> {
        const reasonsForJson = payload.reasons.map(({code, text, description, comment}) => ({code, text, description, comment}));
        const json = {
            awb: payload.awb,
            notification_id: payload.notification_id,
            reasons: reasonsForJson,
            notify: payload.notify,
            contacts: payload.contacts,
        };

        const form = new FormData();
        form.append('payload', JSON.stringify(json));
        payload.reasons.forEach((reason, i) => {
            (reason.files ?? []).forEach(file => {
                form.append(`files[${i}][]`, file, file.name);
            });
        });

        return this.http.post<ScanResult>(
            `scan/${encodeURIComponent(payload.awb)}/failure`,
            form,
        );
    }
}
