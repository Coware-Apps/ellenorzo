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

  //#region alerts
  public presentUniversalAlert(header: string, subHeader: string, message: string) {
    this.presentAlert(header, subHeader, message, this.color.getPopUpClass());
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
    this.presentAlert(
      note.Title,
      note.Teacher,
      `<ul>` +
      `<li>${this.t.instant('services.prompt.noteAlert.typeName')}: ${note.Type}</li>` +
      `<li>${this.t.instant('services.prompt.noteAlert.creatingTimeName')}: ${note.CreatingTime.substring(0, 10)}</li>` +
      `<li>${this.t.instant('services.prompt.noteAlert.seenByTutelaryName')}: ${seen}</li></ul>` +
      `${this.t.instant('services.prompt.noteAlert.contentName')}: ${note.Content}`,
      this.color.getPopUpClass(),
    );
  }
  public lessonAlert(lesson: Lesson) {
    this.presentAlert(
      lesson.Subject,
      lesson.Teacher,
      `<ul>` +
      `<li>${this.t.instant('services.prompt.lessonAlert.timeName')}: ${this.getTime(lesson.StartTime, lesson.EndTime)}</li>` +
      `<li>${this.t.instant('services.prompt.lessonAlert.groupName')}: ${lesson.ClassGroup}</li>` +
      `<li>${this.t.instant('services.prompt.lessonAlert.classRoomName')}: ${lesson.ClassRoom}</li></ul>`,
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
      this.dismissToast(topToast.id);
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
  //#endregion
}
