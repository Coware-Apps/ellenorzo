import { Component, OnInit } from '@angular/core';
import { Student } from '../_models/student';
import { KretaService } from '../_services/kreta.service';
import { FormattedDateService } from '../_services/formatted-date.service';
import { Subscription, Observable } from 'rxjs';
import { DataLoaderService } from '../_services/data-loader.service';

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
  constructor(
    public fDate: FormattedDateService,

    private dataLoader: DataLoaderService,
    private kreta: KretaService,
  ) {
    this.sans = true;
    this.showProgressBar = true;
  }

  async ngOnInit() {
    this.student = new Observable<Student[]>((observer) => {
      this.studentSubscription = this.dataLoader.student.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          //there is no data in the storage, showing skeleton text until the server responds
        } else if (subscriptionData.type == "placeholder") {
          //there is data in the storage, showing that data until the server responds, disabling skeleton text
          observer.next([subscriptionData.data]);
          this.sans = false;
        } else {
          //the server has now responded, disabling progress bar and skeleton text if it's still there
          observer.next([subscriptionData.data]);
          this.showProgressBar = false;
          this.sans = false;
        }
      });
      this.dataLoader.initializeStudent();
    });
  }

  ionViewWillLeave() {
    this.studentSubscription.unsubscribe();
  }

  async doRefresh(event: any) {
    console.log("begin operation");
    this.showProgressBar = true;
    await this.dataLoader.updateStudent();
    event.target.complete();
  }

}
