import { Component, OnInit } from '@angular/core';
import { Student } from '../_models/student';
import { FormattedDateService } from '../_services/formatted-date.service';
import { Subscription, Observable, Subject } from 'rxjs';
import { UserManagerService } from '../_services/user-manager.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { HwBackButtonService } from '../_services/hw-back-button.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
})
export class UserPage implements OnInit {
  public sans: boolean;
  public showProgressBar: boolean;
  public student: Observable<Student[]>;

  private studentSubscription: Subscription;
  private reloaderSubscription: Subscription;
  public unsubscribe$: Subject<void>;

  constructor(
    public fDate: FormattedDateService,

    private firebaseX: FirebaseX,
    private userManager: UserManagerService,
    private hw: HwBackButtonService,
  ) {
    this.sans = true;
    this.showProgressBar = true;
  }

  async ngOnInit() {
    this.firebaseX.setScreenName('user');
  }

  async ionViewDidEnter() {
    this.unsubscribe$ = new Subject();
    this.hw.registerHwBackButton(this.unsubscribe$);
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
    this.student = new Observable<Student[]>((observer) => {
      this.studentSubscription = this.userManager.currentUser.student.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          this.sans = true;
          this.showProgressBar = true;
          //there is no data in the storage, showing skeleton text until the server responds
        } else if (subscriptionData.type == "placeholder") {
          //there is data in the storage, showing that data until the server responds, disabling skeleton text
          observer.next([subscriptionData.data]);
          this.sans = false;
          this.showProgressBar = true;
        } else {
          //the server has now responded, disabling progress bar and skeleton text if it's still there
          observer.next([subscriptionData.data]);
          this.showProgressBar = false;
          this.sans = false;
        }
      });
    });
    await this.userManager.currentUser.initializeStudent();
  }

  ionViewWillLeave() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    if (this.studentSubscription != null) {
      this.studentSubscription.unsubscribe();
    }
    if (this.reloaderSubscription != null) {
      this.reloaderSubscription.unsubscribe();
    }
  }

  async doRefresh(event: any) {
    this.showProgressBar = true;
    await this.userManager.currentUser.updateStudent();
    event.target.complete();
  }

}
