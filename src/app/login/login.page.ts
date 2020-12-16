import { Component, OnInit } from "@angular/core";
import { Storage } from "@ionic/storage";
import {
    AlertController,
    ModalController,
    MenuController,
    LoadingController,
} from "@ionic/angular";
import { InstituteSelectorModalPage } from "./institute-selector-modal/institute-selector-modal.page";
import { KretaService } from "../_services/kreta.service";
import { Router } from "@angular/router";
import { DataService } from "../_services/data.service";
import { UserManagerService } from "../_services/user-manager.service";
import { AppService } from "../_services/app.service";
import { PromptService } from "../_services/prompt.service";
import { TranslateService } from "@ngx-translate/core";
import { GlobalError } from "../_exceptions/global-exception";
import { KretaError, KretaRenewTokenError } from "../_exceptions/kreta-exception";
import { ThemeService } from "../_services/theme.service";
import { JwtDecodeHelper } from "../_helpers/jwt-decode-helper";
import { FirebaseService } from "../_services/firebase.service";
import { Market } from "@ionic-native/market/ngx";
import { KretaV3Service } from "../_services";
import { KretaV3InvalidGrantError } from '../_exceptions/kreta-v3-exception';

@Component({
    selector: "app-login",
    templateUrl: "./login.page.html",
    styleUrls: ["./login.page.scss"],
})
export class LoginPage implements OnInit {
    public user: string = null;
    public pass: string = null;
    public instituteName: string;
    public kretaError: KretaError;

    constructor(
        public modalCtrl: ModalController,
        public alertCtrl: AlertController,
        public storage: Storage,
        public userManager: UserManagerService,
        public router: Router,

        private kretaV3: KretaV3Service,
        private data: DataService,
        private menuCtrl: MenuController,
        private loadingCtrl: LoadingController,
        private app: AppService,
        private prompt: PromptService,
        private translator: TranslateService,
        private theme: ThemeService,
        private jwtHelper: JwtDecodeHelper,
        private firebase: FirebaseService,
        private market: Market
    ) {}

    ngOnInit() {}

    ionViewWillEnter() {
        this.menuCtrl.enable(false);

        if (this.userManager.allUsers.length == 0) this.theme.styleStatusBarToBlend();

        this.pass = null;
        this.user = null;
        this.instituteName = null;
    }

    ionViewWillLeave() {
        this.theme.styleStatusBarToTheme();
        this.menuCtrl.enable(true);
    }

    async login() {
        if (!this.user || !this.pass || !this.instituteName) {
            this.presentAlert(
                this.translator.instant("pages.login.insufficientDataAlert.header"),
                this.translator.instant("pages.login.insufficientDataAlert.message")
            );
        } else {
            let loading = await this.loadingCtrl.create({
                spinner: "crescent",
                message: this.translator.instant("pages.login.loadingText"),
                animated: true,
            });
            await loading.present();
            await this.storage.set("username", this.user);

            try {
                let tokenResult = await this.kretaV3.getToken(
                    this.user,
                    this.pass,
                    this.data.getData("institute")
                );

                try {
                    let DT = this.jwtHelper.decodeToken(tokenResult.access_token);

                    if (DT.role != "Tanulo" && DT.role != "Szulo") {
                        this.firebase.logEvent("login_invalid_role");
                    }

                    console.log("decoded token", DT);
                } catch (decodeError) {
                    console.error("Error trying to decode access_token");
                }

                if (
                    await this.userManager.addUser(
                        tokenResult,
                        this.data.getData("institute"),
                        this.user,
                        this.pass
                    )
                ) {
                    //the user doesn't exist
                    await this.menuCtrl.enable(true);
                    await loading.dismiss();
                    this.app.isStudentSelectorReady = true;

                    loading.dismiss();

                    this.firebase.logEvent("add_user");
                    this.kretaError = null;
                    await this.router.navigateByUrl("home");
                } else {
                    //the user already exists
                    this.prompt.presentUniversalAlert(
                        this.translator.instant("pages.login.userAlreadyExistsAlert.header"),
                        this.translator.instant("pages.login.userAlreadyExistsAlert.subHeader"),
                        this.translator.instant("pages.login.userAlreadyExistsAlert.message")
                    ); 
                    await loading.dismiss();
                }
            } catch (error) {
                this.kretaError = error;

                if(error instanceof KretaRenewTokenError) {
                    this.prompt.toast(this.translator.instant('pages.login.invalidGrant.message'), true);
                }

                error.isHandled = true;
            } finally {
                loading.dismiss();
            }
        }
    }

    async getInstitute() {
        const modal = await this.modalCtrl.create({
            component: InstituteSelectorModalPage,
        });
        await modal.present();

        this.theme.styleStatusBarToTheme();
        const { data } = await modal.onWillDismiss();
        if (data && data.selectedInstitute) this.instituteName = data.selectedInstitute.name;
        if (this.userManager.allUsers.length == 0) this.theme.styleStatusBarToBlend();
    }

    getErrorInfo() {
        this.data.setData("loginError", this.kretaError);
        this.router.navigateByUrl("login/error?errorDataKey=loginError");
    }

    openNaplo() {
        this.firebase.logEvent("open_naplo_login");
        this.market.open("hu.coware.naplo");
    }

    private async presentAlert(header: string, message: string) {
        const alert = await this.alertCtrl.create({
            header: header,
            message: message,
            buttons: ["OK"],
        });

        await alert.present();
    }
}
