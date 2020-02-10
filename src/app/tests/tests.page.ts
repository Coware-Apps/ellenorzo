import { Component, OnInit } from '@angular/core';
import { KretaService } from '../_services/kreta.service';
import { Test } from '../_models/test';
import { FormattedDateService } from '../_services/formatted-date.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { UniversalSortedData, CollapsifyService } from '../_services/collapsify.service';


@Component({
  selector: 'app-tests',
  templateUrl: './tests.page.html',
  styleUrls: ['./tests.page.scss'],
})
export class TestsPage implements OnInit {
  public tests: Test[];
  public sans: boolean;
  public testsByMonth: UniversalSortedData[];
  public monthsName: string[];

  constructor(
    public fDate: FormattedDateService,
    private firebase: FirebaseX,
    private kreta: KretaService,
    private collapsifyService: CollapsifyService,
  ) {
    this.testsByMonth = [];
    this.monthsName = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
   }

  async ngOnInit() {
    this.sans = true;
    //the official app uses the API this way, I will change this method once they do
    this.tests = await this.kreta.getTests(null, null);
    this.testsByMonth = this.collapsifyService.collapsifyByMonths(this.tests, 'Datum');
    this.sans = false;
    this.firebase.setScreenName('tests');
  }


}
