import { Component, OnInit } from '@angular/core';
import { Student, Note } from '../_models/student';
import { FormattedDateService } from '../_services/formatted-date.service';
import { KretaService } from '../_services/kreta.service';
import { ColorService } from '../_services/color.service';
import { AlertController } from '@ionic/angular';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { CollapsifyService, UniversalSortedData } from '../_services/collapsify.service';
import { Observable, Subscription } from 'rxjs';
import { DataLoaderService } from '../_services/data-loader.service';
import { AppService } from '../_services/app.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
})
export class NotesPage implements OnInit {

  public sans: boolean;
  public collapsifiedData: Observable<UniversalSortedData[]>;
  public showProgressBar: boolean;
  private studentSubscription: Subscription;
  constructor(
    public kretaService: KretaService,
    public fDate: FormattedDateService,
    public app: AppService,

    private dataLoader: DataLoaderService,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private collapsifyService: CollapsifyService,
  ) {
    this.sans = true;
    this.showProgressBar = true;
  }

  async ngOnInit() {
    this.collapsifiedData = new Observable<UniversalSortedData[]>((observer) => {
      this.studentSubscription = this.dataLoader.student.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          //there is no data in the storage, showing skeleton text until the server responds
        } else if (subscriptionData.type == "placeholder") {
          //there is data in the storage, showing that data until the server responds, disabling skeleton text
          observer.next(this.collapsifyService.collapsifyByMonths(subscriptionData.data.Notes, "CreatingTime"));
          this.sans = false;
        } else {
          //the server has now responded, disabling progress bar and skeleton text if it's still there
          observer.next(this.collapsifyService.collapsifyByMonths(subscriptionData.data.Notes, "CreatingTime"));
          this.showProgressBar = false;
          this.sans = false;
        }
      });
      this.dataLoader.initializeStudent();
    });

    this.firebase.setScreenName('notes');
  }

  ionViewWillLeave() {
    this.studentSubscription.unsubscribe();
  }

  async getMoreData(note: Note) {
    this.prompt.noteAlert(note);
  }
  async doRefresh(event: any) {
    console.log("begin operation");
    this.showProgressBar = true;
    await this.dataLoader.updateStudent();
    event.target.complete();
  }
}