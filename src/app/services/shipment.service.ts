import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, map} from 'rxjs';
import {ShipmentListResponse, ShipmentRow} from '../voyager-data';

@Injectable({providedIn: 'root'})
export class ShipmentService {
    private readonly http = inject(HttpClient);

    public list(): Observable<ShipmentListResponse> {
        return this.http.get<ShipmentListResponse>('notifications/shipments').pipe(map((response) => {
            response.items.map((item) => {
                item.departureLocation.map((dep) => dep.code = dep["@id"].substring(dep["@id"].length - 3));
                item.arrivalLocation.map((arr) => arr.code = arr["@id"].substring(arr["@id"].length - 3));
                item.last_event.eventCode.code = item.last_event.eventCode["@id"].substring(item.last_event.eventCode["@id"].length - 3);
                return item;
            });
            return response;
        }));
    }
}
