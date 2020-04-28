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

@NgModule({
    declarations: [AdministrationErrorComponent, EmptyComponent, ReLoginComponent, WebLoginInfoComponent, ErrorDetailComponent],
    imports: [CommonModule, IonicModule, TranslateModule, FormsModule],
    exports: [AdministrationErrorComponent, EmptyComponent, ReLoginComponent, WebLoginInfoComponent, ErrorDetailComponent],
    providers: [],
})
export class ComponentsModule { }