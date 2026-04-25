import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {catchError, throwError} from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((err: HttpErrorResponse) => {
            const where = `${req.method} ${req.url}`;
            if (err.status === 0) {
                console.error(`[http] network error · ${where}`, err.error);
            } else if (err.status >= 500) {
                console.error(`[http] ${err.status} server error · ${where}`, err.error);
            } else if (err.status >= 400) {
                console.warn(`[http] ${err.status} ${err.statusText} · ${where}`, err.error);
            }
            return throwError(() => err);
        }),
    );
};
