import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Lesson } from '../_models/lesson';
import { Student } from '../_models/student';
import { Token, DecodedUser } from '../_models/token';
import { Storage } from '@ionic/storage';
import { CacheService } from './cache.service';
import { AntiSpamService } from './anti-spam.service';
import { HTTP } from '@ionic-native/http/ngx';
import { BehaviorSubject, from } from 'rxjs';
import { ToastController } from '@ionic/angular';
import { ColorService } from './color.service';
import { StudentHomework, TeacherHomework, HomeworkResponse } from '../_models/homework';
import { Institute } from '../_models/institute';
import { AuthenticationService } from './authentication.service';
import { Test } from '../_models/test';
import { Router } from '@angular/router';
import { FormattedDateService } from './formatted-date.service';
import { MobileVersionInfo } from '../_models/mobileVersionInfo';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { JwtDecodeHelper } from '../_helpers/jwt-decode-helper';
import { IsDebug } from '@ionic-native/is-debug/ngx';
import { PromptService } from './prompt.service';


@Injectable({
  providedIn: 'root'
})
export class KretaService {

  public errorStatus = new BehaviorSubject(0);
  public loginStatus = new BehaviorSubject("init");
  public institute: Institute;
  public password: string;
  public decoded_user: DecodedUser;

  private thisError: HttpErrorResponse;
  private errorType: string;
  //keys to delete cache by
  private lessonKey: string;
  private studentKey: string;
  private studentHomeworkKey: string;
  private teacherHomeworkKey: string;
  private instituteKey: string;
  private testKey: string;
  //after this time we will get a new access_token (ms)
  private authenticatedFor: number;

  constructor(
    private http: HTTP,
    private storage: Storage,
    private cache: CacheService,
    private antiSpam: AntiSpamService,
    private toastController: ToastController,
    private color: ColorService,
    private authService: AuthenticationService,
    private router: Router,
    private fDate: FormattedDateService,
    private firebase: FirebaseX,
    private jwtDecoder: JwtDecodeHelper,
    private isDebug: IsDebug,
    private prompt: PromptService,
  ) {
    this.lessonKey = "";
    this.studentKey = "";
    this.studentHomeworkKey = "";
    this.instituteKey = "";
    this.studentHomeworkKey = "";
    this.authenticatedFor = 3500000;
    this.testKey = "";
  }
  private access_token: string;


  //#region Sub-functions and other 
  private async getInstituteFromStorage(): Promise<Institute> {
    if (this.institute == null) {
      console.log("[KRETA] loaded institute from storage");
      this.prompt.butteredToast('[KRETA] loaded institute from storage');
      return await this.storage.get("institute");
    } else {
      return this.institute;
    }
  }

  public async initializeFirebase(userId) {
    if (await this.isDebug.getIsDebug || await this.storage.get('analyticsCollectionEnabled') == false) {
      this.firebase.setAnalyticsCollectionEnabled(false);
      console.log("[FIREBASE] Anonymus statistics are off");
      this.prompt.butteredToast("[FIREBASE] Anonymus statistics are off");
    } else {
      //using the userId only for anonymus data collection purposes, but it is required for cross-device syncing
      this.firebase.setAnalyticsCollectionEnabled(true);
      this.firebase.setUserId(userId);
      this.firebase.setUserProperty("kreta_institute_code", this.institute.InstituteCode);
      this.firebase.setUserProperty("kreta_institute_name", this.institute.Name);
      this.firebase.setUserProperty("kreta_institute_city", this.institute.City);
      this.firebase.setCrashlyticsUserId(userId);
      console.log("[FIREBASE] Anonymus statistics are on");
      this.prompt.butteredToast("[FIREBASE] Anonymus statistics are on");
    }

  }

  public async getUserData() {
    await this.loginIfNotYetLoggedIn();
    return this.decoded_user;
  }
  //#endregion

