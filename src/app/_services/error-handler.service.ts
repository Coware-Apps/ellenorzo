import { Injectable, ErrorHandler } from "@angular/core";
import { FirebaseX } from "@ionic-native/firebase-x/ngx";
import { stringify } from "flatted/esm";
import { GlobalError } from '../_exceptions/global-exception';
import { PromptService } from './prompt.service';
import { TranslateService } from '@ngx-translate/core';
import { AdministrationNetworkError } from '../_exceptions/administration-exception';

@Injectable({
    providedIn: "root",
})
export class ErrorHandlerService extends ErrorHandler {
    constructor(
        private firebase: FirebaseX,
        private prompt: PromptService,
        private translator: TranslateService,
    ) {
        super();
    }

    async handleError(error: any): Promise<void> {
        //zone.js wrapping issue fix
        if (error.promise && error.rejection) error = error.rejection;

        this.firebase.logError("[GLOBAL ERROR HANDLER] " + stringify(error));

        if (error instanceof GlobalError && error.isHandled != true) {
            this.prompt.errorToast(this.translator.instant(error.customTitleTranslatorKey));
        }

        super.handleError(error);
    }
}