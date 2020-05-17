import { Injectable, ErrorHandler } from "@angular/core";
import { FirebaseX } from "@ionic-native/firebase-x/ngx";
import { GlobalError } from '../_exceptions/global-exception';
import { PromptService } from './prompt.service';
import { UserManagerService } from './user-manager.service';
import * as StackTrace from "stacktrace-js";
import { AdministrationRenewTokenError } from '../_exceptions/administration-exception';

@Injectable({
    providedIn: "root",
})
export class ErrorHandlerService extends ErrorHandler {
    constructor(
        private firebase: FirebaseX,
        private prompt: PromptService,
        private userManager: UserManagerService,
    ) {
        super();
    }

    async handleError(error: any): Promise<void> {
        //zone.js wrapping issue fix
        if (error.promise && error.rejection) error = error.rejection;

        //creating a stacktrace
        let stackframes: StackTrace.StackFrame[];
        if (typeof error === "object") {
            stackframes = await StackTrace.fromError(error).catch(() => undefined);
        }

        //adding token debug info
        const errorReportString = this.appendAuthDebugToError(error);

        this.firebase.logError(errorReportString, stackframes);

        if (error instanceof AdministrationRenewTokenError && error.httpErrorObject && error.httpErrorObject.status == 400) {
            if (await this.prompt.administrationLoginExpiredToast()) {
                await this.userManager.currentUser.logOutOfAdministration();
                this.userManager.reloader.next("reload");
            }
        } else {
            if (error instanceof GlobalError && error.isHandled != true) {
                this.prompt.errorDetailToast(error);
                //this.prompt.errorToast(this.translator.instant(error.customTitleTranslatorKey));
            }
        }

        super.handleError(error);
    }

    private appendAuthDebugToError(error: any): string {
        let output = typeof error.toString === "function" ? error.toString() : error;

        if (this.userManager && this.userManager.currentUser) {
            output += "\n\n---- Kreta Token Debug ----\n";

            const tokens = this.userManager.currentUser.tokens;
            const administrationTokens = this.userManager.currentUser.tokens;

            if (this.userManager.currentUser.lastLoggedIn) {
                output += `Mobile Access Token valid for: ${
                    Math.round(((this.userManager.currentUser.lastLoggedIn + tokens.expires_in * 1000) - new Date().valueOf()) / 1000)
                    }s\n`;
            } else {
                output += `Mobile tokens not yet refreshed in this session\n`
            }
            if (this.userManager.currentUser.lastLoggedInAdministration) {
                output += `Administration Access Token valid for: ${
                    Math.round(((this.userManager.currentUser.lastLoggedInAdministration + administrationTokens.expires_in * 1000) - new Date().valueOf()) / 1000)
                    }s\n`;
            } else {
                output += `Administration tokens not yet refreshed in this session\n`
            }

            // refresh token debug
            if (tokens.refresh_token) {
                output += `Refresh token length (mobile): ${
                    tokens.refresh_token ? tokens.refresh_token.length : "null"
                    }\n`;
            } else {
                output += "Refresh token: does not exist\n";
            }
            if (administrationTokens.refresh_token) {
                output += `Refresh token length (administration): ${
                    administrationTokens.refresh_token ? administrationTokens.refresh_token.length : "null"
                    }\n`;
            } else {
                output += "Refresh token: does not exist\n";
            }
        } else {
            output += "No user registered on the device"
        }

        return output;
    }
}