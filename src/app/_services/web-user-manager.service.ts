import { Injectable } from "@angular/core";
import { UserFactoryService } from "./user-factory.service";
import { AppService } from "./app.service";
import { WebUser } from "../_models/kreta-v2/webUser";
import { User } from "../_models/user";

@Injectable({
    providedIn: "root",
})
export class WebUserManagerService {
    public user: WebUser;
    constructor(private userFactory: UserFactoryService, private app: AppService) {}
    public async saveUser() {
        await this.app.changeConfigSaveJSON("webApiRegistration", this.user);
    }
    public async deleteUser() {
        this.user = null;
        await this.app.changeConfig("webApiRegistration", null);
    }
    public createExistingUser() {
        console.log("[WEB-USER-MANAGER] creating existing user", this.app.webUser);
        this.user = this.app.webUser;
    }
    public async createUser(instituteUrl: string, username: string, password: string) {
        // this.user = this.userFactory.createWebUser(
        //   instituteUrl,
        //   username,
        //   password
        // );
        // await this.app.changeConfigSaveJSON('webUser', this.user);
    }
}
