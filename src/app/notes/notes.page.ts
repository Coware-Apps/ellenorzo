import { Component, OnInit } from '@angular/core';
import { Student, Note } from '../_models/student';
import { FormattedDateService } from '../_services/formatted-date.service';
import { KretaService } from '../_services/kreta.service';
import { ColorService } from '../_services/color.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
})
export class NotesPage implements OnInit {

  public notes: Note[];
  public sans: boolean;

  private student: Student;
  constructor(
    public kretaService: KretaService,
    public fDate: FormattedDateService,

    private color: ColorService,
    private alertCtrl: AlertController,
  ) { 
    this.notes= [];
  }

  async ngOnInit() {
    this.sans = true;
    this.student = await this.kretaService.getStudent(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"));

    for (let i = 0; i < this.student.Notes.length; i++) {
      this.notes.push(this.student.Notes[i]);
    }
    this.sans = false;
  }

  async getMoreData(note: Note) {

    let seen = note.SeenByTutelaryUTC == null ? "nem" : note.SeenByTutelaryUTC.substring(0, 10);

    this.presentAlert(
      note.Title,
      note.Teacher,
      "<ul>" +
      "<li>Típus: " + note.Type + "</li>" + 
      "<li>Létrehozva: " + note.CreatingTime.substring(0, 10) + "</li>" +
      "<li>Gondviselő látta: " + seen + "</li></ul>" + 
      "Tartalom: " + note.Content,
      this.color.getPopUpClass()
    );
  }

  async presentAlert(header: string, subHeader: string, message: string, css: string) {
    const alert = await this.alertCtrl.create({
      cssClass: css,
      header: header,
      subHeader: subHeader,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

}