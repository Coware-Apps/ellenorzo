import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebLoginInfoComponent } from './web-login-info/web-login-info.component';
import { IonicModule } from '@ionic/angular';

@NgModule({
    declarations: [WebLoginInfoComponent],
    imports: [ CommonModule, IonicModule ],
    exports: [WebLoginInfoComponent],
    providers: [],
})
export class ComponentsModule {}