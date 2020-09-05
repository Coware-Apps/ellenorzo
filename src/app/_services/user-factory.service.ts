import { Injectable } from "@angular/core";
import { KretaService } from "./kreta.service";
import { FormattedDateService } from "./formatted-date.service";
import { CacheService } from "./cache.service";
import { User } from "../_models/user";
import { Storage } from "@ionic/storage";
import { Token } from "../_models/token";
import { Institute } from "../_models/institute";
import { AppService } from "./app.service";
import { NotificationService } from "./notification.service";
import { PromptService } from "./prompt.service";
import { WebUser } from "../_models/kreta-v2/webUser";
import { HTTP } from "@ionic-native/http/ngx";
import { AdministrationService } from "./administration.service";
import { KretaV3Service } from "./kreta-v3.service";

@Injectable({
    providedIn: "root",
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
        private administrationService: AdministrationService,
        private kretaV3: KretaV3Service
    ) {}

    public createUser(tokens: Token, institute: Institute, username: string, yx: string): User {
        let newUser = new User(
            tokens,
            institute,
            username,
            yx,
            this.kreta,
            this.storage,
            this.fDate,
            this.cache,
            this.app,
            this.notificationSerice,
            this.prompt,
            this.administrationService,
            this.kretaV3
        );
        return newUser;
    }

    // public createWebUser(instituteUrl: string, username: string, password: string): WebUser {
    //   let newWebUser = new WebUser(instituteUrl, username, password, this.http);
    //   return newWebUser;
    // }
}
