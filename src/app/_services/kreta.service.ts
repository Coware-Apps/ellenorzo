import { Injectable } from '@angular/core';
import { Lesson } from '../_models/lesson';
import { Student, SubjectAverage, evaluation } from '../_models/student';
import { Token, DecodedUser } from '../_models/token';
import { Storage } from '@ionic/storage';
import { CacheService } from './cache.service';
import { HTTP } from '@ionic-native/http/ngx';
import { BehaviorSubject } from 'rxjs';
import { StudentHomework, TeacherHomework, HomeworkResponse } from '../_models/homework';
import { Institute } from '../_models/institute';
import { Test } from '../_models/test';
import { FormattedDateService } from './formatted-date.service';
import { MobileVersionInfo } from '../_models/mobileVersionInfo';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { JwtDecodeHelper } from '../_helpers/jwt-decode-helper';
import { IsDebug } from '@ionic-native/is-debug/ngx';
import { PromptService } from './prompt.service';
import { AppService } from './app.service';
import { Message } from '../_models/message';
import { TranslateService } from '@ngx-translate/core';
import { Event } from '../_models/event';
import { Platform } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { stringify } from 'querystring';
import { WeighedAvgCalcService } from './weighed-avg-calc.service';
import { KretaInvalidResponseError, KretaInvalidGrantError, KretaNetworkError, KretaTokenError, KretaHttpError } from '../_exceptions/kreta-exception';



@Injectable({
  providedIn: 'root'
})
export class KretaService {

  public errorStatus = new BehaviorSubject(0);
  public decoded_user: DecodedUser;
  public registrationId: string;

  constructor(
    private http: HTTP,
    private storage: Storage,
    private cache: CacheService,
    private fDate: FormattedDateService,
    private firebase: FirebaseX,
    private jwtDecoder: JwtDecodeHelper,
    private isDebug: IsDebug,
    private prompt: PromptService,
    private app: AppService,
    private translator: TranslateService,
    private transfer: FileTransfer,
    private file: File,
    private platform: Platform,
    private androidPermissions: AndroidPermissions,
    private WAC: WeighedAvgCalcService,
  ) {
    this.errorHandler();
  }


  //#region Sub-functions and other 
  public async initializeFirebase(userId) {
    if (await this.isDebug.getIsDebug() || await this.storage.get('analyticsCollectionEnabled') == false) {
      this.firebase.setAnalyticsCollectionEnabled(false);
      console.log("[FIREBASE] Anonymus statistics are off");
      this.prompt.butteredToast("[FIREBASE] Anonymus statistics are off");
    } else {
      //using the userId only for anonymus data collection purposes, but it is required for cross-device syncing
      this.firebase.setAnalyticsCollectionEnabled(true);
      this.firebase.setUserId(userId);
      this.firebase.setCrashlyticsUserId(userId);
      console.log("[FIREBASE] Anonymus statistics are on");
      this.prompt.butteredToast("[FIREBASE] Anonymus statistics are on");
    }

  }
  //#endregion

  //#region Error handling / prompting
  errorHandler() {
    this.errorStatus.subscribe(error => {

      //acquiring new User-Agent on any error
      if (error != 0) {
        this.app.downloadUserAgent();
      }

      switch (error) {

        case 0:
          //successful request
          break;

        //client side / plugin error
        case -4:
          this.prompt.errorToast(this.translator.instant('services.kreta.httpErrors.-4'));
          break;
        case -3:
          this.prompt.errorToast(this.translator.instant('services.kreta.httpErrors.-3'));
          break;
        case -2:
          this.prompt.errorToast(this.translator.instant('services.kreta.httpErrors.-2'));
          break;
        case -1:
          this.prompt.errorToast(this.translator.instant('services.kreta.httpErrors.-1'));
          break;

        //server errors
        case 400:
          this.prompt.errorToast(this.translator.instant('services.kreta.httpErrors.400'));
          break;
        case 403:
          this.prompt.errorToast(this.translator.instant('services.kreta.httpErrors.403'));
          break;
        case 69420:
          //known KRÉTA errors
          this.prompt.errorToast(this.translator.instant('services.kreta.httpErrors.69420'));

          break;
        case 401:
          this.prompt.errorToast(this.translator.instant('services.kreta.httpErrors.401'));
          break;

        default:
          if (error >= 500 && 600 > error) {
            this.prompt.errorToast(this.translator.instant('services.kreta.httpErrors.defaultServerSide'));
          } else {
            this.prompt.errorToast(this.translator.instant('services.kreta.httpErrors.defaultClientSide',
              { error: error }));
          }
          break;
      }
    })
  }
  //#endregion

