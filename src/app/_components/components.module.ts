import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AdministrationErrorComponent } from './administration-error/administration-error.component';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyComponent } from './empty/empty.component';
import { ReLoginComponent } from './re-login/re-login.component';
import { FormsModule } from '@angular/forms';
import { WebLoginInfoComponent } from './web-login-info/web-login-info.component';
import { ErrorDetailComponent } from './error-detail/error-detail.component';
import { AbsenceComponent } from './absence/absence.component';
import { EvaluationComponent } from './evaluation/evaluation.component';
import { EventComponent } from './event/event.component';
import { NoteComponent } from './note/note.component';
import { TestComponent } from './test/test.component';
import { MessageCardComponent } from './message-card/message-card.component';
import { LessonComponent } from './lesson/lesson.component';
import { AverageComponent } from './average/average.component';

@NgModule({
    declarations: [
        AdministrationErrorComponent,
        EmptyComponent,
        ReLoginComponent,
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
    ],
    imports: [
        CommonModule,
        IonicModule,
        TranslateModule,
        FormsModule
    ],
    exports: [
        AdministrationErrorComponent,
        EmptyComponent,
        ReLoginComponent,
        WebLoginInfoComponent,
        ErrorDetailComponent,
        AbsenceComponent,
        EvaluationComponent,
        EventComponent,
        NoteComponent,
        TestComponent,
        MessageCardComponent,
        LessonComponent,
        AverageComponent
    ],
    providers: [],
})
export class ComponentsModule { }