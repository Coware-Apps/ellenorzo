import { Injectable } from "@angular/core";
import { HTTP, HTTPResponse } from "@ionic-native/http/ngx";
import { createHostListener } from '@angular/compiler/src/core';
import { CommunityService } from '../_models/communityService';
import { LayoutInformation } from '../_models/layoutInformation';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { PromptService } from './prompt.service';
import { Institute } from '../_models/institute';
import { Token } from '../_models/token';

@Injectable({
  providedIn: "root",
})
export class WebApiService {
  private _userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36";
  private _instituteUrl: string;
  private _username: string;
  private _password: string;
  private errorStatus = new BehaviorSubject(0);

  constructor(
    private _http: HTTP,
    private _translator: TranslateService,
    private _prompt: PromptService,
  ) {
    this._http.setFollowRedirect(false);
  }

  errorHandler() {
    this.errorStatus.subscribe(error => {
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

  //#region e-administration
  public async getAdministrationToken(username: string, password: string, institute: Institute) {
    try {
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      };
      const params = {
        'userName': username,
        'password': password,
        'institute_code': institute.InstituteCode,
        'grant_type': 'password',
        'client_id': '919e0c1c-76a2-4646-a2fb-7085bbbf3c56'
      }

      this._prompt.butteredToast("[KRETA->getToken()]");
      console.log("[KRETA->getToken()] institute", institute);

      let response = await this._http.post(institute.Url + "/idp/api/v1/Token", params, headers);
      console.log('tokenResponse', response);
      let parsedResponse: Token;
      try {
        parsedResponse = <Token>JSON.parse(response.data);
      } catch (error) {
        this._prompt.presentUniversalAlert(
          this._translator.instant('services.kreta.invalidJSONResponseAlert.header'),
          this._translator.instant('services.kreta.invalidJSONResponseAlert.subHeader'),
          this._translator.instant('services.kreta.invalidJSONResponseAlert.message'),
        );
      }

      this._prompt.butteredToast("[KRETA->getToken() result]" + parsedResponse);
      console.log("[KRETA->getToken()] result: ", parsedResponse);
      this.errorStatus.next(0);
      return parsedResponse;
    } catch (error) {
      console.error("Hiba történt a 'Token' lekérése közben", error);
      //with behaviorsubject
      this.errorStatus.next(error.status);
      return false;
    }
  }
  //#endregion
}
