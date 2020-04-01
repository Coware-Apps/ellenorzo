import { Injectable } from '@angular/core';
import { KretaService } from './kreta.service';
import { FormattedDateService } from './formatted-date.service';
import { CacheService } from './cache.service';
import { User } from '../_models/user';
import { Storage } from '@ionic/storage';
import { Token } from '../_models/token';
import { Institute } from '../_models/institute';
import { AppService } from './app.service';
import { NotificationService } from './notification.service';
import { PromptService } from './prompt.service';
import { WebUser } from '../_models/webUser';
import { HTTP } from '@ionic-native/http/ngx';

@Injectable({
  providedIn: 'root'
})
export class UserFactoryService {

  constructor(
    private kreta: KretaService,
    private storage: Storage,
    private fDate: FormattedDateService,
    private cache: CacheService,
    private app: AppService,
    private notificationSerice: NotificationService,
    private prompt: PromptService,
    private http: HTTP,
  ) {

  }

  public createUser(tokens: Token, institute: Institute): User {
    let newUser = new User(tokens, institute, this.kreta, this.storage, this.fDate, this.cache, this.app, this.notificationSerice, this.prompt);
    return newUser;
  }

  // public createWebUser(instituteUrl: string, username: string, password: string): WebUser {
  //   let newWebUser = new WebUser(instituteUrl, username, password, this.http);
  //   return newWebUser;
  // }
}
