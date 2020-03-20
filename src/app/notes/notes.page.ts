import { Component, OnInit } from '@angular/core';
import { Note } from '../_models/student';
import { FormattedDateService } from '../_services/formatted-date.service';
import { KretaService } from '../_services/kreta.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { CollapsifyService, UniversalSortedData } from '../_services/collapsify.service';
import { Observable, Subscription } from 'rxjs';
import { AppService } from '../_services/app.service';
import { UserManagerService } from '../_services/user-manager.service';

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
  private reloaderSubscription: Subscription;
  constructor(
    public kretaService: KretaService,
    public fDate: FormattedDateService,
    public app: AppService,

    private userManager: UserManagerService,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private collapsifyService: CollapsifyService,
  ) {
    this.sans = true;
    this.showProgressBar = true;
  }

  async ngOnInit() {
    this.firebase.setScreenName('notes');
  }

  async ionViewDidEnter() {
    await this.loadData();
    this.reloaderSubscription = this.userManager.reloader.subscribe(value => {
      if (value == 'reload') {
        this.sans = true;
        this.showProgressBar = true;
        this.studentSubscription.unsubscribe();
        this.loadData();
      }
    });
  }

  private async loadData() {
    this.collapsifiedData = new Observable<UniversalSortedData[]>((observer) => {
      this.studentSubscription = this.userManager.currentUser.student.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          //there is no data in the storage, showing skeleton text until the server responds
          this.sans = true;
          this.showProgressBar = true;
        } else if (subscriptionData.type == "placeholder") {
          //there is data in the storage, showing that data until the server responds, disabling skeleton text
          observer.next(this.collapsifyService.collapsifyByMonths(this.filterCoronaText(subscriptionData.data.Notes), "CreatingTime"));
          this.sans = false;
          this.showProgressBar = true;
        } else {
          //the server has now responded, disabling progress bar and skeleton text if it's still there
          observer.next(this.collapsifyService.collapsifyByMonths(this.filterCoronaText(subscriptionData.data.Notes), "CreatingTime"));
          this.showProgressBar = false;
          this.sans = false;
        }
      });
    });
    await this.userManager.currentUser.initializeStudent();
  }

  filterCoronaText(noteArray: Note[]) {
    let newArray = [];
    let hasCoronaBeenAdded = false;
    for (let i = 0; i < noteArray.length; i++) {
      let element = noteArray[i];
      //CORONA text quick fix
      if (
        element.Title == "Koronavírus tájékoztató" &&
        this.fDate.formatDate(new Date(element.CreatingTime)) == "2020-3-11"
      ) {
        if (!hasCoronaBeenAdded) {
          newArray.push(element);
          hasCoronaBeenAdded = true;
        }
      } else {
        newArray.push(element);
      }
    }
    return newArray;
  }

  ionViewWillLeave() {
    if (this.studentSubscription != null) {
      this.studentSubscription.unsubscribe();
    }
    if (this.reloaderSubscription != null) {
      this.reloaderSubscription.unsubscribe();
    }
  }

  async getMoreData(note: Note) {
    this.prompt.noteAlert(note);
  }
  async doRefresh(event: any) {
    this.showProgressBar = true;
    await this.userManager.currentUser.updateStudent();
    event.target.complete();
  }
}