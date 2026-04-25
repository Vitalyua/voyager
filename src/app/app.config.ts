import {ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withInterceptors} from '@angular/common/http';

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
    ]
};
