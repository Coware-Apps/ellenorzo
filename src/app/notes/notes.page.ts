import { Component, OnInit } from '@angular/core';
import { Note, Student } from '../_models/student';
import { FormattedDateService } from '../_services/formatted-date.service';
import { KretaService } from '../_services/kreta.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { CollapsifyService, UniversalSortedData } from '../_services/collapsify.service';
import { Observable, Subscription, Subject } from 'rxjs';
import { AppService } from '../_services/app.service';
import { UserManagerService } from '../_services/user-manager.service';
import { HwBackButtonService } from '../_services/hw-back-button.service';
import { Event } from '../_models/event';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
})
export class NotesPage implements OnInit {

  public collapsifiedData: UniversalSortedData[];
  public unsubscribe$: Subject<void>;
  public componentState: "loaded" | "empty" | "error" | "loading" | "loadedProgress" = "loading";

  private reloaderSubscription: Subscription;

  constructor(
    public kretaService: KretaService,
    public fDate: FormattedDateService,
    public app: AppService,

    private hw: HwBackButtonService,
    private userManager: UserManagerService,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private collapsifyService: CollapsifyService,
  ) {
  }

  async ngOnInit() {
    this.firebase.setScreenName('notes');
  }
  async ionViewDidEnter() {
    this.unsubscribe$ = new Subject();
    this.hw.registerHwBackButton(this.unsubscribe$);
    await this.loadData();
    this.reloaderSubscription = this.userManager.reloader.subscribe(value => {
      if (value == 'reload') {
        this.loadData();
      }
    });
  }
  ionViewWillLeave() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    if (this.reloaderSubscription != null) {
      this.reloaderSubscription.unsubscribe();
    }
  }

  private async loadData(forceRefresh = false, event?) {
    this.userManager.currentUser.getAsyncAsObservableWithCache<any[]>(
      [
        {
          name: "getStudent",
          cacheKey: "student",
          params: [null, null, true]
        },
        {
          name: "getEvents",
          cacheKey: "events",
          params: []
        }
      ],
      forceRefresh,
    )
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        {
          next: d => {
            if (d[0] && d[0].Notes && d[1]) {
              this.collapsifiedData = this.collapsifyService.collapsifyByMonths([...d[0].Notes, ...d[1]], "Date", "Date");
              this.componentState = "loadedProgress";
            }
          },
          complete: () => {
            if (event) event.target.complete();
            if (this.collapsifiedData.length == 0) {
              this.componentState = 'empty';
            } else {
              this.componentState = 'loaded';
            }
          },
          error: (error) => {
            console.error(error);
            //this.error = error;
            // if (this.collapsifiedData.length == 0) {
            //   this.componentState = "error";
            //   if (event) event.target.complete()
            //   error.isHandled = true;
            // } else {
            this.componentState = "loaded";
            if (event) event.target.complete()
            // }

            throw error;
          }
        }
      );
  }
  async getMoreData(note: Note) {
    this.prompt.noteAlert(note);
  }
  doRefresh(event: any) {
    this.componentState == 'loadedProgress';
    this.loadData(true, event);
  }
}