  //#region KRÉTA->Login
  public async getToken(username: string, password: string, institute: Institute): Promise<Token> {
    let response;
    try {
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': this.app.userAgent,
      };
      const params = {
        'userName': username,
        'password': password,
        'institute_code': institute.InstituteCode,
        'grant_type': 'password',
        'client_id': '919e0c1c-76a2-4646-a2fb-7085bbbf3c56'
      }

      this.prompt.butteredToast("[KRETA->getToken()]");

      response = await this.http.post(institute.Url + "/idp/api/v1/Token", params, headers);
      console.log('tokenResponse', response);
      let parsedResponse: Token;
      parsedResponse = <Token>JSON.parse(response.data);

      this.prompt.butteredToast("[KRETA->getToken() result]" + parsedResponse);
      console.log("[KRETA->getToken()] result: ", parsedResponse);
      //success
      this.decoded_user = this.jwtDecoder.decodeToken(parsedResponse.access_token);
      this.initializeFirebase(this.decoded_user["kreta:institute_user_id"]);
      this.errorStatus.next(0);
      return parsedResponse;
    } catch (error) {
      console.error("Hiba történt a 'Token' lekérése közben", error);
      this.app.downloadUserAgent();

      if (error instanceof SyntaxError) throw new KretaInvalidResponseError('getToken', response);
      if (error.status && error.status == 401) throw new KretaInvalidGrantError('getToken', error);
      if (error.status && error.status < 0) throw new KretaNetworkError('getToken');
      throw new KretaTokenError(error, 'getToken.title', 'getToken.text');
    }
  }

  /**
   * Gets new tokens {access_token, refresh_token, expires_in, token_type} with a refresh_token
   * @param refresh_token the refresh token needed to request a new access_token
   * @param institute the user's institute of which the url is needed for the api request
   * @returns {Promise} Promise that resolves to the new `Token` object on success and to `null` on error
   */
  public async renewToken(refresh_token: string, institute: Institute): Promise<Token> {
    try {
      const params = {
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token',
        'institute_code': institute.InstituteCode,
        'client_id': '919e0c1c-76a2-4646-a2fb-7085bbbf3c56'
      }

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.app.userAgent,
      }

      console.log(`[KRETA->renewToken()] renewing tokens with refreshToken`, refresh_token)

      let response = await this.http.post(institute.Url + "/idp/api/v1/Token", params, headers);

      let parsedResponse: Token;
      try {
        parsedResponse = <Token>JSON.parse(response.data);
      } catch (error) {
        this.prompt.presentUniversalAlert(
          this.translator.instant('services.kreta.invalidJSONResponseAlert.header'),
          this.translator.instant('services.kreta.invalidJSONResponseAlert.subHeader'),
          this.translator.instant('services.kreta.invalidJSONResponseAlert.message'),
        );
        this.firebase.logError(`[KRETA->renewToken()->JSON.parse()]: ` + stringify(error));
      }

      this.decoded_user = this.jwtDecoder.decodeToken(parsedResponse.access_token);
      this.initializeFirebase(this.decoded_user["kreta:institute_user_id"]);
      this.errorStatus.next(0);
      return parsedResponse;
    } catch (error) {
      console.error("Hiba a 'Token' lekérése közben: ", error);
      this.firebase.logError(`[KRETA->renewToken()->HTTP]: ` + stringify(error));
      this.app.downloadUserAgent();
      return null;
    }
  }
  //#endregion

  //#region KRÉTA->GET
  public async getStudent(fromDate: string, toDate: string, forceRefresh: boolean = false, tokens: Token, institute: Institute, cacheId: string): Promise<Student> {
    let urlPath = '/mapi/api/v1/StudentAmi';
    let cacheDataIf: any = false;
    if (!forceRefresh) {
      cacheDataIf = await this.cache.getCacheIf(cacheId);
    }

    if (cacheDataIf == false) {
      this.prompt.butteredToast('[KRETA] Refreshing Student...');
      let headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + tokens.access_token,
        'User-Agent': this.app.userAgent,
      }
      console.log('STUDENT HEADERS', headers);
      try {
        let response = await this.http.get(institute.Url + urlPath + '?fromDate=' + fromDate + '&toDate=' + toDate, null, headers);
        let parsedResponse = <Student>JSON.parse(response.data);

        parsedResponse.SubjectAverages = [];
        let subjectsWithGrades: { subject: string, evaluations: evaluation[] }[] = [];
        parsedResponse.Evaluations.forEach(e => {
          let alreadyAdded = false;
          for (let i = 0; i < subjectsWithGrades.length; i++) {
            if (subjectsWithGrades[i].subject == e.Subject) {
              alreadyAdded = true;
              subjectsWithGrades[i].evaluations.push(e);
            }
          }
          if (!alreadyAdded) {
            subjectsWithGrades.push({
              evaluations: [e],
              subject: e.Subject,
            });
          }
        });

        subjectsWithGrades.forEach(sg => {
          for (let i = 0; i < sg.evaluations.length; i++) {
            if (sg.evaluations[i].Form != 'Mark'
              || sg.evaluations[i].Type != 'MidYear'
              || sg.evaluations[i].IsAtlagbaBeleszamit == false
              || sg.evaluations[i].NumberValue == 0
            ) {
              sg.evaluations.splice(i, 1);
            }
          }
          if (sg.subject != null && sg.evaluations.length > 0) {
            parsedResponse.SubjectAverages.push({
              ClassValue: 0,
              Difference: 0,
              Subject: sg.subject,
              Value: Math.round(this.WAC.average(sg.evaluations) * 100) / 100,
            });
          }
        });

        //cache
        //removing old cached data
        this.cache.clearCacheByKey(cacheId);
        await this.cache.setCache(cacheId, parsedResponse);

        return parsedResponse;
      }
      catch (error) {
        console.error("Hiba a tanuló lekérdezése közben", error);
        this.firebase.logError(`[KRETA->getStudent()]: ` + stringify(error));
        this.errorStatus.next(await error.status);
      }
    } else {
      return <Student>cacheDataIf;
    }
  }

  public async getLesson(fromDate: string, toDate: string, skipCache: boolean = false, tokens: Token, institute: Institute, cacheId: string): Promise<Lesson[]> {
    let urlPath = '/mapi/api/v1/LessonAmi';

    let cacheDataIf = await this.cache.getCacheIf(cacheId);

    if (skipCache) {
      cacheDataIf = false;
      console.log("[KRETA] Skipping cache");
      this.prompt.butteredToast('[KRETA] Skipping cache');
    }

    if (cacheDataIf == false) {
      const headers = {
        'Authorization': 'Bearer ' + tokens.access_token,
        'Accept': 'application/json',
        'User-Agent': this.app.userAgent,
      }

      try {
        console.log('[KRETA] Refreshing Lesson...');
        this.prompt.butteredToast('[KRETA] Refreshing Lesson...');

        let traceStart = new Date().valueOf();
        let response = await this.http.get(institute.Url + urlPath + "?fromDate=" + fromDate + "&toDate=" + toDate, null, headers);
        let traceEnd = new Date().valueOf();
        let requestTime = traceEnd - traceStart;
        let storedTimetableTrace: number[] = await this.storage.get('timetableTrace');
        storedTimetableTrace = storedTimetableTrace == null ? [] : storedTimetableTrace;
        storedTimetableTrace.reverse();
        storedTimetableTrace.push(requestTime);
        storedTimetableTrace.reverse();
        await this.storage.set('timetableTrace', storedTimetableTrace.slice(0, 20));


        let responseData = <Lesson[]>JSON.parse(response.data);

        if (!skipCache) {
          //cache
          this.cache.clearCacheByKey(cacheId);
          await this.cache.setCache(cacheId, responseData);
        }
        return responseData;
      } catch (error) {
        console.error("Hiba történt a 'Lesson' lekérése közben: ", error);
        this.firebase.logError(`[KRETA->getLesson()]: ` + stringify(error));
        this.errorStatus.next(await error.status);
      }
    } else {
      return <Lesson[]>cacheDataIf;
    }
  }

  public async getStudentHomeworks(fromDate: string = null, toDate: string = null, homeworkId: number = null, tokens: Token, institute: Institute, cacheId: string): Promise<StudentHomework[]> {
    //gets the student homeworks from fromDate to toDate (if homeworkId is null), or gets the student homework(s) using the homeworkId

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
      let lessons: Lesson[] = await this.getLesson(fromDate, toDate, true, tokens, institute, cacheId);

      //cache
      let cacheDataIf: any = false;

      cacheDataIf = await this.cache.getCacheIf(cacheId);

      //getting HAZIFELADATIDs from lessons (https://github.com/boapps/e-kreta-api-docs#user-content-tanul%C3%B3i-h%C3%A1zi-feladat-lek%C3%A9r%C3%A9se)
      lessons.forEach(lesson => {
        if (lesson.IsTanuloHaziFeladatEnabled == true && lesson.TeacherHomeworkId != null) {
          homeworkIds.push({ homeworkId: lesson.TeacherHomeworkId, lessonName: lesson.Subject });
        }
      });

      if (cacheDataIf == false) {
        const headers = {
          'Authorization': 'Bearer ' + tokens.access_token,
          'User-Agent': this.app.userAgent,
        }

        try {
          console.log('[KRETA] Refreshing Student Homeworks (' + homeworkIds.length + ')...');
          this.prompt.butteredToast('[KRETA] Refreshing Student Homeworks (' + homeworkIds.length + ')...');

          homeworkIds.forEach(async currentHomeworkId => {
            let response = await this.http.get(institute.Url + "/mapi/api/v1/HaziFeladat/TanuloHaziFeladatLista/" + currentHomeworkId.homeworkId, null, headers);
            dailyHomeworks = <StudentHomework[]>JSON.parse(response.data);
            dailyHomeworks.forEach(homework => {
              homework.Tantargy = currentHomeworkId.lessonName;
              homeworks.push(homework);
            });
          });



          //cache
          let a;
          this.cache.clearCacheByKey(cacheId);
          await this.cache.setCache(cacheId, homeworks);

          return homeworks;
        } catch (error) {
          console.error("Hiba történt a 'TanuloHaziFeladat' lekérése közben: ", error);
          this.firebase.logError(`[KRETA->getStudentHomeworks()]: ` + stringify(error));
          this.errorStatus.next(await error.status);
        }
      } else {
        return cacheDataIf;
      }
    } else {
      let homeworks: StudentHomework[];
      //getting student homeworks by id (caching unnecessary)
      const headers = {
        'Authorization': 'Bearer ' + tokens.access_token,
        'User-Agent': this.app.userAgent,
      }

      try {
        console.log('[KRETA] Getting Student Homework by id (' + homeworkId + ')...');
        this.prompt.butteredToast('[KRETA] Getting Student Homework by id (' + homeworkId + ')...');

        let response = await this.http.get(institute.Url + "/mapi/api/v1/HaziFeladat/TanuloHaziFeladatLista/" + homeworkId, null, headers);
        homeworks = <StudentHomework[]>JSON.parse(response.data);

        return homeworks;
      } catch (error) {
        console.error("Hiba történt a 'TanuloHaziFeladat' lekérése közben: ", error);
        this.firebase.logError(`[KRETA->getStudentHomeworks()]: ` + stringify(error));
        this.errorStatus.next(await error.status);
      }
    }
  }

  public async getTeacherHomeworks(fromDate: string, toDate: string, homeworkId: number = null, tokens: Token, institute: Institute, cacheId: string): Promise<TeacherHomework[]> {
    //gets the teacher homeworks from fromDate to toDate (if homeworkId is null), or gets the teacher homework(s) using the homeworkId

    if (homeworkId == null) {
      let homeworkIds: string[] = [];
      let homeworks: TeacherHomework[] = [];

      //getting the lessons from given date to given date (skipping cache on it)
      let lessons: Lesson[] = await this.getLesson(fromDate, toDate, true, tokens, institute, cacheId);

      //cache
      let cacheDataIf: any = false;

      cacheDataIf = await this.cache.getCacheIf(cacheId);

      //getting HAZIFELADATIDs from lessons
      lessons.forEach(lesson => {
        if (lesson.TeacherHomeworkId != null) {
          homeworkIds.push(lesson.TeacherHomeworkId);
        }
      });

      if (cacheDataIf == false) {
        const headers = {
          'Authorization': 'Bearer ' + tokens.access_token,
          'User-Agent': this.app.userAgent,
        }

        try {
          console.log('[KRETA] Refreshing Teacher Homeworks (' + homeworkIds.length + ')...');
          this.prompt.butteredToast('[KRETA] Refreshing Teacher Homeworks (' + homeworkIds.length + ')...');

          homeworkIds.forEach(async homeworkId => {
            let response = await this.http.get(institute.Url + "/mapi/api/v1/HaziFeladat/TanarHaziFeladat/" + homeworkId, null, headers);
            homeworks.push(<TeacherHomework>JSON.parse(response.data));
          });



          //cache
          //removing old cached data
          let a;
          this.cache.clearCacheByKey(cacheId);
          await this.cache.setCache(cacheId, homeworks);

          return homeworks;
        } catch (error) {
          console.error("Hiba történt a 'TanarHaziFeladat' lekérése közben: ", error);
          this.firebase.logError(`[KRETA->getTeacherHomeworks()]: ` + stringify(error));
          this.errorStatus.next(await error.status);
        }
      } else {
        return cacheDataIf;
      }
    } else {
      let homeworks: TeacherHomework[] = [];
      //getting teacher homeworks by id (caching unnecessary)
      const headers = {
        'Authorization': 'Bearer ' + tokens.access_token,
        'User-Agent': this.app.userAgent,
      }

      try {
        console.log('[KRETA] Getting Teacher Homework by id (' + homeworkId + ')...');
        this.prompt.butteredToast('[KRETA] Getting Teacher Homework by id (' + homeworkId + ')...');

        let response = await this.http.get(institute.Url + "/mapi/api/v1/HaziFeladat/TanarHaziFeladat/" + homeworkId, null, headers);

        //because the api sometimes sends back an html error
        if (response.data.indexOf("<!DOCTYPE html>") == -1) {
          homeworks.push(<TeacherHomework>JSON.parse(response.data));
        } else {
          homeworks = [];
        }

        return homeworks;
      } catch (error) {
        console.error("Hiba történt a 'TanarHaziFeladat' lekérése közben: ", error);
        this.firebase.logError(`[KRETA->getTeacherHomeworks()]: ` + stringify(error));
        this.errorStatus.next(await error.status);
      }
    }
  }

  public async changeHomeworkState(done: boolean, teacherHomeworkId: number, tokens: Token, institute: Institute) {
    let response;
    try {
      console.log(`[KRETA->changeHomeworkState()] Changing homework state to ${done}`)
      const headers = {
        Authorization: `Bearer ${tokens.access_token}`,
        'User-Agent': this.app.userAgent,
        Accept: 'application/json'
      }
      const params = {
        TanarHaziFeladatId: teacherHomeworkId,
        IsMegoldva: done
      }

      this.http.setDataSerializer('json');

      response = await this.http.post(`${institute.Url}/mapi/api/v1/HaziFeladat/Megoldva`, params, headers);

    } catch (error) {
      console.error(error);
      this.errorStatus.next(error.status);
      if (error instanceof SyntaxError) throw new KretaInvalidResponseError('changeHomeworkState', response);
      if (error.status && error.status == 401) throw new KretaInvalidGrantError('changeHomeworkState', error);
      if (error.status && error.status < 0) throw new KretaNetworkError('getToken');
      throw new KretaHttpError('changeHomeworkState', response, 'changeHomeworkState.title', 'changeHomeworkState.text')
    } finally {
      this.http.setDataSerializer('urlencoded');
    }
  }

  public async getTests(fromDate: string, toDate: string, forceRefresh: boolean = false, tokens: Token, institute: Institute, cacheId: string): Promise<Test[]> {
    let cacheDataIf: any = false;
    if (!forceRefresh) {
      let cacheDataIf = await this.cache.getCacheIf(cacheId);
    }

    if (cacheDataIf == false) {

      const headers = {
        'Authorization': 'Bearer ' + tokens.access_token,
        'Accept': 'application/json',
        'User-Agent': this.app.userAgent,
      }
      fromDate = fromDate || "";
      toDate = toDate || "";

      try {
        console.log('[KRETA] Refreshing Tests...');
        this.prompt.butteredToast('[KRETA] Refreshing Tests...');

        let response = await this.http.get(institute.Url + "/mapi/api/v1/BejelentettSzamonkeresAmi?fromDate=" + fromDate + "&toDate=" + toDate, null, headers);

        let responseData = <Test[]>JSON.parse(response.data);

        //cache
        //removing old cached data
        this.cache.clearCacheByKey(cacheId);
        await this.cache.setCache(cacheId, responseData);

        return responseData;
      } catch (error) {
        console.error("Hiba történt a 'Számonkérések' lekérése közben: ", error);
        this.firebase.logError(`[KRETA->getTests()]: ` + stringify(error));
        this.errorStatus.next(await error.status);
      }
    } else {
      return <Test[]>cacheDataIf;
    }
  }

  public async getEvents(tokens: Token, institute: Institute): Promise<Event[]> {
    try {
      const headers = {
        Accept: `application/json`,
        'User-Agent': this.app.userAgent,
        Authorization: `Bearer ${tokens.access_token}`
      }
      let response = await this.http.get(`${institute.Url}/mapi/api/v1/EventAmi`, null, headers);
      let responseData = <Event[]>JSON.parse(response.data);
      return responseData;
    } catch (error) {
      console.error("An error occured during the Events request", error);
      this.firebase.logError(`[KRETA->getEvents()]: ` + stringify(error));
      this.errorStatus.next(error.status)
    }
  }

  public async getInstituteList(): Promise<Institute[]> {
    let cacheKey = `_instituteData`
    let cacheDataIf = await this.cache.getCacheIf(cacheKey);

    if (cacheDataIf == false) {
      try {
        console.log("[KRETA] Refreshing institute list");
        this.prompt.butteredToast('[KRETA] Refreshing institute list');
        const headers = {
          'apiKey': '7856d350-1fda-45f5-822d-e1a2f3f1acf0',
        }

        let response = await this.http.get("https://kretaglobalmobileapi.ekreta.hu/api/v1/Institute", null, headers);


        let responseData: Institute[];
        responseData = <Institute[]>JSON.parse(response.data);

        //cache
        //removing old cached data
        let a;
        this.cache.clearCacheByKey(cacheKey);
        await this.cache.setCache(cacheKey, responseData);

        return responseData;
      }
      catch (error) {
        console.error('Error getting institute list', error),
          this.firebase.logError(`[KRETA->getInstituteList()]: ` + stringify(error));
        this.errorStatus.next(error.status);
      }
    } else {
      return <Institute[]>cacheDataIf;
    }
  }

  public async getMessageList(forceRefresh: boolean = false, tokens: Token, cacheId: string): Promise<Message[]> {
    let cacheDataIf: any = false;
    if (!forceRefresh) {
      cacheDataIf = await this.cache.getCacheIf(cacheId);
    }

    if (cacheDataIf == false) {
      try {
        const headers = {
          "Accept": "application/json",
          "User-Agent": this.app.userAgent,
          "Authorization": "Bearer " + tokens.access_token,
        }

        let response = await this.http.get("https://eugyintezes.e-kreta.hu/integration-kretamobile-api/v1/kommunikacio/postaladaelemek/sajat", null, headers);
        console.log('msgList', response);
        let msgList = <Message[]>JSON.parse(response.data)

        this.cache.setCache(cacheId, msgList);
        return msgList;
      } catch (error) {
        console.error(error);
        this.firebase.logError(`[KRETA->getMessageList()]: ` + stringify(error));
        //this.prompt.presentUniversalAlert("Üzenet a fejlesztőtől", "KRÉTA szerver oldali limitáció", "A krétások nemrég elkezdtek valamit fejleszteni az e-üzenetek API-n. A hivatalos appban sem működik (csak ott nem mutat hibaüzenetet sem, egyszerűen nem frissíti az üzenetek listáját...) Szándékomban áll jelezni feléjük, hogy a funkcióra a felhasználóknak szüksége van és igyekezni kéne a javítással. Üdv. 3niXboi")
        this.errorStatus.next(error.status);
      }
    } else {
      return <Message[]>cacheDataIf;
    }
  }

  public async getMessage(messageId: number, tokens: Token): Promise<Message> {
    try {
      const headers = {
        "Accept": "application/json",
        "User-Agent": this.app.userAgent,
        "Authorization": "Bearer " + tokens.access_token,
      }

      let response = await this.http.get(`https://eugyintezes.e-kreta.hu/integration-kretamobile-api/v1/kommunikacio/postaladaelemek/${messageId}`, null, headers);
      let msg = <Message>JSON.parse(response.data)
      return msg;
    } catch (error) {
      console.error('Error trying to get message', error);
      this.firebase.logError(`[KRETA->getMessage()]: ` + stringify(error));
      this.errorStatus.next(error.status);
    }
  }

  public async setMessageAsRead(messageId: number, tokens: Token): Promise<void> {
    let consoleText = '[KRETA -> setMessageAsRead]';
    try {
      const headers = {
        "Accept": "application/json",
        "User-Agent": this.app.userAgent,
        "Authorization": "Bearer " + tokens.access_token,
        "Accept-Encoding": "gzip",
        "Content-type": "application/json; charset=utf-8"
      }

      let params = {
        'isOlvasott': true,
        'uzenetAzonositoLista': [messageId],
      }

      this.http.setDataSerializer("json");

      console.log(consoleText + " params: ", params);
      console.log(consoleText + " headers: ", headers);


      let response = await this.http.post("https://eugyintezes.e-kreta.hu/integration-kretamobile-api/v1/kommunikacio/uzenetek/olvasott", params, headers);

      let res = response;
      console.log('res', res);
    } catch (error) {
      console.error(consoleText, error);
      this.firebase.logError(`[KRETA->setMessageAsRead()]: ` + stringify(error));
      this.errorStatus.next(error.status);
    } finally {
      this.http.setDataSerializer("urlencoded");
    }
  }

  public async getMobileVersionInfo(): Promise<MobileVersionInfo> {
    try {
      let response = await this.http.get('https://kretamobile.blob.core.windows.net/configuration/EllenorzoMobilVersionInfo.json', null, null);
      return <MobileVersionInfo>JSON.parse(response.data);
    } catch (error) {
      this.errorStatus.next(error.status);
      this.firebase.logError(`[KRETA->getMobileVersionInfo()]: ` + stringify(error));
    }
  }

  public async getKretaLink(): Promise<string> {
    //it returns 4 links (DEV, TEST, UAT, PROD), I'm only catching the PROD one

    try {
      let response = await this.http.get('https://kretamobile.blob.core.windows.net/configuration/ConfigurationDescriptor.json', null, null);
      return JSON.parse(response.data).GlobalMobileApiUrlPROD;
    } catch (error) {
      this.errorStatus.next(error.status);
      this.firebase.logError(`[KRETA->getKretaLink()]: ` + stringify(error));
    }
  }
  //#endregion

  //#region KRÉTA->POST
  public async addStudentHomework(lesson: Lesson | any, text: string, tokens: Token, institute: Institute): Promise<HomeworkResponse> {
    let OraId = lesson.lessonId;
    //"2020. 01. 17. 0:00:00"
    let OraDate = lesson.StartTime;
    let OraType = lesson.CalendarOraType;
    let HataridoUtc = this.fDate.getWeekLastUTC();

    //getting teacher homeworks by id (caching unnecessary)
    const headers = {
      'Authorization': 'Bearer ' + tokens.access_token,
      'Content-Type': 'application/json; charset=utf-8',
      'User-Agent': this.app.userAgent,
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
      console.log('PARAMS', params);
      console.log('HEADERS', headers);
      this.prompt.butteredToast('[KRETA] Adding Student homework');

      let response = await this.http.post(institute.Url + '/mapi/api/v1/HaziFeladat/CreateTanuloHaziFeladat/', params, headers);

      return <HomeworkResponse>JSON.parse(response.data);
    } catch (error) {
      console.error("Hiba történt a Tanuló házi feladat hozzáadása közben: ", error);
      this.firebase.logError(`[KRETA->addStudentHomework()]: ` + stringify(error));
      this.errorStatus.next(await error.status);
    }
  }
  //#endregion

  //#region KRÉTA->DELETE
  public async deleteStudentHomework(id: number, tokens: Token, institute: Institute): Promise<boolean> {
    //the id isn't the TeacherHomeworkId, rather the id you get from getStudentHomeworks()
    try {
      console.log('[KRETA] Deleting student homework (' + id + ')');
      this.prompt.butteredToast('[KRETA] Deleting student homework (' + id + ')');
      const headers = {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + tokens.access_token,
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': this.app.userAgent,
      }

      let response = await this.http.delete(institute.Url + '/mapi/api/v1/HaziFeladat/DeleteTanuloHaziFeladat/' + id, null, headers);
      return true;
    } catch (error) {
      console.error("Hiba történt a Tanuló házi feladat törlése közben: ", error);
      this.firebase.logError(`[KRETA->deleteStudentHomework()]: ` + stringify(error));
      this.errorStatus.next(await error.status);
      return false;
    }
  }
  //#endregion

  //#region Push-notifications (deprecated)
  public async getFcmToken(): Promise<string> {
    let currentToken = await this.firebase.getToken();
    console.log('FMC TOKEN', currentToken);
    return currentToken;
  }

  public async subscribeToNotifications(tokens: Token, institute: Institute, cacheId: string): Promise<string> {
    try {
      const headers = {
        'Accept': 'application/json',
        'apiKey': '7856d350-1fda-45f5-822d-e1a2f3f1acf0',
        'Authorization': 'bearer ' + tokens.access_token,
        'Accept-Encoding': 'gzip'
      }
      let params = {
        'InstituteCode': institute.InstituteCode,
        'InstituteUserId': this.decoded_user["kreta:institute_user_id"],
        'TutelaryId': '',
        'Platform': 'Gcm',
        'NotificationType': 'All',
        'NotificationRole': 'Student',
        'NotificationSource': 'Kreta',
        'NotificationEnvironment': 'Ellenorzo_Xamarin',
        'SchoolYearId': (await this.getStudent(this.fDate.getDate('thisYearBegin'), this.fDate.getDate('today'), false, tokens, institute, cacheId)).SchoolYearId,
        'Handle': await this.getFcmToken(),
      }

      console.log('Student refreshed, waiting for push response');

      let httpResponse = await this.http.post('https://kretaglobalmobileapi2.ekreta.hu/api/v2/Registration', params, headers);

      this.registrationId = <string>JSON.parse(httpResponse.data).registrationId;
      console.log('Registered, id: ', this.registrationId);
      return this.registrationId;
    } catch (error) {
      console.error('Hiba történt a feliratkozás közben', error);
    }
  }

  public async unsubscribeFromNotifications(tokens: Token, institute: Institute, cacheId: string) {
    try {
      const headers = {
        'Accept': 'application/json',
        'apiKey': '7856d350-1fda-45f5-822d-e1a2f3f1acf0',
        'Authorization': 'bearer ' + tokens.access_token,
        'Accept-Encoding': 'gzip'
      }
      let params = {
        'registrationId': this.registrationId,
        'NotificationSource': 'Kreta',
        'NotificationEnvironment': 'Ellenorzo_Xamarin',
        'SchoolYearId': (await this.getStudent(this.fDate.getDate('thisYearBegin'), this.fDate.getDate('today'), false, tokens, institute, cacheId)).SchoolYearId,
      }

      let httpResponse = await this.http.delete('https://kretaglobalmobileapi2.ekreta.hu/api/v2/Registration', params, headers);
    } catch (error) {
      console.error('Hiba történt a feliratkozás közben', error);
    }
  }
  //#endregion

  //#region KRÉTA->UA Lab
  public async getLessonLAB(fromDate: string, toDate: string, userAgent: string, tokens: Token, institute: Institute): Promise<number> {
    let urlPath = '/mapi/api/v1/LessonAmi';

    const headers = {
      'Authorization': 'Bearer ' + tokens.access_token,
      'Accept': 'application/json',
      'User-Agent': userAgent,
    }

    try {
      console.log('[KRETA] Refreshing Lesson...');
      this.prompt.butteredToast('[KRETA] Refreshing Lesson...');

      let traceStart = new Date().valueOf();
      await this.http.get(institute.Url + urlPath + "?fromDate=" + fromDate + "&toDate=" + toDate, null, headers);
      let traceEnd = new Date().valueOf();

      return (traceEnd - traceStart);
    } catch (error) {
      console.error("Hiba történt a 'Lesson LAB' lekérése közben: ", error);
      this.firebase.logError(`[KRETA->getLessonLAB()]: ` + stringify(error));
      this.errorStatus.next(await error.status);
      return 0;
    }
  }
  //#endregion

  //#region KRÉTA->DOWNLOAD
  public async getMessageFile(fileId: number, fileName: string, fileExtension: string, tokens: Token): Promise<string> {
    let fileTransfer = this.transfer.create();
    let uri = `https://eugyintezes.e-kreta.hu/integration-kretamobile-api/v1/dokumentumok/uzenetek/${fileId}`;
    let fullFileName = fileName + '.' + fileExtension;
    try {
      let url
      await this.platform.ready().then(async x => {
        let entry = await fileTransfer.download(
          uri,
          await this.getDownloadPath() + fullFileName,
          false,
          {
            headers: {
              "Authorization": `Bearer ${tokens.access_token}`,
              "User-Agent": this.app.userAgent,
            }
          }
        )
        console.log('entry', entry);
        url = entry.nativeURL;
      });
      return url;
    } catch (error) {
      console.error('Error trying to get file', error);
      this.firebase.logError(`[KRETA->getMessageFile()]: ` + stringify(error));
      this.prompt.toast(this.translator.instant('services.kreta.cantDownloadText', { fileName: fullFileName }), true);
    }
  }
  public async getDownloadPath() {
    if (this.platform.is('ios')) {
      return this.file.documentsDirectory;
    }

    await this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE).then(
      result => {
        if (!result.hasPermission) {
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE);
        }
      }
    );

    return this.file.dataDirectory;
  }  //#endregion
}
