import { NgModule, ErrorHandler, APP_INITIALIZER, INJECTOR, Inject } from '@angular/core';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { RouteReuseStrategy, Router } from '@angular/router';

import { IonicModule, IonicRouteStrategy, MenuController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { IonicStorageModule, Storage } from '@ionic/storage';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Student } from './_models/student';
import { HTTP } from '@ionic-native/http/ngx';
import { Camera } from '@ionic-native/camera/ngx';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { IsDebug } from '@ionic-native/is-debug/ngx';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';
import { ErrorHandlerService } from './_services/error-handler.service';
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { FileTransfer } from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/file/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { IOSFilePicker } from '@ionic-native/file-picker/ngx';
import { CustomHammerGestureConfig } from './_configs/HammerGestureConfig';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { UserManagerService } from './_services/user-manager.service';
import { AppService } from './_services/app.service';
import { ThemeService } from './_services/theme.service';
import { ColorService } from './_services/color.service';
import { NotificationService } from './_services/notification.service';
export function translateLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}
export function initializeApp(
  AppService: AppService,
  UserManagerService: UserManagerService,
  ThemeService: ThemeService,
  ColorService: ColorService,
  NotificationService: NotificationService,
) {
  return async (): Promise<any> => {
    return Promise.all([
      AppService.onInit(),
      ThemeService.onInit(),
      ColorService.onInit(),
      NotificationService.onInit(),
      UserManagerService.onInit(),
    ]);
  };
}
@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    HttpClientModule,
    AppRoutingModule,
    IonicStorageModule.forRoot({
      driverOrder: ['indexeddb', 'sqlite', 'websql'],
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: translateLoaderFactory,
        deps: [HttpClient],
      },
      defaultLanguage: "en",
    }),
  ],
  providers: [
    StatusBar,
    AppVersion,
    SplashScreen,
    Student,
    Camera,
    HTTP,
    FirebaseX,
    IsDebug,
    LocalNotifications,
    FileTransfer,
    File,
    AndroidPermissions,
    FileChooser,
    FileOpener,
    FilePath,
    IOSFilePicker,
    Clipboard,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppService, ThemeService, ColorService, NotificationService, UserManagerService],
      multi: true,
    },
    { provide: ErrorHandler, useClass: ErrorHandlerService },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HAMMER_GESTURE_CONFIG, useClass: CustomHammerGestureConfig, }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
