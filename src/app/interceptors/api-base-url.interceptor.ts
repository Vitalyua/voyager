import {HttpInterceptorFn} from '@angular/common/http';

export const API_BASE_URL = '/api/';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
    if (/^https?:\/\//i.test(req.url)) {
        return next(req);
    }

    const path = req.url.replace(/^\/+/, '');
    return next(req.clone({url: API_BASE_URL + path}));
};
