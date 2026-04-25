import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export interface ScanAwbParty {
    name: string;
    role: string;
}

export interface ScanAwbInfo {
    awb: string;
    route: string[];
    cargo: string;
    pcs: number;
    kg: number;
    fohConfirmedAt: string | null;
    parties: ScanAwbParty[];
}

export interface ScanFailureReason {
    code: string;
    comment: string;
}

export interface ScanFailureContact {
    name: string;
    role: string;
    channel: 'Email' | 'WhatsApp' | 'Both';
}

export interface ScanFailurePayload {
    awb: string;
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

    public submitAcceptance(payload: ScanAcceptancePayload): Observable<ScanResult> {
        return this.http.post<ScanResult>(`scan/${encodeURIComponent(payload.awb)}/accept`, payload);
    }

    public submitFailure(payload: ScanFailurePayload): Observable<ScanResult> {
        return this.http.post<ScanResult>(`scan/${encodeURIComponent(payload.awb)}/failure`, payload);
    }
}
