import { Component, OnInit } from "@angular/core";
import { UserManagerService } from "src/app/_services/user-manager.service";
import { Router } from "@angular/router";
import { AppService } from "src/app/_services/app.service";
import { PromptService } from "src/app/_services/prompt.service";
import { FirebaseService } from "src/app/_services/firebase.service";

@Component({
    selector: "app-user-settings",
    templateUrl: "./user-settings.page.html",
    styleUrls: ["./user-settings.page.scss"],
})
export class UserSettingsPage implements OnInit {
    public devMode: boolean = false;
    constructor(
        public userManager: UserManagerService,
        public app: AppService,

        private router: Router,
        private prompt: PromptService,
        private firebase: FirebaseService
    ) {}

    ngOnInit() {
        this.firebase.setScreenName("user-settings");
    }

    public addUser() {
        this.router.navigateByUrl("/login");
    }

    resetTokenTime(API: "mobile" | "administration" | "v3", id: number) {
        this.firebase.logEvent("reset_token_time_" + API);

        this.userManager.allUsers.forEach(u => {
            if (u.id == id) {
                u.resetTokenTime(API);
            }
        });
        this.prompt.toast(
            "Last token refresh time set to 0. Before the next request the user will get fresh tokens.",
            true
        );
    }

    isTokenTimeZero(API: "mobile" | "administration" | "v3", id: number) {
        let rVal = false;
        this.userManager.allUsers.forEach(u => {
            if (u.id == id) {
                rVal = u.isTokenTimeZero(API);
            }
        });
        return rVal;
    }

    deletePassword(userId: number) {
        this.userManager.allUsers.find(u => u.id == userId).removePassword();
        this.prompt.toast("Successfully removed password from your storage.", true);
    }

    async removeUser(userId) {
        this.firebase.logEvent("remove_user");

        let res = await this.userManager.removeUser(userId);
        if (res == "login") {
            this.router.navigateByUrl("login");
        }
    }
    async showUserInfo(userId: number) {
        this.userManager.switchToUser(userId);
        this.router.navigateByUrl("/user");
    }

    fuckUpSessionTokens(userId: number) {
        this.firebase.logEvent("nuke_session_tokens");

        //random refresh token
        this.userManager.allUsers[
            this.userManager.allUsers.findIndex(uid => uid.id == userId)
        ].v3Tokens.refresh_token = "nuked_token";

        this.prompt.toast(
            "Nuked (V3) refresh_token for current session. Restart the app to undo!",
            true
        );
    }
}
