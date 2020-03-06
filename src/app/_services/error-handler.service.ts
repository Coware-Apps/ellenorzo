import { Injectable, ErrorHandler } from "@angular/core";
import { FirebaseX } from "@ionic-native/firebase-x/ngx";
import { stringify } from "flatted/esm";

@Injectable({
    providedIn: "root",
})
export class ErrorHandlerService extends ErrorHandler {
    constructor(
        private firebase: FirebaseX
    ) {
        super();
    }

    async handleError(error: any): Promise<void> {
        this.firebase.logError("[GLOBAL ERROR HANDLER] " + stringify(error));
        console.log("GLOBAL error handler ran: ", error);

        super.handleError(error);
    }
}