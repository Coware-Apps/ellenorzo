import { Injectable } from "@angular/core";
import { AlertController, ToastController } from "@ionic/angular";
import { evaluation } from "../_models/kreta-v2/student";
import { Note } from "../_models/kreta-v3/note";
import { FormattedDateService } from "./formatted-date.service";
import { Lesson } from "../_models/kreta-v3/lesson";
import { TeacherHomework } from "../_models/kreta-v2/homework";
import { AppService } from "./app.service";
import { CommunityServiceData } from "../_models/kreta-v2/communityService";
import { TranslateService } from "@ngx-translate/core";
import { GlobalError } from "../_exceptions/global-exception";
import { stringify } from "querystring";
import { Institute } from "../_models/institute";
import { JwtDecodeHelper } from "../_helpers/jwt-decode-helper";
import { ThemeService } from "./theme.service";
import { Evaluation } from "../_models/kreta-v3/evaluation";
import { Absence } from "../_models/kreta-v3/absence";
import { Homework } from "../_models/kreta-v3/homework";

@Injectable({
    providedIn: "root",
})
export class PromptService {
    constructor(
        private alertCtrl: AlertController,
        private toastCtrl: ToastController,
        private fDate: FormattedDateService,
        private app: AppService,
        private t: TranslateService,
        private theme: ThemeService
    ) {}
    //#region complex prompts
    /**
     * Prompts the user to log in again, to unlock the web administration services
     * @param instituteName The name of the institute of the user (used only for displaying it)
     * @returns Promise that resolves to `true` if the user completed all the steps and to `false` if not.
     */
    async presentAdministrationLoginPrompt(instituteName: string) {
        let ok = false;
        const infoAlert = await this.alertCtrl.create({
            header: "Bejelentkezés",
            subHeader: "",
            message:
                "<h5>Miért kell újra bejelentkeznem?</h5>" +
                "Ez egy olyan funkció, amely nem a KRÉTA mobilalkalmazás szervereit használja, hanem a KRÉTA e-ügyintézéshez tartozókat. A v1.1.1 verzió előtt bejelentkezett felhasználóknak újból be kell lépniük, hogy az e-ügyintézés szolgáltatásaihoz hozzáférjenek. Ezt csak egyszer kell megcsinálni, ezt követően a rendszer automatikusan be tud léptetni." +
                "<br><h5>Milyen új funkciók állnak majd rendelkezésemre, ha bejelentkezek?</h5>" +
                "<ul>" +
                "<li>Üzenetekre válasz</li>" +
                "<li>Új üzenet írása</li>" +
                "<li>Csatolmány (kép, fájl stb.) küldése mobilról</li>" +
                "</ul>" +
                "<br><h5>A hivatalos alkalmazásban miért nincs ilyen funkció?</h5>" +
                "A hivatalos alkalmazás jelenleg csak a mobil szerverekkel tud kommunikálni. Ez azt jelenti, hogy abban az alkalmazásban nem lehet üzenetet írni és ilyen módon például beadandó munkát leadni. Az Arisztokréta azonban be tud jelentkeztetni az e-ügyintézés-be is, hogy annak teljes funkcionalitását a mobilodról is használhasd.",
            buttons: [
                {
                    text: "Később",
                    role: "cancel",
                    cssClass: "secondary",
                },
                {
                    text: "Tovább",
                    handler: () => {
                        ok = true;
                    },
                },
            ],
        });
        const loginAlert = await this.alertCtrl.create({
            header: "Bejelentkezés",
            subHeader: instituteName,
            inputs: [
                {
                    name: "username",
                    type: "text",
                    placeholder: "Felhasználónév",
                },
                {
                    name: "password",
                    type: "password",
                    placeholder: "Jelszó",
                },
            ],
            buttons: [
                {
                    text: "Mégse",
                    role: "cancel",
                    cssClass: "secondary",
                    handler: () => {
                        ok = false;
                    },
                },
                {
                    text: "Tovább",
                },
            ],
        });
        await infoAlert.present();
        await infoAlert.onDidDismiss();
        if (ok) {
            await loginAlert.present();
            let data = (await loginAlert.onDidDismiss()).data.values;
            if (ok) {
                return data;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
    async getTrueOrFalseWithText(
        header: string,
        subHeader: string,
        text: string,
        type: "cancel-exit" | "yes-no" = "cancel-exit"
    ) {
        let ok = false;
        const a = await this.alertCtrl.create({
            header: header,
            subHeader: subHeader,
            message: text,
            buttons: [
                {
                    text:
                        type == "cancel-exit"
                            ? this.t.instant("services.prompt.cancelBtnText")
                            : this.t.instant("services.prompt.noBtnText"),
                    role: "cancel",
                    cssClass: "secondary",
                    handler: () => {
                        return false;
                    },
                },
                {
                    text:
                        type == "cancel-exit"
                            ? this.t.instant("services.prompt.exitBtnText")
                            : this.t.instant("services.prompt.yesBtnText"),
                    cssClass: "danger",
                    handler: () => {
                        ok = true;
                    },
                },
            ],
        });
        await a.present();
        await a.onDidDismiss();
        if (ok) {
            return true;
        } else {
            return false;
        }
    }
    async redoLogin(instituteName: string, username: string, userFullName: string, role: string) {
        const key = "components.re-login.roles." + role;
        const finalRole = this.t.instant(key) != key ? this.t.instant(key) : role;

        const loginAlert = await this.alertCtrl.create({
            header: this.t.instant("services.prompt.redoLogin.alertHeader"),
            message:
                this.t.instant("services.prompt.redoLogin.alertTextStart") +
                " " +
                userFullName +
                ` (${finalRole}) ` +
                this.t.instant("services.prompt.redoLogin.alertTextEnd"),
            inputs: [
                {
                    name: "username",
                    type: "text",
                    placeholder: this.t.instant("services.prompt.redoLogin.usernameLabel"),
                    value: username,
                },
                {
                    name: "password",
                    type: "password",
                    placeholder: this.t.instant("services.prompt.redoLogin.passwordLabel"),
                },
                {
                    name: "instituteName",
                    type: "text",
                    placeholder: this.t.instant("services.prompt.redoLogin.instituteLabel"),
                    value: instituteName,
                    disabled: true,
                },
            ],
            buttons: [
                {
                    text: "OK",
                },
            ],
        });

        await loginAlert.present();

        const res = await loginAlert.onDidDismiss();

        const data = res && res.data ? res.data.values : null;

        return data;
    }
    async redoLoginDialog(
        instituteName: string,
        username: string,
        userFullName: string,
        role: string
    ) {
        await this.dismissTopToast();
        let confirm = false;
        let t = await this.toastCtrl.create({
            message: this.t.instant("services.prompt.redoLogin.toastText"),
            duration: 5000,
            buttons: [
                {
                    text: this.t.instant("services.prompt.redoLogin.solveBtnText"),
                    handler: () => {
                        confirm = true;
                    },
                },
            ],
        });

        await t.present();
        await t.onDidDismiss();

        if (confirm) {
            return this.redoLogin(instituteName, username, userFullName, role);
        }
    }
    //#endregion

    //#region alerts
    public presentUniversalAlert(header: string, subHeader: string, message: string) {
        this.presentAlert(header, subHeader, message, this.theme.getPopUpClass());
    }
    presentUniversalErrorAlert(error: GlobalError | any) {
        let toFormat: { title: string; text: string }[] = [];

        if (error.queryName) toFormat.push({ title: "Source", text: error.queryName });
        if (error.httpErrorObject && typeof error.httpErrorObject == "object") {
            let keys = Object.keys(error.httpErrorObject);
            if (keys.length == 0) keys = Object.getOwnPropertyNames(error.httpErrorObject);

            keys.forEach(k => {
                toFormat.push({
                    title: this.stringify(k),
                    text: this.stringify(error.httpErrorObject[k]),
                });
            });
        }

        this.presentAlert(
            error.customTitleTranslatorKey
                ? this.t.instant(error.customTitleTranslatorKey)
                : "Error",
            error.customTextTranslatorKey ? this.t.instant(error.customTextTranslatorKey) : null,
            this.formatAlertBody(toFormat),
            this.theme.getPopUpClass()
        );
    }
    public missingTextAlert(text: string) {
        this.presentAlert(
            this.t.instant("services.prompt.wrongText"),
            null,
            text,
            this.theme.getPopUpClass()
        );
    }
    public evaluationAlert(evaluation: evaluation) {
        let formattedDate = this.fDate.formatDateWithZerosAndDots(new Date(evaluation.Date));
        let time =
            this.fDate.formatDateWithZerosAndDots(evaluation.CreatingTime) +
            " " +
            new Date(evaluation.CreatingTime).getHours() +
            ":" +
            new Date(evaluation.CreatingTime).getMinutes();

        let body = this.formatAlertBody([
            {
                title: this.t.instant("services.prompt.evaluationAlert.dateName"),
                text: formattedDate,
            },
            {
                title: this.t.instant("services.prompt.evaluationAlert.creatingTimeName"),
                text: time,
            },
            {
                title: this.t.instant("services.prompt.evaluationAlert.modeName"),
                text: evaluation.Mode,
            },
            {
                title: this.t.instant("services.prompt.evaluationAlert.formName"),
                text: evaluation.FormName,
            },
        ]);

        if (evaluation.Form == "Mark") {
            this.presentAlert(
                evaluation.NumberValue + " - " + evaluation.Subject + ": " + evaluation.Theme,
                evaluation.Weight,
                body,
                this.theme.getPopUpClass()
            );
        } else {
            //Form == 'Percent' || Form == 'Text' || Form == 'Deportment' || Form == 'Diligence'
            this.presentAlert(
                evaluation.Subject,
                evaluation.Teacher,
                body +
                    (evaluation.Form == "Text"
                        ? `<br><strong>${this.t.instant(
                              "services.prompt.evaluationAlert.contentName"
                          )}:</strong><br>${evaluation.Value}`
                        : ""),
                this.theme.getPopUpClass()
            );
        }
    }
    public teacherHomeworkAlert(teacherHomework: TeacherHomework, subject: string) {
        this.presentAlert(
            teacherHomework.Rogzito,
            subject,
            `<ul>` +
                `<li>${this.t.instant("services.prompt.teacherHomeworkAlert.lessonCountName")}: ${
                    teacherHomework.Oraszam
                }</li>` +
                `<li>${this.t.instant(
                    "services.prompt.teacherHomeworkAlert.teacherLoggedItName"
                )} ${teacherHomework.IsTanarRogzitette == true ? "igen" : "nem"}</li>` +
                `<li>${this.t.instant(
                    "services.prompt.teacherHomeworkAlert.assignmentDateName"
                )}: ${teacherHomework.FeladasDatuma.substring(0, 10)}</li>` +
                `<li>${this.t.instant(
                    "services.prompt.teacherHomeworkAlert.deadlineName"
                )}: ${teacherHomework.Hatarido.substring(0, 10)}</li>` +
                `</ul>`,
            this.theme.getPopUpClass()
        );
    }
    public gradeAlert(grade: any) {
        let formattedDate = this.fDate.formatDateWithZerosAndDots(new Date(grade.Date));

        let body = this.formatAlertBody([
            { title: this.t.instant("services.prompt.gradeAlert.dateName"), text: formattedDate },
            { title: this.t.instant("services.prompt.gradeAlert.typeName"), text: grade.Mode },
            { title: this.t.instant("services.prompt.gradeAlert.formName"), text: grade.FormName },
        ]);
        this.presentAlert(
            grade.grade + this.themeIf(grade.Theme),
            grade.weight,
            body,
            this.theme.getPopUpClass()
        );
    }
    public notificationAlert(title: string, content: string) {
        this.presentAlert(title, null, content, this.theme.getPopUpClass());
    }
    public communityServiceAlert(comServiceDataItem: CommunityServiceData) {
        let note = comServiceDataItem.Megjegyzes == null ? "-" : comServiceDataItem.Megjegyzes;
        this.presentAlert(
            comServiceDataItem.KozossegiSzolgalatTipusa_DNAME,
            `${comServiceDataItem.Oraszam} óra`,
            `<ul>` +
                `<li>${this.t.instant(
                    "services.prompt.communityServiceAlert.beginName"
                )}: ${this.fDate.formatDateWithZerosAndDots(
                    comServiceDataItem.IntervallumKezdete
                )}</li>` +
                `<li>${this.t.instant(
                    "services.prompt.communityServiceAlert.finishName"
                )}: ${this.fDate.formatDateWithZerosAndDots(
                    comServiceDataItem.IntervallumVege
                )}</li>` +
                `<li>${this.t.instant("services.prompt.communityServiceAlert.instituteTagName")}: ${
                    comServiceDataItem.TeljesitesiHelye
                }</li>` +
                `<li>${this.t.instant(
                    "services.prompt.communityServiceAlert.loggingTimeName"
                )}: ${this.fDate.formatDateWithZerosAndDots(
                    comServiceDataItem.RogzitesDatuma
                )}</li></ul>` +
                `${this.t.instant("services.prompt.communityServiceAlert.noteName")}: ${note}`,
            this.theme.getPopUpClass()
        );
    }
    private formatAlertBody(params: { title: string; text: string }[]) {
        let returnVal: string = "";
        for (let i = 0; i < params.length; i++) {
            if (i == 0) {
                returnVal += `<strong>${params[i].title}:</strong><br>${params[i].text}`;
            } else {
                returnVal += `<br><strong>${params[i].title}:</strong><br>${params[i].text}`;
            }
        }
        return returnVal;
    }
    //#endregion

    //#region v3
    public evaluationV3Alert(evaluation: Evaluation) {
        let formattedDate = this.fDate.formatDateWithZerosAndDots(
            new Date(evaluation.KeszitesDatuma)
        );
        let time =
            this.fDate.formatDateWithZerosAndDots(evaluation.KeszitesDatuma) +
            " " +
            new Date(evaluation.KeszitesDatuma).getHours() +
            ":" +
            new Date(evaluation.KeszitesDatuma).getMinutes();

        let body = this.formatAlertBody([
            {
                title: this.t.instant("services.prompt.evaluationAlert.dateName"),
                text: formattedDate,
            },
            {
                title: this.t.instant("services.prompt.evaluationAlert.creatingTimeName"),
                text: time,
            },
            {
                title: this.t.instant("services.prompt.evaluationAlert.modeName"),
                text: evaluation.Mod?.Leiras,
            },
            {
                title: this.t.instant("services.prompt.evaluationAlert.formName"),
                text: evaluation.ErtekFajta?.Leiras,
            },
        ]);

        if (evaluation.ErtekFajta.Nev == "Osztalyzat") {
            this.presentAlert(
                evaluation.SzamErtek +
                    " - " +
                    evaluation.Tantargy.Nev +
                    this.themeIf(evaluation.Tema),
                null,
                body,
                this.theme.getPopUpClass()
            );
        } else {
            //Form == 'Percent' || Form == 'Text' || Form == 'Deportment' || Form == 'Diligence'
            this.presentAlert(
                evaluation.Tantargy.Nev,
                evaluation.ErtekeloTanarNeve,
                body +
                    (evaluation.ErtekFajta.Nev == "Szoveges"
                        ? `<br><strong>${this.t.instant(
                              "services.prompt.evaluationAlert.contentName"
                          )}:</strong><br>${evaluation.SzovegesErtek}`
                        : ""),
                this.theme.getPopUpClass()
            );
        }
    }
    public lessonV3Alert(lesson: Lesson) {
        let bodyBase = [
            {
                title: this.t.instant("services.prompt.lessonAlert.timeName"),
                text: this.getTime(new Date(lesson.KezdetIdopont), new Date(lesson.VegIdopont)),
            },
            {
                title: this.t.instant("services.prompt.lessonAlert.groupName"),
                text: lesson.OsztalyCsoport?.Nev,
            },
            {
                title: this.t.instant("services.prompt.lessonAlert.classRoomName"),
                text: lesson.TeremNeve,
            },
        ];
        if (lesson.Tema) {
            bodyBase.push({
                title: this.t.instant("services.prompt.lessonAlert.topicName"),
                text: lesson.Tema,
            });
        }
        this.presentAlert(
            lesson.Tantargy?.Nev,
            lesson.TanarNeve,
            this.formatAlertBody(bodyBase),
            this.theme.getPopUpClass()
        );
    }
    public absenceV3Alert(absence: Absence) {
        const tKey = absence.Tipus?.Nev == "hianyzas" ? "AbsenceName" : "DelayName";

        let justificationTypeName =
            absence.IgazolasAllapota != "Igazolatlan"
                ? `<br><strong>${this.t.instant(
                      "services.prompt.absenceAlert.justificationTypeName"
                  )}:</strong><br> ${absence.IgazolasTipusa?.Leiras}</li>`
                : "";
        let body = this.formatAlertBody([
            {
                title: this.t.instant("services.prompt.absenceAlert.dateName"),
                text: this.fDate.formatDateWithZerosAndDots(absence.KeszitesDatuma),
            },
            {
                title: this.t.instant("services.prompt.absenceAlert.stateName"),
                text: absence.IgazolasAllapota,
            },
            {
                title: this.t.instant("services.prompt.absenceAlert.modeName"),
                text: absence.Mod?.Leiras,
            },
        ]);
        this.presentAlert(
            this.t.instant(`components.absence.${tKey}`) + ` (` + absence.Tantargy.Nev + `)`,
            absence.RogzitoTanarNeve,
            body + justificationTypeName,
            this.theme.getPopUpClass()
        );
    }
    public homeworkV3Alert(homework: Homework) {
        let body = this.formatAlertBody([
            {
                title: this.t.instant("services.prompt.homeworkV3Alert.date"),
                text: this.fDate.formatDateWithZerosAndDots(homework.FeladasDatuma),
            },
            {
                title: this.t.instant("services.prompt.homeworkV3Alert.loggingDate"),
                text: this.fDate.formatDateWithZerosAndDots(homework.RogzitesIdopontja),
            },
            {
                title: this.t.instant("services.prompt.homeworkV3Alert.isSolved"),
                text: homework.IsMegoldva
                    ? this.t.instant("services.prompt.homeworkV3Alert.solvedName")
                    : this.t.instant("services.prompt.homeworkV3Alert.unsolvedName"),
            },
            {
                title: this.t.instant("services.prompt.homeworkV3Alert.text"),
                text: homework.Szoveg,
            },
        ]);
        this.presentAlert(
            this.t.instant(`services.prompt.homeworkV3Alert.homeworkName`) +
                ` (` +
                homework.TantargyNeve +
                `)`,
            homework.RogzitoTanarNeve,
            body,
            this.theme.getPopUpClass()
        );
    }
    public noteV3Alert(note: Note) {
        let seen =
            note.LattamozasDatuma == null
                ? `nem`
                : new Date(note.LattamozasDatuma).toLocaleDateString();
        let body = this.formatAlertBody([
            {
                title: this.t.instant("services.prompt.noteAlert.typeName"),
                text: note.Tipus?.Leiras,
            },
            {
                title: this.t.instant("services.prompt.noteAlert.creatingTimeName"),
                text: new Date(note.KeszitesDatuma).toLocaleDateString(),
            },
            { title: this.t.instant("services.prompt.noteAlert.seenByTutelaryName"), text: seen },
            { title: this.t.instant("services.prompt.noteAlert.contentName"), text: note.Tartalom },
        ]);
        this.presentAlert(note.Cim, note.KeszitoTanarNeve, body, this.theme.getPopUpClass());
    }
    //#endregion

    //#region toasts
    public errorToast(errorText: string) {
        this.presentToast(errorText, true);
    }
    public async errorDetailToast(error: GlobalError) {
        const toast = await this.toastCtrl.create({
            message: this.t.instant(error.customTitleTranslatorKey),
            position: "bottom",
            duration: 10000,
            buttons: [
                {
                    text: this.t.instant("services.prompt.moreBtnText"),
                    handler: () => {
                        this.presentUniversalErrorAlert(error);
                    },
                },
                {
                    text: "OK",
                    role: "cancel",
                },
            ],
        });
        toast.present();
    }
    public async fileOpenErrorToast(header: string, message: string, fileError: any) {
        let errorText =
            fileError instanceof Object
                ? this.getKeys(fileError)
                      .map(k => stringify(fileError[k]))
                      .join("||")
                : this.stringify(fileError);
        const toast = await this.toastCtrl.create({
            message: message,
            header: header,
            position: "bottom",
            duration: 10000,
            buttons: [
                {
                    text: this.t.instant("services.prompt.moreBtnText"),
                    handler: () => {
                        this.presentUniversalErrorAlert(errorText);
                    },
                },
            ],
        });
        toast.present();
    }
    getKeys(o: any) {
        let keys = Object.keys(o);
        if (keys.length == 0) keys = Object.getOwnPropertyNames(o);
        return keys;
    }
    public async showDetailedToast(header: string, message: string, duration: number = 10000) {
        let t = await this.toastCtrl.create({
            header: header,
            message: message,
            duration: duration,
            buttons: [
                {
                    role: "cancel",
                    text: "OK",
                },
            ],
        });
        await t.present();
    }
    public async administrationLoginExpiredToast() {
        let loginAct = false;
        let t = await this.toastCtrl.create({
            header: this.t.instant("services.prompt.administrationLoginExpired.title"),
            message: this.t.instant("services.prompt.administrationLoginExpired.text"),
            duration: 3000,
            buttons: [
                {
                    text: this.t.instant("services.prompt.administrationLoginExpired.loginBtnText"),
                    handler: () => {
                        loginAct = true;
                    },
                },
            ],
        });

        await this.dismissTopToast();
        await t.present();
        await t.onWillDismiss();
        return loginAct;
    }
    public butteredToast(butter: string) {
        //sorry, couldn't resist (only shows a toast message if the app.service->toastLogging is set to true)
        if (this.app.toastLoggingEnabled) {
            this.presentToast(butter, false);
        }
    }
    public notificationToast(title: string, body: string, autoHide: boolean) {
        this.presentToast(title + ": " + body, autoHide);
    }
    public toast(message: string, autoDismiss: boolean) {
        this.presentToast(message, autoDismiss);
    }
    public topToast(message: string, autoDismiss: boolean) {
        this.presentToast(message, autoDismiss, `top`);
    }
    public async timedToast(message: string, duration: number) {
        await this.dismissTopToast();
        let t = await this.toastCtrl.create({
            duration: duration,
            message: message,
        });
        return t.present();
    }
    public async dismissTopToast() {
        let topToast = await this.toastCtrl.getTop();
        console.log("topToast", topToast);
        if (topToast) {
            topToast.dismiss();
        }
    }
    //#endregion

    //#region helpers
    private async presentAlert(header: string, subHeader: string, message: string, css: string) {
        const alert = await this.alertCtrl.create({
            cssClass: css,
            header: header,
            subHeader: subHeader,
            message: message,
            buttons: ["OK"],
        });
        await alert.present();
    }
    private async presentToast(
        message: string,
        autoDismiss: boolean,
        position: `bottom` | `middle` | `top` = `bottom`
    ) {
        let topToast = await this.toastCtrl.getTop();
        if (topToast != null) {
            this.toastCtrl.dismiss();
        }
        const toast = await this.toastCtrl.create({
            message: message,
            duration: autoDismiss ? 10000 : 0,
            cssClass: this.theme.getToastClass(),
            buttons: [
                {
                    text: "OK",
                    role: "cancel",
                },
            ],
            position: position,
        });
        toast.present();
    }
    private async dismissToast(id: string) {
        this.toastCtrl.dismiss(id);
    }
    private themeIf(theme: string) {
        if (theme == null || theme == ``) {
            return ``;
        } else {
            return `: ` + theme;
        }
    }
    private getTime(StartTime: Date, EndTime: Date) {
        let start = new Date(StartTime);
        let end = new Date(EndTime);
        return (
            start.getHours() +
            `:` +
            (start.getMinutes() >= 10 ? start.getMinutes() : `0` + start.getMinutes()) +
            `-` +
            end.getHours() +
            `:` +
            (end.getMinutes() >= 10 ? end.getMinutes() : `0` + end.getMinutes())
        );
    }
    private stringify(a) {
        if (a instanceof Object) {
            return stringify(a);
        } else if (typeof a === "string") {
            return a;
        } else if (typeof a == "number") {
            return a.toString();
        }
    }
    //#endregion
}
