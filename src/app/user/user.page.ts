import { Component, OnInit } from '@angular/core';
import { Student } from '../_models/student';
import { KretaService } from '../_services/kreta.service';
import { FormattedDateService } from '../_services/formatted-date.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
})
export class UserPage implements OnInit {
  public sans: boolean;
  public student: Student;
  constructor(
    public fDate: FormattedDateService,

    private kreta: KretaService,
  ) {

   }

  async ngOnInit() {
    this.sans = true;
    this.student = await this.kreta.getStudent(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"));
    this.sans = false;
  }

}
