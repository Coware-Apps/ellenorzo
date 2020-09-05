import { WebApiService } from "../../_services/web-api.service";
import { HTTP } from "@ionic-native/http/ngx";

export class WebUser {
    public lastLoggedIn: Date;

    private _webApi: WebApiService;
    private _username: string;
    private _password: string;
    private _instituteUrl: string;

    constructor(username: string, password: string, instituteUrl: string, private _http: HTTP) {
        this._instituteUrl = instituteUrl;
        this._username = username;
        this._password = password;
        //this._webApi = new WebApiService(this._http);
    }

    public async login(): Promise<number> {
        await this._webApi.login(this._instituteUrl, this._username, this._password);
        this.lastLoggedIn = new Date();
        return await this._webApi.getRemainingLoginTime();
    }
    public async getCommunityService() {
        return await this._webApi.getCommunityServiceData();
    }
    public async getLoginTime() {
        return await this._webApi.getRemainingLoginTime();
    }
    public async getUserInfo() {
        return await this._webApi.getUserInfo();
    }
}
