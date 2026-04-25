import {Pipe, PipeTransform} from '@angular/core';
import {getStatusCode, getStatusLabel} from '../utils/status';

@Pipe({name: 'statusLabel', standalone: true})
export class StatusLabelPipe implements PipeTransform {
    public transform(key: string): string {
        return getStatusLabel(key);
    }
}

@Pipe({name: 'statusCode', standalone: true})
export class StatusCodePipe implements PipeTransform {
    public transform(key: string): string {
        return getStatusCode(key);
    }
}
