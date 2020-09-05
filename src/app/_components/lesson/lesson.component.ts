import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { PromptService } from "src/app/_services/prompt.service";
import { Lesson } from "src/app/_models/kreta-v3/lesson";
import { FormattedDateService } from "src/app/_services/formatted-date.service";

@Component({
    selector: "app-lesson",
    templateUrl: "./lesson.component.html",
    styleUrls: ["./lesson.component.scss"],
})
export class LessonComponent implements OnInit {
    @Input() lesson: Lesson;

    @Output() homeworkClick = new EventEmitter();

    constructor(private prompt: PromptService, private fDate: FormattedDateService) {}

    ngOnInit() {}

    async getMoreData(lesson: Lesson) {
        this.prompt.lessonV3Alert(lesson);
    }

    hideHomeworkBtn() {
        if (
            new Date(this.lesson.KezdetIdopont).valueOf() > new Date().valueOf() &&
            !this.lesson.HaziFeladatUid
        ) {
            return true;
        } else {
            return false;
        }
    }

    getTime() {
        return this.fDate.getTimetableTime(
            new Date(this.lesson.KezdetIdopont),
            new Date(this.lesson.VegIdopont)
        );
    }

    getStateClass() {
        return {
            "ion-color": this.lesson.Allapot?.Nev == "Elmaradt" || this.lesson.HelyettesTanarNeve,
            "ion-color-danger": this.lesson.Allapot?.Nev == "Elmaradt",
            "ion-color-warning": this.lesson.HelyettesTanarNeve,
        };
    }
}
