import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { AdministrationErrorComponent } from "./administration-error/administration-error.component";
import { TranslateModule } from "@ngx-translate/core";
import { EmptyComponent } from "./empty/empty.component";
import { FormsModule } from "@angular/forms";
import { WebLoginInfoComponent } from "./web-login-info/web-login-info.component";
import { ErrorDetailComponent } from "./error-detail/error-detail.component";
import { AbsenceComponent } from "./absence/absence.component";
import { EvaluationComponent } from "./evaluation/evaluation.component";
import { EventComponent } from "./event/event.component";
import { NoteComponent } from "./note/note.component";
import { TestComponent } from "./test/test.component";
import { MessageCardComponent } from "./message-card/message-card.component";
import { LessonComponent } from "./lesson/lesson.component";
import { AverageComponent } from "./average/average.component";
import { KretaErrorComponent } from "./kreta-error/kreta-error.component";

@NgModule({
    declarations: [
        AdministrationErrorComponent,
        EmptyComponent,
        WebLoginInfoComponent,
        ErrorDetailComponent,
        AbsenceComponent,
        EvaluationComponent,
        EventComponent,
        NoteComponent,
        TestComponent,
        MessageCardComponent,
        LessonComponent,
        AverageComponent,
        KretaErrorComponent,
    ],
    imports: [CommonModule, IonicModule, TranslateModule, FormsModule],
    exports: [
        AdministrationErrorComponent,
        EmptyComponent,
        WebLoginInfoComponent,
        ErrorDetailComponent,
        AbsenceComponent,
        EvaluationComponent,
        EventComponent,
        NoteComponent,
        TestComponent,
        MessageCardComponent,
        LessonComponent,
        AverageComponent,
        KretaErrorComponent,
    ],
    providers: [],
})
export class ComponentsModule {}
