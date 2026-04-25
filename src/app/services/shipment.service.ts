import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ShipmentRow} from '../voyager-data';

@Injectable({providedIn: 'root'})
export class ShipmentService {
    private readonly http = inject(HttpClient);

    public list(): Observable<ShipmentRow[]> {
        return this.http.get<ShipmentRow[]>('shipments');
    }
}
