import {CARGO} from '../voyager-data';

export function getCargoLabel(key: string): string {
    return CARGO[key]?.label ?? key;
}
