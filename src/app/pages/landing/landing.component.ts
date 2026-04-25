import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
    selector: 'app-landing',
    standalone: true,
    templateUrl: './landing.component.html',
    styleUrl: './landing.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
}
