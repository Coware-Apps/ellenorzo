import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PromptService } from 'src/app/_services/prompt.service';
import { Lesson } from 'src/app/_models/lesson';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';

@Component({
  selector: 'app-lesson',
  templateUrl: './lesson.component.html',
  styleUrls: ['./lesson.component.scss'],
})
export class LessonComponent implements OnInit {
  @Input() lesson: Lesson;

  @Output() homeworkClick = new EventEmitter();

  constructor(
    private prompt: PromptService,
    private fDate: FormattedDateService,
  ) { }

  ngOnInit() { }


  async getMoreData(lesson: Lesson) {
    this.prompt.lessonAlert(lesson);
  }

  hideHomeworkBtn() {
    if (new Date(this.lesson.StartTime).valueOf() > new Date().valueOf() && !this.lesson.TeacherHomeworkId) {
      return true;
    } else {
      return false;
    }
  }

  getTime() {
    return this.fDate.getTimetableTime(this.lesson.StartTime, this.lesson.EndTime);
  }

  getStateClass() {
    return {
      'ion-color': this.lesson.StateName == 'Elmaradt tanóra' || this.lesson.DeputyTeacher != "",
      'ion-color-danger': this.lesson.StateName == 'Elmaradt tanóra',
      'ion-color-warning': this.lesson.DeputyTeacher != ""
    };
  }
}
