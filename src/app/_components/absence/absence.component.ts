import { Component, OnInit, Input } from '@angular/core';
import { Absence } from 'src/app/_models/student';
import { PromptService } from 'src/app/_services/prompt.service';

@Component({
  selector: 'app-absence',
  templateUrl: './absence.component.html',
  styleUrls: ['./absence.component.scss'],
})
export class AbsenceComponent implements OnInit {
  @Input() absence: Absence;

  constructor(
    private prompt: PromptService
  ) { }

  ngOnInit() {

  }

  getMoreData(absence: Absence) {
    this.prompt.absenceAlert(absence);
  }

  getColor(absence: Absence) {
    return absence.JustificationState == 'Justified' ? 'green' : absence.JustificationState == 'BeJustified' ? 'yellow' : 'red';
  }
}
