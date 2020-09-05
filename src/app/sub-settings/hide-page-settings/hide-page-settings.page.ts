import { Component, OnInit } from "@angular/core";
import { Storage } from "@ionic/storage";
import { AppService } from "src/app/_services/app.service";
import { PromptService } from "src/app/_services/prompt.service";
import { TranslateService } from "@ngx-translate/core";
import { FirebaseService } from "src/app/_services/firebase.service";

@Component({
    selector: "app-hide-page-settings",
    templateUrl: "./hide-page-settings.page.html",
    styleUrls: ["./hide-page-settings.page.scss"],
})
export class HidePageSettingsPage implements OnInit {
    public appPages: {
        title: string;
        url: string;
        icon: string;
        show: boolean;
        translatorVal?: string;
    }[];
    public loaded = false;

    constructor(
        public app: AppService,
        private storage: Storage,
        private firebase: FirebaseService,
        private prompt: PromptService,
        private translator: TranslateService
    ) {}

    ngOnInit() {
        this.firebase.setScreenName("hide-page-settings");
    }

    async ionViewWillEnter() {
        this.appPages = this.app.appPages;
        let storedPages = await this.storage.get("sidemenu");
        console.time("loops");
        if (storedPages != null) {
            for (let i = 0; i < storedPages.length; i++) {
                for (let j = 0; j < this.appPages.length; j++) {
                    if (storedPages[i].url == this.appPages[j].url) {
                        this.appPages[j].show = storedPages[i].show;
                    }
                }
            }
        }
        console.timeEnd("loops");
        console.log("pages", this.appPages);
        this.loaded = true;
    }

    async ionViewWillLeave() {
        this.storage.set("sidemenu", this.app.appPages);
        this.app.updateConfig();
    }

    async show(pageUrl: string) {
        await this.app.showPage(pageUrl);
        this.appPages = this.app.appPages;
        this.firebase.logEvent("show_page", pageUrl);
    }

    async hide(pageUrl: string) {
        await this.app.hidePage(pageUrl);
        this.appPages = this.app.appPages;
        this.firebase.logEvent("hide_page", pageUrl);
    }

    showHideInfo() {
        this.prompt.presentUniversalAlert(
            this.translator.instant("pages.hide-page-settings.hideInfo.header"),
            null,
            this.translator.instant("pages.hide-page-settings.hideInfo.message")
        );
    }
}
