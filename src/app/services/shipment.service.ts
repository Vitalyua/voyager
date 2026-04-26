import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, map} from 'rxjs';
import {AwbWithUld, FailureReason, FailureReasonSummary, LateAwb, NotifiedContactPayload, NotifyContacts, ShipmentDetails, ShipmentListResponse, StatisticsSummary} from '../voyager-data';

@Injectable({providedIn: 'root'})
export class ShipmentService {
    private readonly http = inject(HttpClient);

    public list(): Observable<ShipmentListResponse> {
        return this.http.get<ShipmentListResponse>('notifications/shipments').pipe(map((response) => {
            response.items.filter((item)=>{
                return item.departureLocation && item.arrivalLocation && item.last_event && item.last_event.eventCode;
            }).map((item) => {
                item.departureLocation.map((dep) => dep.code = dep["@id"].substring(dep["@id"].length - 3));
                item.arrivalLocation.map((arr) => arr.code = arr["@id"].substring(arr["@id"].length - 3));
                item.last_event.eventCode.code = item.last_event.eventCode["@id"].substring(item.last_event.eventCode["@id"].length - 3);
                return item;
            });
            return response;
        }));
    }

    public getAwb(prefix: string, awb: string): Observable<ShipmentDetails> {
        const params = new HttpParams()
            .set('awb_prefix', prefix)
            .set('awb_number', awb);
        return this.http.get<ShipmentDetails>('/notifications/shipments/detail', {params});
    }

    public createNotifiedContact(payload: NotifiedContactPayload): Observable<NotifyContacts> {
        return this.http.post<NotifyContacts>('notified-contacts', payload);
    }

    public updateNotifiedContact(id: number, payload: Partial<NotifiedContactPayload>): Observable<NotifyContacts> {
        return this.http.patch<NotifyContacts>(`notified-contacts/${id}`, payload);
    }

    public deleteNotifiedContact(id: number): Observable<void> {
        return this.http.delete<void>(`notified-contacts/${id}`);
    }

    public resolveFailureReason(id: number): Observable<FailureReason> {
        return this.http.patch<FailureReason>(`failure-reasons/${id}/resolved-at`, {
            resolved_at: new Date().toISOString(),
        });
    }

    public getStatistics(): Observable<StatisticsSummary> {
        return this.http.get<StatisticsSummary>('statistics');
    }

    public getLateAwb(): Observable<LateAwb[]> {
        return this.http.get<LateAwb[]>('statistics/late-awb');
    }

    public getFailureReasonsFeed(): Observable<FailureReasonSummary[]> {
        return this.http.get<FailureReasonSummary[]>('statistics/failure-reasons');
    }

    public getAwbWithUld(): Observable<AwbWithUld[]> {
        return this.http.get<AwbWithUld[]>('statistics/awbwithuld');
    }
}
