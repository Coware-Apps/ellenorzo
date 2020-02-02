import { Component, OnInit } from '@angular/core';
import { Student, Note } from '../_models/student';
import { FormattedDateService } from '../_services/formatted-date.service';
import { KretaService } from '../_services/kreta.service';
import { ColorService } from '../_services/color.service';
import { AlertController } from '@ionic/angular';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';

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
    private firebase: FirebaseX,
    private prompt: PromptService,
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
    this.firebase.setScreenName('notes');
  }

  async getMoreData(note: Note) {
    this.prompt.noteAlert(note);
  }
}