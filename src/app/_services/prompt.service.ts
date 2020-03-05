import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { ColorService } from './color.service';
import { evaluation, Absence, Note } from '../_models/student';
import { FormattedDateService } from './formatted-date.service';
import { Lesson } from '../_models/lesson';
import { TeacherHomework } from '../_models/homework';
import { AppService } from './app.service';
import { CommunityServiceData } from '../_models/communityService';

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
  ) { }

  //#region alerts
  public presentUniversalAlert(header: string, subHeader: string, message: string) {
    this.presentAlert(header, subHeader, message, this.color.getPopUpClass());
  }
  public missingTextAlert(text: string) {
    this.presentAlert('Hibás szöveg!', null, text, this.color.getPopUpClass());
  }
  public evaluationAlert(evaluation: evaluation) {
    if (evaluation.Form == "Mark") {
      let date = new Date(evaluation.Date);
      let formattedDate = this.fDate.formatDateWithZerosAndDots(date);
      let time = new Date(evaluation.CreatingTime).getHours() + ':' + new Date(evaluation.CreatingTime).getMinutes();
      this.presentAlert(evaluation.NumberValue + this.themeIf(evaluation.Theme), evaluation.Weight,
        "<ul>" +
        "<li>Dátum: " + formattedDate + "</li>" +
        "<li>Létrehozva: " + time + "</li>" +
        "<li>Típus: " + evaluation.Mode + "</li>" +
        "<li>Leírás: " + evaluation.FormName + "</li></ul>", this.color.getPopUpClass())
    } else {
      //Form == 'Percent' || Form == 'Text' || Form == 'Deportment' || Form == 'Diligence'
      this.presentAlert(
        evaluation.Subject,
        evaluation.Teacher,
        "<ul>" +
        "<li>Típus: " + evaluation.FormName + "</li>" +
        "<li>Létrehozva: " + evaluation.CreatingTime.substring(0, 10) + "</li>" +
        "<li>Dátum: " + evaluation.Date.substring(0, 10) + "</li>" +
        "<li>Értékelés módja: " + evaluation.Mode + "</li>" +
        "</ul>" +
        (evaluation.Form == 'Text' ? "Tartalom: " + evaluation.Value : ''),
        this.color.getPopUpClass());
    }
  }
  public absenceAlert(absence: Absence) {
    let seen = absence.SeenByTutelaryUTC == null ? "nem" : absence.SeenByTutelaryUTC;
    let justificationTypeName = absence.JustificationType != 'UnJustified' ? ('<li>Igazolás típusa: ' + absence.JustificationTypeName + '</li>') : '';
    this.presentAlert(
      absence.TypeName + " (" + absence.Subject + ")",
      absence.Teacher,
      "<ul>" +
      "<li>Dátum: " + absence.LessonStartTime.substring(0, 10) + "</li>" +
      "<li>Állapot: " + absence.JustificationStateName + "</li>" +
      "<li>Mulasztás módja: " + absence.ModeName + "</li>" +
      justificationTypeName +
      "<li>Szülő látta: " + seen + "</li></ul>",
      this.color.getPopUpClass(),
    );
  }
  public noteAlert(note: Note) {
    let seen = note.SeenByTutelaryUTC == null ? "nem" : note.SeenByTutelaryUTC.substring(0, 10);
    this.presentAlert(
      note.Title,
      note.Teacher,
      "<ul>" +
      "<li>Típus: " + note.Type + "</li>" +
      "<li>Létrehozva: " + note.CreatingTime.substring(0, 10) + "</li>" +
      "<li>Gondviselő látta: " + seen + "</li></ul>" +
      "Tartalom: " + note.Content,
      this.color.getPopUpClass(),
    );
  }
  public lessonAlert(lesson: Lesson) {
    this.presentAlert(
      lesson.Subject,
      lesson.Teacher,
      "<ul>" +
      "<li>Időpont: " + this.getTime(lesson.StartTime, lesson.EndTime) + "</li>" +
      "<li>Csoport: " + lesson.ClassGroup + "</li>" +
      "<li>Terem: " + lesson.ClassRoom + "</li></ul>",
      this.color.getPopUpClass(),
    );
  }
  public teacherHomeworkAlert(teacherHomework: TeacherHomework, subject: string) {
    let css = this.color.getPopUpClass();
    this.presentAlert(
      teacherHomework.Rogzito,
      subject,
      "<ul>" +
      "<li>Óra száma: " + teacherHomework.Oraszam + "</li>" +
      "<li>Tanár rögzítette? " + (teacherHomework.IsTanarRogzitette == true ? 'igen' : 'nem') + "</li>" +
      "<li>Feladva: " + teacherHomework.FeladasDatuma.substring(0, 10) + "</li>" +
      "<li>Határidő: " + teacherHomework.Hatarido.substring(0, 10) + "</li>" +
      "</ul>",
      css
    );
  }
  public gradeAlert(grade: any) {
    let date = new Date(grade.Date);
    let formattedDate = this.fDate.formatDate(date);
    let time = date.getHours() + ":" + date.getMinutes();
    this.presentAlert(grade.grade + this.themeIf(grade.Theme), grade.weight,
      "<ul>" +
      "<li>Dátum: " + formattedDate + "</li>" +
      "<li>Létrehozva: " + time + "</li>" +
      "<li>Típus: " + grade.Mode + "</li>" +
      "<li>Leírás: " + grade.FormName + "</li></ul>", this.color.getPopUpClass());
  }
  public notificationAlert(title: string, content: string) {
    this.presentAlert(title, null, content, this.color.getPopUpClass());
  }
  public communityServiceAlert(comServiceDataItem: CommunityServiceData) {
    let note = comServiceDataItem.Megjegyzes == null ? '-' : comServiceDataItem.Megjegyzes;
    this.presentAlert(comServiceDataItem.KozossegiSzolgalatTipusa_DNAME,
      comServiceDataItem.Oraszam + ' óra',
      "<ul><li>Kezdés: " + this.fDate.formatDateWithZerosAndDots(comServiceDataItem.IntervallumKezdete) + "</li>" +
      "<li>Befejezés: " + this.fDate.formatDateWithZerosAndDots(comServiceDataItem.IntervallumVege) + "</li>" +
      "<li>Intézmény neve: " + comServiceDataItem.TeljesitesiHelye + "</li>" +
      "<li>Rögzítve: " + this.fDate.formatDateWithZerosAndDots(comServiceDataItem.RogzitesDatuma) + "</li></ul>" +
      "Megjegyzés: " + note,
      this.color.getPopUpClass());
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
    this.presentToast(message, autoDismiss, "top");
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
  private async presentToast(message: string, autoDismiss: boolean, position: "bottom" | "middle" | "top" = "bottom") {
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
    if (theme == null || theme == "") {
      return "";
    } else {
      return " - " + theme;
    }
  }
  private getTime(StartTime: Date, EndTime: Date) {
    let start = new Date(StartTime);
    let end = new Date(EndTime);
    return start.getHours() + ":" + (start.getMinutes() >= 10 ? start.getMinutes() : "0" + start.getMinutes()) + "-" + end.getHours() + ":" + (end.getMinutes() >= 10 ? end.getMinutes() : "0" + end.getMinutes());
  }
  //#endregion
}
