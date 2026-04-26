import {ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {RouterOutlet, RouterLink, RouterLinkActive} from '@angular/router';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    styleUrl: './main-layout.css',
    templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    public readonly navLinks = [
        {label: 'Dashboard', path: '/dashboard'},
        {label: 'Shipments', path: '/shipments'},
    ];

    public readonly clock = signal(this.formatUtc());

    public ngOnInit(): void {
        const id = setInterval(() => this.clock.set(this.formatUtc()), 1_000);
        this.destroyRef.onDestroy(() => clearInterval(id));
    }

    private formatUtc(): string {
        const d = new Date();
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        const ss = String(d.getUTCSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss} UTC`;
    }
}
