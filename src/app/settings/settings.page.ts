import { Component, OnInit } from "@angular/core";
import { ThemeService } from "../_services/theme.service";
import { Storage } from "@ionic/storage";
import { Camera, CameraOptions } from "@ionic-native/camera/ngx";
import { LoadingController, MenuController, Platform } from "@ionic/angular";
import { Router } from "@angular/router";
import { AppService } from "../_services/app.service";
import { PromptService } from "../_services/prompt.service";
import { UserManagerService } from "../_services/user-manager.service";
import { TranslateService } from "@ngx-translate/core";
import { Subject } from "rxjs";
import { HwBackButtonService } from "../_services/hw-back-button.service";
import { FirebaseService } from "../_services/firebase.service";
import { Market } from "@ionic-native/market/ngx";
@Component({
    selector: "app-settings",
    templateUrl: "./settings.page.html",
    styleUrls: ["./settings.page.scss"],
})
export class SettingsPage implements OnInit {
    customAlertOptions: any = {
        header: this.translator.instant("pages.settings.pages.startingPageName"),
        cssClass: this.theme.getPopUpClass(),
    };
    customPopoverOptions: any = {
        cssClass: this.theme.getPopUpClass(),
    };

    public currentTheme: string;
    public defaultPage: string;
    public appV: string;
    public appPages: {
        title: string;
        url: string;
        icon: string;
        show: boolean;
        translatorVal?: string;
    }[];
    private devCounter: number;

    public unsubscribe$: Subject<void>;

    constructor(
        public app: AppService,

        private hw: HwBackButtonService,
        private theme: ThemeService,
        private storage: Storage,
        private camera: Camera,
        private router: Router,
        private firebase: FirebaseService,
        private prompt: PromptService,
        private menuCtrl: MenuController,
        private translator: TranslateService,
        private userManager: UserManagerService,
        private loadingCtrl: LoadingController,
        private market: Market,
        private plt: Platform
    ) {
        this.appPages = this.app.appPages;
    }

    async ngOnInit() {
        this.currentTheme = this.theme.currentTheme.value;

        //#region default page
        let a = await this.storage.get("defaultPage");
        if (a == null) {
            this.defaultPage = "/home";
        } else {
            this.defaultPage = a;
        }
        //#endregion
        this.devCounter = this.app.devSettingsEnabled ? 9 : 0;

        this.appV = await this.app.getAppVersion();

        this.firebase.setScreenName("settings");
    }

    async ionViewWillEnter() {
        this.unsubscribe$ = new Subject();
        this.hw.registerHwBackButton(this.unsubscribe$);
        this.menuCtrl.enable(true);
    }

    ionViewWillLeave() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    //#region themes
    enableDark() {
        this.theme.enableDark();
        this.currentTheme = "dark";
        this.storage.set("theme", "dark");
        this.firebase.logEvent("change_theme", "dark");
    }

    enableMinimalDark() {
        this.theme.enableMinimalDark();
        this.currentTheme = "minimalDark";
        this.storage.set("theme", "minimalDark");
        this.firebase.logEvent("change_theme", "amoled");
    }

    enableLight() {
        this.theme.enableLight();
        this.currentTheme = "light";
        this.storage.set("theme", "light");
        this.firebase.logEvent("change_theme", "light");
    }

    enableCustom() {
        this.theme.enableCustom();
        this.currentTheme = "custom";
        this.storage.set("theme", "custom");
        this.firebase.logEvent("change_theme", "custom");
    }
    //#endregion

    //#region starting pages
    selectorChanged(event: any) {
        this.firebase.logEvent("change_starting_page", event.detail.value);
        this.setDefaultPage(event.detail.value);
    }

    setDefaultPage(pagePath: string) {
        this.storage.set("defaultPage", pagePath);
    }
    //#endregion

    hidePages() {
        this.router.navigateByUrl("/hide-page-settings");
    }

    async currentLngChanged(event) {
        this.app.currentLng = event.detail.value;
        this.firebase.logEvent("change_language", event.detail.value);

        if (this.app.localNotificationsEnabled) {
            this.userManager.allUsers.forEach(async user => {
                if (user.notificationsEnabled) {
                    let loading = await this.loadingCtrl.create({
                        spinner: "crescent",
                        message: this.translator.instant(
                            "pages.notification-settings.operationInProgressText"
                        ),
                    });
                    try {
                        loading.present();
                        await user.setLocalNotifications(2);
                    } catch (error) {
                        this.prompt.toast("Unable to change notification language", true);
                    }
                    loading.dismiss();
                }
            });
        }
    }

    async getImage() {
        this.firebase.logEvent("set_custom_image");

        this.enableCustom();
        const options: CameraOptions = {
            quality: 100,
            destinationType: this.camera.DestinationType.DATA_URL,
            sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
            encodingType: this.camera.EncodingType.JPEG,
            saveToPhotoAlbum: false,
            allowEdit: true,
        };

        this.camera.getPicture(options).then(
            async imageData => {
                this.theme.changeBackground(imageData);
                //popup message
                await this.prompt.presentUniversalAlert(
                    this.translator.instant("pages.settings.themes.customBgAlert.header"),
                    null,
                    this.translator.instant("pages.settings.themes.customBgAlert.message")
                );
            },
            async err => {
                await this.prompt.presentUniversalAlert(
                    this.translator.instant("pages.settings.themes.customBgErrorAlert.header"),
                    null,
                    this.translator.instant("pages.settings.themes.customBgErrorAlert.message") +
                        " (" +
                        err +
                        ")"
                );
                //error
            }
        );
    }

    openBgSettings() {
        this.router.navigateByUrl("/bg-settings");
    }

    async showPicker() {
        this.router.navigateByUrl("/color-picker?from=settings");
    }

    async analyticsChanged(event: any) {
        this.firebase.logEvent("change_analytics", event.detail.value);

        await this.app.changeConfig("analyticsCollectionEnabled", event.detail.checked);
        if (event.detail.checked) this.firebase.isAnalyticsEnabled = true;
    }

    async toastLoggingChanged(event: any) {
        await this.app.changeConfig("toastLoggingEnabled", event.detail.checked);
    }

    openUserSettings() {
        this.router.navigateByUrl("user-settings");
    }

    openNotificationSettings() {
        this.router.navigateByUrl("notification-settings");
    }

    openHomeSettings() {
        this.router.navigateByUrl("home-settings");
    }

    async versionClicked() {
        this.devCounter++;

        if (this.devCounter >= 7 && 10 > this.devCounter) {
            this.prompt.topToast(
                10 -
                    this.devCounter +
                    " " +
                    this.translator.instant("pages.settings.devSettings.devSettingsEnablingText"),
                true
            );
        } else if (this.devCounter == 10) {
            this.app.changeConfig("devSettingsEnabled", true);
            this.prompt.topToast(
                this.translator.instant("pages.settings.devSettings.devSettingsEnabledText"),
                true
            );
            this.firebase.logEvent("enable_dev_settings");
        }
    }

    customUAClicked() {
        this.router.navigate(["user-agent"]);
    }

    openNaplo() {
        this.firebase.logEvent("open_naplo_settings");
        this.market.open("hu.coware.naplo");
    }

    getStoreIcon() {
        return this.plt.is("ios") ? "logo-apple-appstore" : "logo-google-playstore";
    }
}
