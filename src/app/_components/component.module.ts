import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { StudentRefresherComponent } from './student-refresher/student-refresher.component';

@NgModule({
    declarations: [StudentRefresherComponent],
    imports: [IonicModule],
    exports: [StudentRefresherComponent],
    providers: [],
})
export class ComponentsModule { }