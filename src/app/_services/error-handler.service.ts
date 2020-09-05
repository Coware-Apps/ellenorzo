import { Injectable, ErrorHandler } from "@angular/core";
import { GlobalError } from "../_exceptions/global-exception";
import { PromptService } from "./prompt.service";
import { UserManagerService } from "./user-manager.service";
import * as StackTrace from "stacktrace-js";
import { AdministrationRenewTokenError } from "../_exceptions/administration-exception";
import { AppService } from "./app.service";
import { KretaError, KretaRenewTokenError } from "../_exceptions/kreta-exception";
import { environment } from "src/environments/environment.prod";
import { TranslateService } from "@ngx-translate/core";
import { JwtDecodeHelper } from "../_helpers/jwt-decode-helper";
import { FirebaseService } from "./firebase.service";
import {
    KretaV3RenewTokenError,
    KretaV3SchoolYearChangedError,
} from "../_exceptions/kreta-v3-exception";
import { stringify } from "querystring";
import { Router } from "@angular/router";

@Injectable({
    providedIn: "root",
})
export class ErrorHandlerService extends ErrorHandler {
    constructor(
        private firebase: FirebaseService,
        private prompt: PromptService,
        private userManager: UserManagerService,
        private app: AppService,
        private router: Router,
        private translator: TranslateService,
        private jwtDecodeHelper: JwtDecodeHelper
    ) {
        super();
    }

    async handleError(error: any): Promise<void> {
        if (error instanceof KretaError) this.app.downloadUserAgent();

        //zone.js wrapping issue fix
        if (error.promise && error.rejection) error = error.rejection;

        //creating a stacktrace
        let stackframes: StackTrace.StackFrame[];
        if (typeof error === "object") {
            stackframes = await StackTrace.fromError(error).catch(() => undefined);
        }

        //adding token debug info
        const errorReportString = this.appendAuthDebugToError(error);

        if (environment.production) this.firebase.logError(errorReportString, stackframes);

        if (
            (error instanceof KretaRenewTokenError ||
                error instanceof KretaV3RenewTokenError ||
                error instanceof AdministrationRenewTokenError) &&
            (error.httpErrorObject?.status == 401 || error.httpErrorObject?.status == 400)
        ) {
            //basically all types of authentication failed, the user must be logged out
            console.error("Full auth error, removing user:", this.userManager.currentUser.fullName);
            if ((await this.userManager.removeUser(this.userManager.currentUser.id)) == "login") {
                await this.router.navigateByUrl("login");
            } else {
                await this.router.navigateByUrl("user-settings");
            }
            this.firebase.logEvent("full_auth_error");
            this.prompt.toast(
                this.translator.instant("services.error-handler.loggedOutToast"),
                true
            );
        } else if (error instanceof KretaV3SchoolYearChangedError) {
            console.error("Schoolyear changed error", this.userManager.currentUser.fullName);
            if ((await this.userManager.removeUser(this.userManager.currentUser.id)) == "login") {
                await this.router.navigateByUrl("login");
            } else {
                await this.router.navigateByUrl("user-settings");
            }

            this.firebase.logEvent("schoolyear_changed_error");
            this.prompt.errorDetailToast(error);
        } else {
            if (error instanceof GlobalError) {
                if (!error.isHandled) this.prompt.errorDetailToast(error);
            } else {
                this.prompt.errorToast(stringify(error));
            }
        }

        super.handleError(error);
    }

    private appendAuthDebugToError(error: any): string {
        let output = typeof error.toString === "function" ? error.toString() : error;

        if (this.userManager && this.userManager.currentUser) {
            output += "\n\n---- Kreta Token Debug ----\n";

            const tokens = this.userManager.currentUser.v3Tokens;

            if (this.userManager.currentUser.lastLoggedIn) {
                output += `Mobile Access Token valid for: ${Math.round(
                    (this.userManager.currentUser.lastLoggedIn +
                        tokens.expires_in * 1000 -
                        new Date().valueOf()) /
                        1000
                )}s\n`;
            } else {
                output += `Mobile tokens not yet refreshed in this session\n`;
            }

            // refresh token debug
            if (tokens.refresh_token) {
                output += `Refresh token length (v3): ${
                    tokens.refresh_token ? tokens.refresh_token.length : "null"
                }\n`;
            } else {
                output += "Refresh token: does not exist\n";
            }
        } else {
            output += "No user registered on the device";
        }

        return output;
    }
}
