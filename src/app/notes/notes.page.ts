import { Component, OnInit } from '@angular/core';
import { Student, Note } from '../_models/student';
import { FormattedDateService } from '../_services/formatted-date.service';
import { KretaService } from '../_services/kreta.service';
import { ColorService } from '../_services/color.service';
import { AlertController } from '@ionic/angular';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { CollapsifyService, UniversalSortedData } from '../_services/collapsify.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
})
export class NotesPage implements OnInit {

  public sans: boolean;
  public collapsifiedData: UniversalSortedData[];

  private student: Student;
  constructor(
    public kretaService: KretaService,
    public fDate: FormattedDateService,

    private color: ColorService,
    private alertCtrl: AlertController,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private collapsifyService: CollapsifyService,
  ) { 
    
  }

  async ngOnInit() {
    this.sans = true;
    this.student = await this.kretaService.getStudent(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"));

    this.collapsifiedData = this.collapsifyService.collapsifyByMonths(this.student.Notes, "CreatingTime");

    console.log('collapsifiedData: ', this.collapsifiedData);

    this.sans = false;
    this.firebase.setScreenName('notes');
  }

  async getMoreData(note: Note) {
    this.prompt.noteAlert(note);
  }
}