  //#region Authentication logic
  public async loginIfNotYetLoggedIn(forceLogin: boolean = false): Promise<any> {
    if (this.loginStatus.value == "inProgress") {
      return "wait";
    } else {
      if (this.authService.isLoginNeeded(this.authenticatedFor) || forceLogin) {
        this.loginStatus.next("inProgress");
        //access_token expired
        this.errorType = "";

        let currentTokens: Token;
        let storedUsername = await this.storage.get('username');
        let password = this.password;

        if (this.access_token == null) {

          let refreshToken = await this.storage.get('refresh_token');
          if (refreshToken != null) {
            //renewing tokens
            this.errorType = "";

            console.log("[KRÉTA->LoginIfNotYetLoggedIn()] Renewing Tokens using refreshtoken... (" + refreshToken + ")");
            this.prompt.butteredToast('[KRÉTA->LoginIfNotYetLoggedIn()] Renewing Tokens using refreshtoken...');

            this.authService.login()
            currentTokens = await this.renewToken(refreshToken);

            this.errorStatus.subscribe(async error => {
              if (error == 0) {
                this.storage.set('refresh_token', currentTokens.refresh_token);
                this.access_token = currentTokens.access_token;
                return true;
              } else if (this.errorType == "invalid_grant") {
                //invalid user/pass
                this.prompt.errorToast("Hibás felhasználónév vagy jelszó");
                this.storage.remove("username");
                this.storage.remove("password");
                this.authService.logout();
                return false;
              }
            });
          }
          else {
            //login
            console.log("[KRÉTA->LoginIfNotYetLoggedIn()] Getting tokens using credentials");
            this.prompt.butteredToast('[KRÉTA->LoginIfNotYetLoggedIn()] Getting tokens using credentials');
            currentTokens = await this.getToken(storedUsername, password);

            this.errorStatus.subscribe(error => {
              if (error == 0) {
                //successful login
                this.storage.set('refresh_token', currentTokens.refresh_token);
                this.access_token = currentTokens.access_token;
                this.authService.login();
                this.router.navigate(['']);
                return true;
              } else if (this.errorType == "invalid_grant") {
                //invalid user/pass
                this.prompt.errorToast("Hibás felhasználónév vagy jelszó");
                this.logout();
                return false;
              } else {
                return false;
              }
            });
          }
        }
        this.loginStatus.next("done");
      } else {
        //already logged in, no need to refresh access_token yet
        console.log("[KRÉTA->LoginIfNotYetLoggedIn()] Already logged in, access_token:", this.access_token);
        this.prompt.butteredToast('[KRÉTA->LoginIfNotYetLoggedIn()] Already logged in');
        return true;
      }
      this.loginStatus.next("done");
    }
  }

  public async logout() {
    this.access_token = null;
    this.errorType = "";
    this.thisError = null;

    await this.firebase.unregister();
    this.cache.clearStorage(true);
    this.authService.logout();
  }
  //#endregion

  //#region Error handling / prompting
  async errorHandler() {
    this.errorStatus.subscribe(error => {
      switch (error) {

        case 0:
          //successful request
          break;

        //client side / plugin error
        case -4:
          this.prompt.errorToast('Időtúllépési hiba, ellenőrizd az internetkapcsolatod!')
          break;
        case -3:
          this.prompt.errorToast("Nincs internetkapcsolat!");
          break;
        case -2:
          this.prompt.errorToast("A KRÉTA szerver nem válaszol!");
          break;
        case -1:
          this.prompt.errorToast("Hiba az internetkapcsolattal!");
          break;

        //server errors
        case 400:
          this.prompt.errorToast("Hibás bejelentkezési adatok!");
          break;
        case 403:
          this.prompt.errorToast("Hozzáférés megtagadva!");
          break;

        default:
          if (error >= 500 && 600 > error) {
            this.prompt.errorToast("A KRÉTA szerver nem válaszol!");
          } else {
            this.prompt.errorToast("Ismeretlen hiba történt! Próbáld meg újraindítani az appot! (" + error + ")");
          }
          break;
      }
    })
  }
  //#endregion

