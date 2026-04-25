import {ChangeDetectionStrategy, Component} from '@angular/core';
import {Routes} from '@angular/router';

@Component({
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <div style="padding:48px 28px; text-align:center;">
        <h1 style="font-size:22px; font-weight:700; letter-spacing:-0.3px; margin-bottom:6px;">Coming soon</h1>
        <p style="font-size:13px; color: var(--text-mut);">This page is not implemented yet.</p>
      </div>
    `,
})
class ComingSoonComponent {}

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent),
        pathMatch: 'full',
    },
    {
        path: '',
        loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
        children: [
            {
                path: 'dashboard',
                component: ComingSoonComponent,
            },
            {
                path: 'shipments',
                loadComponent: () => import('./pages/shipments/shipments.component').then(m => m.ShipmentsComponent),
            },
            {
                path: 'shipments/:awb',
                loadComponent: () => import('./pages/shipments/details/shipments-details.component').then(m => m.ShipmentsDetailsComponent),
            },
            {
                path: 'uld',
                component: ComingSoonComponent,
            },
            {
                path: 'claims',
                component: ComingSoonComponent,
            },
        ],
    },
];
