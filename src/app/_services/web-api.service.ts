import { Injectable } from "@angular/core";
import { HTTP, HTTPResponse } from "@ionic-native/http/ngx";
import { CommunityService } from '../_models/communityService';
import { LayoutInformation } from '../_models/layoutInformation';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: "root",
})
export class WebApiService {
  private _userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36";
  private _instituteUrl: string;
  private _username: string;
  private _password: string;
  private _errorStatus = new BehaviorSubject(0);

  constructor(
    private _http: HTTP,
    private _translator: TranslateService,
  ) {
    this._http.setFollowRedirect(false);
  }

  errorHandler() {
    this._errorStatus.subscribe(error => {
      switch (error) {

        case 0:
          //successful request
          break;

        //client side / plugin error
        case -4:
          this._translator.instant('services.kreta.httpErrors.-4');
          break;
        case -3:
          this._translator.instant('services.kreta.httpErrors.-3');
          break;
        case -2:
          this._translator.instant('services.kreta.httpErrors.-2');
          break;
        case -1:
          this._translator.instant('services.kreta.httpErrors.-1');
          break;

        //server errors
        case 400:
          this._translator.instant('services.kreta.httpErrors.400');
          break;
        case 403:
          this._translator.instant('services.kreta.httpErrors.403');
          break;
        case 69420:
          //known KRÉTA errors
          this._translator.instant('services.kreta.httpErrors.69420');
          break;
        case 401:
          this._translator.instant('services.kreta.httpErrors.401');
          break;

        default:
          if (error >= 500 && 600 > error) {
            this._translator.instant('services.kreta.httpErrors.defaultServerSide');
          } else {
            this._translator.instant('services.kreta.httpErrors.defaultClientSide', { error: error });
          }
          break;
      }
    })
  }

  //#region Main Web services (project currently on hold)
  public async login(instituteUrl: string, username: string, password: string): Promise<HTTPResponse> {
    this._http.clearCookies();
    try {
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": this._userAgent,
      };
      const params = {
        UserName: username,
        Password: password,
        ReCaptchaIsEnabled: false,
      };
      const response = await this._http.post(`${instituteUrl}/Adminisztracio/Login/LoginCheck`, params, headers);
      this._instituteUrl = instituteUrl;
      this._username = username;
      this._password = password;
      await this._chooseRole();
      return response;
    } catch (error) {
      console.error("[WEB-API] Error during login attempt", error);
    }
  }

  private async _chooseRole(): Promise<HTTPResponse> {
    try {
      let response = await this._http.get(`${this._instituteUrl}/Adminisztracio/SzerepkorValaszto`, {}, { "User-Agent": this._userAgent, });
      console.log('role chose, ', response);
      return response;
    } catch (error) {
      if (error.status != 302) {

        console.error("[WEB-API] Error during role selection", error);
      }
    }
  }

  public async getUserInfo(): Promise<LayoutInformation> {
    await this._loginIfNeeded();
    try {
      const headers = {
        "User-Agent": this._userAgent,
      };
      const params = {
        url: "/Intezmeny/Faliujsag"
      };
      let response = await this._http.post(`${this._instituteUrl}/Layout/GetLayoutInformation`, params, headers);
      console.log('userInfoResponse', <LayoutInformation>JSON.parse(response.data));
      return <LayoutInformation>JSON.parse(response.data);
    } catch (error) {
      console.error("[WEB-API] Error during community service request", error);
    }
  }

  public async getCommunityServiceData(): Promise<CommunityService> {
    await this._loginIfNeeded();
    try {
      const headers = {
        "User-Agent": this._userAgent,
      };
      const params = {
        sort: "IntervallumKezdete-desc",
        group: "",
        filter: "",
        data: "{}",
        _: "1582537916000",
      };
      let response = await this._http.get(`${this._instituteUrl}/api/TanuloKozossegiSzolgalataiApi/GetTanuloKozossegiSzolgalataiGrid`, params, headers);
      return <CommunityService>JSON.parse(response.data);
    } catch (error) {
      console.error("[WEB-API] Error during community service request", error);
    }
  }

  private async _loginIfNeeded() {
    if (await this.getRemainingLoginTime() < 300) {
      await this.login(this._instituteUrl, this._username, this._password);
    }
  }

  public async logout(): Promise<void> {
    try {
      const headers = {
        "User-Agent": this._userAgent,
      };
      const params = {};
      await this._http.post(`${this._instituteUrl}/Layout/LogOut`, params, headers);
      this._http.clearCookies();
    } catch (error) {
      console.error("[WEB-API] Error during logout attempt", error);
    }
  }

  public async getRemainingLoginTime(): Promise<number> {
    try {
      const headers = {
        "User-Agent": this._userAgent,
      };
      const params = {};
      let response = await this._http.post(`${this._instituteUrl}/Layout/GetRemainingTime`, params, headers);
      return response.data;
    } catch (error) {
      console.error("[WEB-API] Error getting login time", error);
    }
  }
  //#endregion
}