  //#region KRÉTA->Login
  public async getToken(username: string, password: string): Promise<Token> {
    this.institute = await this.getInstituteFromStorage();
    try {
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      };
      this.errorType = "";
      const params = {
        'userName': username,
        'password': password,
        'institute_code': this.institute.InstituteCode,
        'grant_type': 'password',
        'client_id': '919e0c1c-76a2-4646-a2fb-7085bbbf3c56'
      }

      this.prompt.butteredToast("[KRETA->getToken()]");
      console.log("[KRETA->getToken()] institute", this.institute);

      let response = await this.http.post(this.institute.Url + "/idp/api/v1/Token", params, headers);

      let x = <Token>JSON.parse(response.data);

      this.access_token = x.access_token;
      this.prompt.butteredToast("[KRETA->getToken() result]" + x);
      console.log("[KRETA->getToken()] result: ", x);
      //success
      this.decoded_user = this.jwtDecoder.decodeToken(x.access_token);
      this.initializeFirebase(this.decoded_user["kreta:institute_user_id"]);
      this.errorStatus.next(0);
      return x;
    } catch (error) {
      console.error("Hiba történt a 'Token' lekérése közben", error);
      //with behaviorsubject
      this.errorStatus.next(error.status);
      this.errorHandler();
      this.thisError = error.error.substring(10, 23);
      if (this.thisError.toString() == "invalid_grant") {
        this.prompt.errorToast("Hibás felhasználónév vagy jelszó!");
        this.logout();
      }
    }
  }

  public async renewToken(refresh_token: string): Promise<Token> {
    this.institute = await this.getInstituteFromStorage();

    try {
      const params = {
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token',
        'institute_code': this.institute.InstituteCode,
        'client_id': '919e0c1c-76a2-4646-a2fb-7085bbbf3c56'
      }

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      }

      let response = await this.http.post(this.institute.Url + "/idp/api/v1/Token", params, headers);

      let x = <Token>JSON.parse(response.data);

      this.decoded_user = this.jwtDecoder.decodeToken(x.access_token);
      this.initializeFirebase(this.decoded_user["kreta:institute_user_id"]);
      this.errorStatus.next(0);
      return x;
    } catch (error) {
      console.error("Hiba a 'Token' lekérése közben: ", error);
      this.errorStatus.next(await error.status);
      this.errorHandler();
    }
  }
  //#endregion

  //#region KRÉTA->GET
  public async getStudent(fromDate: string, toDate: string): Promise<Student> {
    this.institute = await this.getInstituteFromStorage();
    let urlPath = '/mapi/api/v1/Student';

    let cacheDataIf = await this.cache.getCacheIf(this.institute.Url + urlPath + '?fromDate=' + fromDate + '&toDate=' + toDate);

    if (cacheDataIf == false) {
      await this.loginIfNotYetLoggedIn();
      console.log("[KRETA] Refreshing Student...");
      this.prompt.butteredToast('[KRETA] Refreshing Student...');
      let headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + this.access_token,
      }
      try {
        let response = await this.http.get(this.institute.Url + urlPath + '?fromDate=' + fromDate + '&toDate=' + toDate, null, headers);
        let x = <Student>JSON.parse(response.data);

        //cache
        //removing old cached data
        let a;
        this.studentKey = (a = await this.storage.get('studentKey')) != null ? a : "";
        this.cache.clearCacheByKey(this.studentKey);

        this.studentKey = this.institute.Url + urlPath + '?fromDate=' + fromDate + "&toDate=" + toDate;
        await this.storage.set('studentKey', this.studentKey);
        await this.cache.setCache(this.institute.Url + urlPath + '?fromDate=' + fromDate + '&toDate=' + toDate, x);

        return x;
      }
      catch (error) {
        console.error("Hiba a tanuló lekérdezése közben", error);
        this.errorStatus.next(await error.status);
        this.errorHandler();
      }
    } else {
      return <Student>cacheDataIf;
    }
  }

  public async getLesson(fromDate: string, toDate: string, skipCache: boolean = false): Promise<Lesson[]> {
    this.institute = await this.getInstituteFromStorage();
    let urlPath = '/mapi/api/v1/LessonAmi';

    let cacheDataIf = await this.cache.getCacheIf(this.institute.Url + urlPath + '?fromDate=' + fromDate + '&toDate=' + toDate);

    if (skipCache) {
      cacheDataIf = false;
      console.log("[KRETA] Skipping cache");
      this.prompt.butteredToast('[KRETA] Skipping cache');
    }

    if (cacheDataIf == false) {

      await this.loginIfNotYetLoggedIn();

      const headers = {
        'Authorization': 'Bearer ' + this.access_token,
        'Accept': 'application/json'
      }
      fromDate = fromDate || "";
      toDate = toDate || "";

      try {
        console.log('[KRETA] Refreshing Lesson...');
        this.prompt.butteredToast('[KRETA] Refreshing Lesson...');

        let response = await this.http.get(this.institute.Url + urlPath + "?fromDate=" + fromDate + "&toDate=" + toDate, null, headers);

        let responseData = <Lesson[]>JSON.parse(response.data);

        if (!skipCache) {
          //cache
          //removing old cached data
          let a;
          this.cache.clearCacheByKey(this.lessonKey);
          this.lessonKey = (a = await this.storage.get('lessonKey')) != null ? a : "";

          this.lessonKey = this.institute.Url + urlPath + '?fromDate=' + fromDate + "&toDate=" + toDate;
          await this.storage.set('lessonKey', this.lessonKey);
          await this.cache.setCache(this.institute.Url + urlPath + '?fromDate=' + fromDate + "&toDate=" + toDate, responseData);
        }

        return responseData;
      } catch (error) {
        console.error("Hiba történt a 'Lesson' lekérése közben: ", error);
        this.errorStatus.next(await error.status);
        this.errorHandler();
      }
      this.antiSpam.click("lesson");
    } else {
      return <Lesson[]>cacheDataIf;
    }
  }

  public async getStudentHomeworks(fromDate: string = null, toDate: string = null, homeworkId: number = null): Promise<StudentHomework[]> {
    //gets the student homeworks from fromDate to toDate (if homeworkId is null), or gets the student homework(s) using the homeworkId
    this.institute = await this.getInstituteFromStorage();

    if (homeworkId == null) {
      //getting student homeworks from fromDate to toDate
      interface homeworkId {
        homeworkId: string;
        lessonName: string;
      };
      let homeworkIds: homeworkId[] = [];
      let homeworks: StudentHomework[] = [];
      let dailyHomeworks: StudentHomework[] = [];

      //getting the lessons from given date to given date (skipping cache on it)
      let lessons: Lesson[] = await this.getLesson(fromDate, toDate, true);

      //cache
      let c: any = false;

      c = await this.cache.getCacheIf(this.institute.Url + "/mapi/api/v1/HaziFeladat/TanuloHaziFeladatLista/?fromDate=" + fromDate + "&toDate=" + toDate);


      //getting HAZIFELADATIDs from lessons (https://github.com/boapps/e-kreta-api-docs#user-content-tanul%C3%B3i-h%C3%A1zi-feladat-lek%C3%A9r%C3%A9se)
      lessons.forEach(lesson => {
        if (lesson.IsTanuloHaziFeladatEnabled == true && lesson.TeacherHomeworkId != null) {
          homeworkIds.push({ homeworkId: lesson.TeacherHomeworkId, lessonName: lesson.Subject });
        }
      });

      if (c == false) {
        const headers = {
          'Authorization': 'Bearer ' + this.access_token
        }

        try {
          console.log('[KRETA] Refreshing Student Homeworks (' + homeworkIds.length + ')...');
          this.prompt.butteredToast('[KRETA] Refreshing Student Homeworks (' + homeworkIds.length + ')...');

          homeworkIds.forEach(async currentHomeworkId => {
            let response = await this.http.get(this.institute.Url + "/mapi/api/v1/HaziFeladat/TanuloHaziFeladatLista/" + currentHomeworkId.homeworkId, null, headers);
            dailyHomeworks = <StudentHomework[]>JSON.parse(response.data);
            dailyHomeworks.forEach(homework => {
              homework.Tantargy = currentHomeworkId.lessonName;
              homeworks.push(homework);
            });
          });



          //cache
          //removing old cached data
          let a;
          this.cache.clearCacheByKey(this.studentHomeworkKey);
          this.studentHomeworkKey = (a = await this.storage.get('studentHomeworkKey')) != null ? a : "";

          this.studentHomeworkKey = this.institute.Url + '/mapi/api/v1/HaziFeladat/TanuloHaziFeladatLista/?fromDate=' + fromDate + "&toDate=" + toDate;
          await this.storage.set('teacherHomeworkKey', this.studentHomeworkKey);
          await this.cache.setCache(this.institute.Url + '/mapi/api/v1/HaziFeladat/TanuloHaziFeladatLista/?fromDate=' + fromDate + "&toDate=" + toDate, homeworks);

          return homeworks;
        } catch (error) {
          console.error("Hiba történt a 'TanuloHaziFeladat' lekérése közben: ", error);
          this.errorStatus.next(await error.status);
          this.errorHandler();
        }
      } else {
        return c;
      }
    } else {
      await this.loginIfNotYetLoggedIn();
      let homeworks: StudentHomework[];
      //getting student homeworks by id (caching unnecessary)
      const headers = {
        'Authorization': 'Bearer ' + this.access_token
      }

      try {
        console.log('[KRETA] Getting Student Homework by id (' + homeworkId + ')...');
        this.prompt.butteredToast('[KRETA] Getting Student Homework by id (' + homeworkId + ')...');

        let response = await this.http.get(this.institute.Url + "/mapi/api/v1/HaziFeladat/TanuloHaziFeladatLista/" + homeworkId, null, headers);
        homeworks = <StudentHomework[]>JSON.parse(response.data);

        return homeworks;
      } catch (error) {
        console.error("Hiba történt a 'TanuloHaziFeladat' lekérése közben: ", error);
        this.errorStatus.next(await error.status);
        this.errorHandler();
      }
    }
  }

  public async getTeacherHomeworks(fromDate: string, toDate: string, homeworkId: number = null): Promise<TeacherHomework[]> {
    //gets the teacher homeworks from fromDate to toDate (if homeworkId is null), or gets the teacher homework(s) using the homeworkId
    this.institute = await this.getInstituteFromStorage();

    if (homeworkId == null) {
      let homeworkIds: string[] = [];
      let homeworks: TeacherHomework[] = [];

      //getting the lessons from given date to given date (skipping cache on it)
      let lessons: Lesson[] = await this.getLesson(fromDate, toDate, true);

      //cache
      let c: any = false;

      c = await this.cache.getCacheIf(this.institute.Url + "/mapi/api/v1/HaziFeladat/TanarHaziFeladat/?fromDate=" + fromDate + "&toDate=" + toDate);


      //getting HAZIFELADATIDs from lessons (https://github.com/boapps/e-kreta-api-docs#user-content-tanul%C3%B3i-h%C3%A1zi-feladat-lek%C3%A9r%C3%A9se)
      lessons.forEach(lesson => {
        if (lesson.TeacherHomeworkId != null) {
          homeworkIds.push(lesson.TeacherHomeworkId);
        }
      });

      if (c == false) {
        const headers = {
          'Authorization': 'Bearer ' + this.access_token
        }

        try {
          console.log('[KRETA] Refreshing Teacher Homeworks (' + homeworkIds.length + ')...');
          this.prompt.butteredToast('[KRETA] Refreshing Teacher Homeworks (' + homeworkIds.length + ')...');

          homeworkIds.forEach(async homeworkId => {
            let response = await this.http.get(this.institute.Url + "/mapi/api/v1/HaziFeladat/TanarHaziFeladat/" + homeworkId, null, headers);
            homeworks.push(<TeacherHomework>JSON.parse(response.data));
          });



          //cache
          //removing old cached data
          let a;
          this.cache.clearCacheByKey(this.teacherHomeworkKey);
          this.teacherHomeworkKey = (a = await this.storage.get('teacherHomeworkKey')) != null ? a : "";

          this.teacherHomeworkKey = this.institute.Url + '/mapi/api/v1/HaziFeladat/TanarHaziFeladat/?fromDate=' + fromDate + "&toDate=" + toDate;
          await this.storage.set('teacherHomeworkKey', this.teacherHomeworkKey);
          await this.cache.setCache(this.institute.Url + '/mapi/api/v1/HaziFeladat/TanarHaziFeladat/?fromDate=' + fromDate + "&toDate=" + toDate, homeworks);

          return homeworks;
        } catch (error) {
          console.error("Hiba történt a 'TanarHaziFeladat' lekérése közben: ", error);
          this.errorStatus.next(await error.status);
          this.errorHandler();
        }
      } else {
        return c;
      }
    } else {
      await this.loginIfNotYetLoggedIn();
      let homeworks: TeacherHomework[] = [];
      //getting teacher homeworks by id (caching unnecessary)
      const headers = {
        'Authorization': 'Bearer ' + this.access_token
      }

      try {
        console.log('[KRETA] Getting Teacher Homework by id (' + homeworkId + ')...');
        this.prompt.butteredToast('[KRETA] Getting Teacher Homework by id (' + homeworkId + ')...');

        let response = await this.http.get(this.institute.Url + "/mapi/api/v1/HaziFeladat/TanarHaziFeladat/" + homeworkId, null, headers);

        //because the api sometimes sends back an html error
        if (response.data.indexOf("<!DOCTYPE html>") == -1) {
          homeworks.push(<TeacherHomework>JSON.parse(response.data));
        } else {
          homeworks = [];
        }

        return homeworks;
      } catch (error) {
        console.error("Hiba történt a 'TanarHaziFeladat' lekérése közben: ", error);
        this.errorStatus.next(await error.status);
        this.errorHandler();
      }
    }
  }

  public async getTests(fromDate: string, toDate: string): Promise<Test[]> {
    await this.loginIfNotYetLoggedIn();
    this.institute = await this.getInstituteFromStorage();

    let cacheDataIf = await this.cache.getCacheIf(this.institute.Url + '/mapi/api/v1/BejelentettSzamonkeresAmi?fromDate=' + fromDate + '&toDate=' + toDate);

    if (cacheDataIf == false) {

      await this.loginIfNotYetLoggedIn();

      const headers = {
        'Authorization': 'Bearer ' + this.access_token,
        'Accept': 'application/json'
      }
      fromDate = fromDate || "";
      toDate = toDate || "";

      try {
        console.log('[KRETA] Refreshing Tests...');
        this.prompt.butteredToast('[KRETA] Refreshing Tests...');

        let response = await this.http.get(this.institute.Url + "/mapi/api/v1/BejelentettSzamonkeresAmi?fromDate=" + fromDate + "&toDate=" + toDate, null, headers);

        let responseData = <Test[]>JSON.parse(response.data);

        //cache
        //removing old cached data
        let a;
        this.testKey = (a = await this.storage.get('testKey')) != null ? a : "";
        this.cache.clearCacheByKey(this.lessonKey);

        this.testKey = this.institute.Url + '/mapi/api/v1/BejelentettSzamonkeresAmi?fromDate=' + fromDate + "&toDate=" + toDate;
        await this.storage.set('', this.testKey);
        await this.cache.setCache(this.institute.Url + '/mapi/api/v1/BejelentettSzamonkeresAmi?fromDate=' + fromDate + "&toDate=" + toDate, responseData);

        return responseData;
      } catch (error) {
        console.error("Hiba történt a 'Számonkérések' lekérése közben: ", error);
        this.errorStatus.next(await error.status);
        this.errorHandler();
      }
      this.antiSpam.click("lesson");
    } else {
      return <Test[]>cacheDataIf;
    }
  }

  public async getInstituteList(): Promise<Institute[]> {
    let cacheDataIf = await this.cache.getCacheIf("https://kretaglobalmobileapi.ekreta.hu/api/v1/Institute");

    if (cacheDataIf == false) {
      try {
        console.log("[KRETA] Refreshing institute list");
        this.prompt.butteredToast('[KRETA] Refreshing institute list');
        const headers = {
          'apiKey': '7856d350-1fda-45f5-822d-e1a2f3f1acf0'
        }

        let response = await this.http.get("https://kretaglobalmobileapi.ekreta.hu/api/v1/Institute", null, headers);


        let responseData: Institute[];
        responseData = <Institute[]>JSON.parse(response.data);

        //cache
        //removing old cached data
        let a;
        this.cache.clearCacheByKey(this.instituteKey);
        this.instituteKey = (a = await this.storage.get('instituteKey')) != null ? a : "";

        this.instituteKey = 'https://kretaglobalmobileapi.ekreta.hu/api/v1/Institute';
        await this.storage.set('instituteKey', this.instituteKey);
        await this.cache.setCache('https://kretaglobalmobileapi.ekreta.hu/api/v1/Institute', responseData);

        return responseData;
      }
      catch (error) {
        this.errorStatus.next(error.status);
        this.errorHandler;
      }
    } else {
      return <Institute[]>cacheDataIf;
    }
  }

  public async getMobileVersionInfo(): Promise<MobileVersionInfo> {
    try {
      let response = await this.http.get('https://kretamobile.blob.core.windows.net/configuration/EllenorzoMobilVersionInfo.json', null, null);
      return <MobileVersionInfo>JSON.parse(response.data);
    } catch (error) {
      this.errorStatus.next(error.status);
      this.errorHandler();
    }
  }

  public async getKretaLink(): Promise<string> {
    //it returns 4 links (DEV, TEST, UAT, PROD), I'm only catching the PROD one

    try {
      let response = await this.http.get('https://kretamobile.blob.core.windows.net/configuration/ConfigurationDescriptor.json', null, null);
      return JSON.parse(response.data).GlobalMobileApiUrlPROD;
    } catch (error) {
      this.errorStatus.next(error.status);
      this.errorHandler();
    }
  }
  //#endregion

  //#region KRÉTA->POST
  public async addStudentHomework(lesson: Lesson | any, text: string): Promise<HomeworkResponse> {
    await this.loginIfNotYetLoggedIn();
    let OraId = lesson.lessonId;
    //"2020. 01. 17. 0:00:00"
    let OraDate = lesson.StartTime;
    let OraType = lesson.CalendarOraType;
    let HataridoUtc = this.fDate.getWeekLastUTC();

    //getting teacher homeworks by id (caching unnecessary)
    const headers = {
      'Authorization': 'Bearer ' + this.access_token,
      'Content-Type': 'application/json; charset=utf-8'
    }
    const params = {
      'OraId': OraId,
      'OraDate': OraDate,
      'OraType': OraType,
      'HataridoUtc': HataridoUtc,
      'FeladatSzovege': text,
    }

    try {
      console.log('[KRETA] Adding Student homework');
      this.prompt.butteredToast('[KRETA] Adding Student homework');

      let response = await this.http.post(this.institute.Url + '/mapi/api/v1/HaziFeladat/CreateTanuloHaziFeladat/', params, headers);

      return <HomeworkResponse>JSON.parse(response.data);
    } catch (error) {
      console.error("Hiba történt a Tanuló házi feladat hozzáadása közben: ", error);
      this.errorStatus.next(await error.status);
      this.errorHandler();
    }
  }
  //#endregion

  //#region KRÉTA->DELETE
  public async deleteStudentHomework(id: number) {
    await this.loginIfNotYetLoggedIn();
    //the id isn't the TeacherHomeworkId, rather the id you get from getStudentHomeworks()
    try {
      console.log('[KRETA] Deleting student homework (' + id + ')');
      this.prompt.butteredToast('[KRETA] Deleting student homework (' + id + ')');
      const headers = {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + this.access_token,
        'Content-Type': 'application/json; charset=utf-8'
      }

      let response = await this.http.delete(this.institute.Url + '/mapi/api/v1/HaziFeladat/DeleteTanuloHaziFeladat/' + id, null, headers);
      return true;
    } catch (error) {
      console.error("Hiba történt a Tanuló házi feladat törlése közben: ", error);
      this.errorStatus.next(await error.status);
      this.errorHandler();
      return false;
    }
  }
  //#endregion
}
