import {Pipe, PipeTransform} from '@angular/core';
import {getCargoLabel} from '../utils/cargo';

@Pipe({name: 'cargoLabel', standalone: true})
export class CargoLabelPipe implements PipeTransform {
    public transform(key: string): string {
        return getCargoLabel(key);
    }
}
