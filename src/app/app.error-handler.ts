import {ErrorHandler, Injectable} from '@angular/core';

@Injectable()
export class AppErrorHandler extends ErrorHandler {
    public override handleError(error: any): void {
        const msg = error?.message ?? '';
        if (msg.includes('NG0100') && msg.includes('awr-toasts-z-index')) {
            return;
        }
        if (msg.includes("reading 'isExpanded'")) {
            return;
        }
        super.handleError(error);
    }
}
