import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { ColorService } from './color.service';
import { evaluation, Absence, Note } from '../_models/student';
import { FormattedDateService } from './formatted-date.service';
import { Lesson } from '../_models/lesson';
import { TeacherHomework } from '../_models/homework';
import { AppService } from './app.service';
import { CommunityServiceData } from '../_models/communityService';
import { TranslateService } from '@ngx-translate/core';
import { GlobalError } from '../_exceptions/global-exception';
import { stringify } from 'querystring';

@Injectable({
  providedIn: 'root'
})
export class PromptService {

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private color: ColorService,
    private fDate: FormattedDateService,
    private app: AppService,
    private t: TranslateService,
  ) {

  }
  //#region complex prompts
  /**
   * Prompts the user to log in again, to unlock the web administration services
   * @param instituteName The name of the institute of the user (used only for displaying it)
   * @returns Promise that resolves to `true` if the user completed all the steps and to `false` if not.
   */
  async presentAdministrationLoginPrompt(instituteName: string) {
    let ok = false;
    const infoAlert = await this.alertCtrl.create({
      header: 'Bejelentkezés',
      subHeader: '',
      message: '<h5>Miért kell újra bejelentkeznem?</h5>' +
        'Ez egy olyan funkció, amely nem a KRÉTA mobilalkalmazás szervereit használja, hanem a KRÉTA e-ügyintézéshez tartozókat. A v1.1.1 verzió előtt bejelentkezett felhasználóknak újból be kell lépniük, hogy az e-ügyintézés szolgáltatásaihoz hozzáférjenek. Ezt csak egyszer kell megcsinálni, ezt követően a rendszer automatikusan be tud léptetni.' +
        '<br><h5>Milyen új funkciók állnak majd rendelkezésemre, ha bejelentkezek?</h5>' +
        '<ul>' +
        '<li>Üzenetekre válasz</li>' +
        '<li>Új üzenet írása</li>' +
        '<li>Csatolmány (kép, fájl stb.) küldése mobilról</li>' +
        '</ul>' +
        '<br><h5>A hivatalos alkalmazásban miért nincs ilyen funkció?</h5>' +
        'A hivatalos alkalmazás jelenleg csak a mobil szerverekkel tud kommunikálni. Ez azt jelenti, hogy abban az alkalmazásban nem lehet üzenetet írni és ilyen módon például beadandó munkát leadni. Az Arisztokréta azonban be tud jelentkeztetni az e-ügyintézés-be is, hogy annak teljes funkcionalitását a mobilodról is használhasd.',
      buttons: [
        {
          text: 'Később',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Tovább',
          handler: () => {
            ok = true;
          }
        }
      ]
    });
    const loginAlert = await this.alertCtrl.create({
      header: 'Bejelentkezés',
      subHeader: instituteName,
      inputs: [
        {
          name: 'username',
          type: 'text',
          placeholder: 'Felhasználónév'
        },
        {
          name: 'password',
          type: 'password',
          placeholder: 'Jelszó'
        },
      ],
      buttons: [
        {
          text: 'Mégse',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            ok = false;
          }
        }, {
          text: 'Tovább',
        }
      ]
    });
    await infoAlert.present();
    await infoAlert.onDidDismiss();
    if (ok) {
      await loginAlert.present();
      let data = (await (loginAlert.onDidDismiss())).data.values;
      if (ok) {
        return data;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  async getTrueOrFalseWithText(header: string, subHeader: string, text: string, type: "cancel-exit" | "yes-no" = "cancel-exit") {
    let ok = false;
    const a = await this.alertCtrl.create({
      header: header,
      subHeader: subHeader,
      message: text,
      buttons: [
        {
          text: type == "cancel-exit" ? this.t.instant('services.prompt.cancelBtnText') : this.t.instant('services.prompt.noBtnText'),
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            return false;
          }
        }, {
          text: type == "cancel-exit" ? this.t.instant('services.prompt.exitBtnText') : this.t.instant('services.prompt.yesBtnText'),
          cssClass: "danger",
          handler: () => {
            ok = true;
          }
        }
      ]
    });
    await a.present();
    await a.onDidDismiss();
    if (ok) {
      return true;
    } else {
      return false;
    }
  }

  //#endregion

  //#region alerts
  public presentUniversalAlert(header: string, subHeader: string, message: string) {
    this.presentAlert(header, subHeader, message, this.color.getPopUpClass());
  }
  presentUniversalErrorAlert(error: GlobalError | any) {
    let toFormat: { title: string, text: string }[] = [];

    if (error.queryName) toFormat.push({ title: "Source", text: error.queryName });
    if (error.httpErrorObject && typeof (error.httpErrorObject) == 'object') {

      let keys = Object.keys(error.httpErrorObject);
      if (keys.length == 0) keys = Object.getOwnPropertyNames(error.httpErrorObject);

      keys.forEach(k => {
        toFormat.push({ title: this.stringify(k), text: this.stringify(error.httpErrorObject[k]) })
      });
    }

    this.presentAlert(
      error.customTitleTranslatorKey ? this.t.instant(error.customTitleTranslatorKey) : "Error",
      error.customTextTranslatorKey ? this.t.instant(error.customTextTranslatorKey) : null,
      this.formatAlertBody(toFormat),
      this.color.getPopUpClass()
    )
  }
  public missingTextAlert(text: string) {
    this.presentAlert(
      this.t.instant('services.prompt.wrongText'),
      null,
      text,
      this.color.getPopUpClass()
    );
  }
  public evaluationAlert(evaluation: evaluation) {
    let formattedDate = this.fDate.formatDateWithZerosAndDots(new Date(evaluation.Date));
    let time = this.fDate.formatDateWithZerosAndDots(evaluation.CreatingTime) +
      ' ' +
      new Date(evaluation.CreatingTime).getHours() +
      ':' +
      new Date(evaluation.CreatingTime).getMinutes();

    let body = this.formatAlertBody([{
      title: this.t.instant('services.prompt.evaluationAlert.dateName'),
      text: formattedDate,
    },
    {
      title: this.t.instant('services.prompt.evaluationAlert.creatingTimeName'),
      text: time
    },
    {
      title: this.t.instant('services.prompt.evaluationAlert.modeName'),
      text: evaluation.Mode
    },
    {
      title: this.t.instant('services.prompt.evaluationAlert.formName'),
      text: evaluation.FormName
    },
    ]);

    if (evaluation.Form == 'Mark') {
      this.presentAlert(evaluation.NumberValue + ' - ' + evaluation.Subject + ': ' + evaluation.Theme, evaluation.Weight, body, this.color.getPopUpClass());
    } else {
      //Form == 'Percent' || Form == 'Text' || Form == 'Deportment' || Form == 'Diligence'
      this.presentAlert(
        evaluation.Subject,
        evaluation.Teacher,
        body +
        (evaluation.Form == 'Text' ? `<br><strong>${this.t.instant('services.prompt.evaluationAlert.contentName')}:</strong><br>${evaluation.Value}` : ''),
        this.color.getPopUpClass()
      );
    }
  }
  public absenceAlert(absence: Absence) {
    let seen = absence.SeenByTutelaryUTC == null ? `nem` : absence.SeenByTutelaryUTC;
    let justificationTypeName = absence.JustificationType != 'UnJustified' ? (`<br><strong>${this.t.instant('services.prompt.absenceAlert.justificationTypeName')}:</strong><br> ${absence.JustificationTypeName}</li>`) : '';

    let body = this.formatAlertBody([
      {
        title: this.t.instant('services.prompt.absenceAlert.dateName'),
        text: this.fDate.formatDateWithZerosAndDots(absence.LessonStartTime)
      },
      { title: this.t.instant('services.prompt.absenceAlert.stateName'), text: absence.JustificationStateName },
      { title: this.t.instant('services.prompt.absenceAlert.modeName'), text: absence.ModeName },
      { title: this.t.instant('services.prompt.absenceAlert.seenByTutelaryName'), text: seen },
    ]);
    this.presentAlert(
      this.t.instant(`components.absence.${absence.Type}Name`) + ` (` + absence.Subject + `)`,
      absence.Teacher,
      body +
      justificationTypeName,
      this.color.getPopUpClass(),
    );
  }
  public noteAlert(note: Note) {
    let seen = note.SeenByTutelaryUTC == null ? `nem` : note.SeenByTutelaryUTC.substring(0, 10);
    let body = this.formatAlertBody([
      { title: this.t.instant('services.prompt.noteAlert.typeName'), text: note.Type },
      { title: this.t.instant('services.prompt.noteAlert.creatingTimeName'), text: note.CreatingTime.substring(0, 10) },
      { title: this.t.instant('services.prompt.noteAlert.seenByTutelaryName'), text: seen },
      { title: this.t.instant('services.prompt.noteAlert.contentName'), text: note.Content },
    ])
    this.presentAlert(
      note.Title,
      note.Teacher,
      body,
      this.color.getPopUpClass(),
    );
  }
  public lessonAlert(lesson: Lesson) {
    let bodyBase = [
      { title: this.t.instant('services.prompt.lessonAlert.timeName'), text: this.getTime(lesson.StartTime, lesson.EndTime) },
      { title: this.t.instant('services.prompt.lessonAlert.groupName'), text: lesson.ClassGroup },
      { title: this.t.instant('services.prompt.lessonAlert.classRoomName'), text: lesson.ClassRoom },
    ];
    if (lesson.Theme) {
      bodyBase.push({ title: this.t.instant('services.prompt.lessonAlert.topicName'), text: lesson.Theme });
    }
    this.presentAlert(
      lesson.Subject,
      lesson.Teacher,
      this.formatAlertBody(bodyBase),
      this.color.getPopUpClass(),
    );
  }
  public teacherHomeworkAlert(teacherHomework: TeacherHomework, subject: string) {
    this.presentAlert(
      teacherHomework.Rogzito,
      subject,
      `<ul>` +
      `<li>${this.t.instant('services.prompt.teacherHomeworkAlert.lessonCountName')}: ${teacherHomework.Oraszam}</li>` +
      `<li>${this.t.instant('services.prompt.teacherHomeworkAlert.teacherLoggedItName')} ${(teacherHomework.IsTanarRogzitette == true ? 'igen' : 'nem')}</li>` +
      `<li>${this.t.instant('services.prompt.teacherHomeworkAlert.assignmentDateName')}: ${teacherHomework.FeladasDatuma.substring(0, 10)}</li>` +
      `<li>${this.t.instant('services.prompt.teacherHomeworkAlert.deadlineName')}: ${teacherHomework.Hatarido.substring(0, 10)}</li>` +
      `</ul>`,
      this.color.getPopUpClass(),
    );
  }
  public gradeAlert(grade: any) {
    let formattedDate = this.fDate.formatDateWithZerosAndDots(new Date(grade.Date));

    let body = this.formatAlertBody([
      { title: this.t.instant('services.prompt.gradeAlert.dateName'), text: formattedDate },
      { title: this.t.instant('services.prompt.gradeAlert.typeName'), text: grade.Mode },
      { title: this.t.instant('services.prompt.gradeAlert.formName'), text: grade.FormName },
    ]);
    this.presentAlert(grade.grade + this.themeIf(grade.Theme), grade.weight, body, this.color.getPopUpClass());
  }
  public notificationAlert(title: string, content: string) {
    this.presentAlert(title, null, content, this.color.getPopUpClass());
  }
  public communityServiceAlert(comServiceDataItem: CommunityServiceData) {
    let note = comServiceDataItem.Megjegyzes == null ? '-' : comServiceDataItem.Megjegyzes;
    this.presentAlert(comServiceDataItem.KozossegiSzolgalatTipusa_DNAME,
      `${comServiceDataItem.Oraszam} óra`,
      `<ul>` +
      `<li>${this.t.instant('services.prompt.communityServiceAlert.beginName')}: ${this.fDate.formatDateWithZerosAndDots(comServiceDataItem.IntervallumKezdete)}</li>` +
      `<li>${this.t.instant('services.prompt.communityServiceAlert.finishName')}: ${this.fDate.formatDateWithZerosAndDots(comServiceDataItem.IntervallumVege)}</li>` +
      `<li>${this.t.instant('services.prompt.communityServiceAlert.instituteTagName')}: ${comServiceDataItem.TeljesitesiHelye}</li>` +
      `<li>${this.t.instant('services.prompt.communityServiceAlert.loggingTimeName')}: ${this.fDate.formatDateWithZerosAndDots(comServiceDataItem.RogzitesDatuma)}</li></ul>` +
      `${this.t.instant('services.prompt.communityServiceAlert.noteName')}: ${note}`,
      this.color.getPopUpClass());
  }

  private formatAlertBody(params: { title: string, text: string }[]) {
    let returnVal: string = "";
    for (let i = 0; i < params.length; i++) {
      if (i == 0) {
        returnVal += `<strong>${params[i].title}:</strong><br>${params[i].text}`
      } else {
        returnVal += `<br><strong>${params[i].title}:</strong><br>${params[i].text}`
      }
    }
    return returnVal;
  }
  //#endregion

  //#region toasts
  public errorToast(errorText: string) {
    this.presentToast(errorText, true);
  }
  public async errorDetailToast(error: GlobalError) {
    const toast = await this.toastCtrl.create({
      message: this.t.instant(error.customTitleTranslatorKey),
      position: 'bottom',
      duration: 10000,
      buttons: [
        {
          text: this.t.instant('services.prompt.moreBtnText'),
          handler: () => {
            this.presentUniversalErrorAlert(error);
          }
        }, {
          text: 'OK',
          role: 'cancel',
        }
      ]
    });
    toast.present();
  }
  public async fileOpenErrorToast(header: string, message: string, fileError: any) {
    let errorText = fileError instanceof Object ? this.getKeys(fileError).map(k => stringify(fileError[k])).join('||') : this.stringify(fileError);
    const toast = await this.toastCtrl.create({
      message: message,
      header: header,
      position: 'bottom',
      duration: 10000,
      buttons: [
        {
          text: this.t.instant('services.prompt.moreBtnText'),
          handler: () => {
            this.presentUniversalErrorAlert(errorText);
          }
        },
      ]
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
      buttons: [{
        role: 'cancel',
        text: 'OK'
      }]
    })
    await t.present();
  }
  public async administrationLoginExpiredToast() {
    let loginAct = false;
    let t = await this.toastCtrl.create({
      header: this.t.instant('services.prompt.administrationLoginExpired.title'),
      message: this.t.instant('services.prompt.administrationLoginExpired.text'),
      duration: 3000,
      buttons: [{
        text: this.t.instant('services.prompt.administrationLoginExpired.loginBtnText'),
        handler: () => {
          loginAct = true;
        }
      }]
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
    this.presentToast(title + ': ' + body, autoHide);
  }
  public toast(message: string, autoDismiss: boolean) {
    this.presentToast(message, autoDismiss);
  }
  public topToast(message: string, autoDismiss: boolean) {
    this.presentToast(message, autoDismiss, `top`);
  }
  public async dismissTopToast() {
    let topToast = await this.toastCtrl.getTop();
    if (topToast != null) {
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
      buttons: ['OK']
    });
    await alert.present();
  }
  private async presentToast(message: string, autoDismiss: boolean, position: `bottom` | `middle` | `top` = `bottom`) {
    let topToast = await this.toastCtrl.getTop();
    if (topToast != null) {
      this.toastCtrl.dismiss();
    }
    const toast = await this.toastCtrl.create({
      message: message,
      duration: autoDismiss ? 10000 : 0,
      cssClass: this.color.getToastClass(),
      buttons: [
        {
          text: 'OK',
          role: 'cancel',
        }
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
      return ` - ` + theme;
    }
  }
  private getTime(StartTime: Date, EndTime: Date) {
    let start = new Date(StartTime);
    let end = new Date(EndTime);
    return start.getHours() + `:` + (start.getMinutes() >= 10 ? start.getMinutes() : `0` + start.getMinutes()) + `-` + end.getHours() + `:` + (end.getMinutes() >= 10 ? end.getMinutes() : `0` + end.getMinutes());
  }
  private stringify(a) {
    if (a instanceof Object) {
      return stringify(a);
    } else if (typeof (a) === "string") {
      return a;
    } else if (typeof (a) == "number") {
      return a.toString();
    }
  }
  //#endregion
}
