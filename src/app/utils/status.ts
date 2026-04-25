import {STATUS, STATUS_TYPE} from '../voyager-data';

export function getStatusLabel(key: string): string {
    return STATUS[key] ?? key;
}

export function getStatusCode(key: string): string {
    return STATUS_TYPE[key] ?? key;
}
