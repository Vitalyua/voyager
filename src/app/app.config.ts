import {ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners, signal} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {AWR_CONFIG} from '@awerysoftware/awr';

import {routes} from './app.routes';
import {AppErrorHandler} from './app.error-handler';
import {apiBaseUrlInterceptor} from './interceptors/api-base-url.interceptor';
import {errorInterceptor} from './interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        {provide: ErrorHandler, useClass: AppErrorHandler},
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideHttpClient(withInterceptors([apiBaseUrlInterceptor, errorInterceptor])),
        {
            provide: AWR_CONFIG,
            useValue: {
                translates: {
                    language: signal('en'),
                    key: signal(null),
                    list: signal({}),
                },
                dates: {
                    format: signal('dd/MMM/yyyy'),
                    firstDayOfWeek: signal(1),
                },
            },
        },
    ],
};
