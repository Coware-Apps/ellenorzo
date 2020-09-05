import { Injectable } from "@angular/core";
import { Lesson } from "../_models/kreta-v2/lesson";
import { Student, SubjectAverage, evaluation } from "../_models/kreta-v2/student";
import { Token, DecodedUser } from "../_models/token";
import { Storage } from "@ionic/storage";
import { CacheService } from "./cache.service";
import { HTTP } from "@ionic-native/http/ngx";
import { BehaviorSubject } from "rxjs";
import { StudentHomework, TeacherHomework, HomeworkResponse } from "../_models/kreta-v2/homework";
import { Institute } from "../_models/institute";
import { Test } from "../_models/kreta-v2/test";
import { FormattedDateService } from "./formatted-date.service";
import { JwtDecodeHelper } from "../_helpers/jwt-decode-helper";
import { PromptService } from "./prompt.service";
import { AppService } from "./app.service";
import { Message } from "../_models/kreta-v2/message";
import { TranslateService } from "@ngx-translate/core";
import { Event } from "../_models/kreta-v2/event";
import { Platform } from "@ionic/angular";
import { File } from "@ionic-native/file/ngx";
import { FileTransfer } from "@ionic-native/file-transfer/ngx";
import { AndroidPermissions } from "@ionic-native/android-permissions/ngx";
import { stringify } from "querystring";
import { WeighedAvgCalcService } from "./weighed-avg-calc.service";
import {
    KretaInvalidResponseError,
    KretaInvalidGrantError,
    KretaNetworkError,
    KretaTokenError,
    KretaHttpError,
    KretaRenewTokenError,
} from "../_exceptions/kreta-exception";
import { FirebaseService } from "./firebase.service";

@Injectable({
    providedIn: "root",
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
        private firebase: FirebaseService,
        private jwtDecoder: JwtDecodeHelper,
        private prompt: PromptService,
        private app: AppService,
        private translator: TranslateService,
        private transfer: FileTransfer,
        private file: File,
        private platform: Platform,
        private androidPermissions: AndroidPermissions,
        private WAC: WeighedAvgCalcService
    ) {
        this.errorHandler();
    }

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
                    this.prompt.errorToast(this.translator.instant("services.kreta.httpErrors.-4"));
                    break;
                case -3:
                    this.prompt.errorToast(this.translator.instant("services.kreta.httpErrors.-3"));
                    break;
                case -2:
                    this.prompt.errorToast(this.translator.instant("services.kreta.httpErrors.-2"));
                    break;
                case -1:
                    this.prompt.errorToast(this.translator.instant("services.kreta.httpErrors.-1"));
                    break;

                //server errors
                case 400:
                    this.prompt.errorToast(
                        this.translator.instant("services.kreta.httpErrors.400")
                    );
                    break;
                case 403:
                    this.prompt.errorToast(
                        this.translator.instant("services.kreta.httpErrors.403")
                    );
                    break;
                case 69420:
                    //known KRÉTA errors
                    this.prompt.errorToast(
                        this.translator.instant("services.kreta.httpErrors.69420")
                    );

                    break;
                case 401:
                    this.prompt.errorToast(
                        this.translator.instant("services.kreta.httpErrors.401")
                    );
                    break;

                default:
                    if (error >= 500 && 600 > error) {
                        this.prompt.errorToast(
                            this.translator.instant("services.kreta.httpErrors.defaultServerSide")
                        );
                    } else {
                        this.prompt.errorToast(
                            this.translator.instant("services.kreta.httpErrors.defaultClientSide", {
                                error: error,
                            })
                        );
                    }
                    break;
            }
        });
    }
    protected basicErrorHandler(
        queryName: string,
        error,
        customTitleTranslatorKey?: string,
        customTextTranslatorKey?: string
    ) {
        if (error instanceof SyntaxError) throw new KretaInvalidResponseError(queryName);
        if (error.status && error.status < 0) throw new KretaNetworkError(queryName);
        if (error.status && error.status == 401) throw new KretaInvalidGrantError(queryName, error);

        throw new KretaHttpError(
            queryName,
            error,
            customTitleTranslatorKey,
            customTextTranslatorKey
        );
    }
    //#endregion

    //#region KRÉTA->Login
    public async getToken(
        username: string,
        password: string,
        institute: Institute
    ): Promise<Token> {
        let response;
        try {
            const headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "User-Agent": this.app.userAgent,
            };
            const params = {
                userName: username,
                password: password,
                institute_code: institute.instituteCode,
                grant_type: "password",
                client_id: "919e0c1c-76a2-4646-a2fb-7085bbbf3c56",
            };

            this.prompt.butteredToast("[KRETA->getToken()]");

            response = await this.http.post(institute.url + "/idp/api/v1/Token", params, headers);
            let parsedResponse: Token;
            parsedResponse = <Token>JSON.parse(response.data);

            this.prompt.butteredToast("[KRETA->getToken() result]" + parsedResponse);
            //success
            this.decoded_user = this.jwtDecoder.decodeToken(parsedResponse.access_token);

            this.errorStatus.next(0);
            return parsedResponse;
        } catch (error) {
            console.error("Hiba történt a 'Token' lekérése közben", error);
            if (error instanceof SyntaxError) throw new KretaInvalidResponseError("getToken");
            if (error.status && error.status == 401)
                throw new KretaInvalidGrantError("getToken", error);
            if (error.status && error.status < 0) throw new KretaNetworkError("getToken");
            throw new KretaTokenError(error, "getToken.title", "getToken.text");
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
                refresh_token: refresh_token,
                grant_type: "refresh_token",
                institute_code: institute.instituteCode,
                client_id: "919e0c1c-76a2-4646-a2fb-7085bbbf3c56",
            };

            const headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": this.app.userAgent,
            };

            let response = await this.http.post(
                institute.url + "/idp/api/v1/Token",
                params,
                headers
            );

            let parsedResponse: Token;
            parsedResponse = <Token>JSON.parse(response.data);

            console.log("refresh", parsedResponse.refresh_token);

            this.decoded_user = this.jwtDecoder.decodeToken(parsedResponse.access_token);
            this.errorStatus.next(0);
            return parsedResponse;
        } catch (error) {
            if (error instanceof SyntaxError) throw new KretaInvalidResponseError("renewToken");
            if (error.status && error.status < 0) throw new KretaNetworkError("renewToken");
            throw new KretaRenewTokenError(error, "renewToken.title", "renewToken.text");
        }
    }
    //#endregion

    //#region KRÉTA->GET
    public async getStudent(
        fromDate: string,
        toDate: string,
        forceRefresh: boolean = false,
        tokens: Token,
        institute: Institute,
        cacheId: string
    ): Promise<Student> {
        let urlPath = "/mapi/api/v1/StudentAmi";
        let cacheDataIf: any = false;
        if (!forceRefresh) {
            cacheDataIf = await this.cache.getCacheIf(cacheId);
        }

        if (cacheDataIf == false) {
            this.prompt.butteredToast("[KRETA] Refreshing Student...");
            let headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                Authorization: "Bearer " + tokens.access_token,
                "User-Agent": this.app.userAgent,
            };
            try {
                let response = await this.http.get(
                    institute.url + urlPath + "?fromDate=" + fromDate + "&toDate=" + toDate,
                    null,
                    headers
                );
                let parsedResponse = <Student>JSON.parse(response.data);

                parsedResponse.SubjectAverages = [];
                let subjectsWithGrades: { subject: string; evaluations: evaluation[] }[] = [];
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
                        if (
                            sg.evaluations[i].Form != "Mark" ||
                            sg.evaluations[i].Type != "MidYear" ||
                            sg.evaluations[i].IsAtlagbaBeleszamit == false ||
                            sg.evaluations[i].NumberValue == 0
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
            } catch (error) {
                this.basicErrorHandler(
                    "getStudent()",
                    error,
                    "getStudent.title",
                    "getStudent.text"
                );
                console.error("Hiba a tanuló lekérdezése közben", error);
            }
        } else {
            return <Student>cacheDataIf;
        }
    }

    public async getLesson(
        fromDate: string,
        toDate: string,
        skipCache: boolean = false,
        tokens: Token,
        institute: Institute,
        cacheId: string
    ): Promise<Lesson[]> {
        let urlPath = "/mapi/api/v1/LessonAmi";

        let cacheDataIf = await this.cache.getCacheIf(cacheId);

        if (skipCache) {
            cacheDataIf = false;
            this.prompt.butteredToast("[KRETA] Skipping cache");
        }

        if (cacheDataIf == false) {
            const headers = {
                Authorization: "Bearer " + tokens.access_token,
                Accept: "application/json",
                "User-Agent": this.app.userAgent,
            };

            try {
                this.prompt.butteredToast("[KRETA] Refreshing Lesson...");

                let traceStart = new Date().valueOf();
                let response = await this.http.get(
                    institute.url + urlPath + "?fromDate=" + fromDate + "&toDate=" + toDate,
                    null,
                    headers
                );
                let traceEnd = new Date().valueOf();
                let requestTime = traceEnd - traceStart;
                let storedTimetableTrace: number[] = await this.storage.get("timetableTrace");
                storedTimetableTrace = storedTimetableTrace == null ? [] : storedTimetableTrace;
                storedTimetableTrace.reverse();
                storedTimetableTrace.push(requestTime);
                storedTimetableTrace.reverse();
                await this.storage.set("timetableTrace", storedTimetableTrace.slice(0, 20));

                let responseData = <Lesson[]>JSON.parse(response.data);

                if (!skipCache) {
                    //cache
                    this.cache.clearCacheByKey(cacheId);
                    await this.cache.setCache(cacheId, responseData);
                }
                return responseData;
            } catch (error) {
                console.error("Hiba történt a 'Lesson' lekérése közben: ", error);
                this.basicErrorHandler("getLesson()", error, "getLesson.title", "getLesson.text");
            }
        } else {
            return <Lesson[]>cacheDataIf;
        }
    }

    public async getStudentHomeworks(
        fromDate: string = null,
        toDate: string = null,
        homeworkId: number = null,
        tokens: Token,
        institute: Institute,
        cacheId: string
    ): Promise<StudentHomework[]> {
        //gets the student homeworks from fromDate to toDate (if homeworkId is null), or gets the student homework(s) using the homeworkId

        if (homeworkId == null) {
            //getting student homeworks from fromDate to toDate
            interface homeworkId {
                homeworkId: string;
                lessonName: string;
            }
            let homeworkIds: homeworkId[] = [];
            let homeworks: StudentHomework[] = [];
            let dailyHomeworks: StudentHomework[] = [];

            //getting the lessons from given date to given date (skipping cache on it)
            let lessons: Lesson[] = await this.getLesson(
                fromDate,
                toDate,
                true,
                tokens,
                institute,
                cacheId
            );

            //cache
            let cacheDataIf: any = false;

            cacheDataIf = await this.cache.getCacheIf(cacheId);

            //getting HAZIFELADATIDs from lessons (https://github.com/boapps/e-kreta-api-docs#user-content-tanul%C3%B3i-h%C3%A1zi-feladat-lek%C3%A9r%C3%A9se)
            lessons.forEach(lesson => {
                if (lesson.IsTanuloHaziFeladatEnabled == true && lesson.TeacherHomeworkId != null) {
                    homeworkIds.push({
                        homeworkId: lesson.TeacherHomeworkId,
                        lessonName: lesson.Subject,
                    });
                }
            });

            if (cacheDataIf == false) {
                const headers = {
                    Authorization: "Bearer " + tokens.access_token,
                    "User-Agent": this.app.userAgent,
                };

                try {
                    this.prompt.butteredToast(
                        "[KRETA] Refreshing Student Homeworks (" + homeworkIds.length + ")..."
                    );

                    homeworkIds.forEach(async currentHomeworkId => {
                        let response = await this.http.get(
                            institute.url +
                                "/mapi/api/v1/HaziFeladat/TanuloHaziFeladatLista/" +
                                currentHomeworkId.homeworkId,
                            null,
                            headers
                        );
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
                    this.basicErrorHandler(
                        "getStudentHomeworks()",
                        error,
                        "getStudentHomeworks.title",
                        "getStudentHomeworks.text"
                    );
                }
            } else {
                return cacheDataIf;
            }
        } else {
            let homeworks: StudentHomework[];
            //getting student homeworks by id (caching unnecessary)
            const headers = {
                Authorization: "Bearer " + tokens.access_token,
                "User-Agent": this.app.userAgent,
            };

            try {
                this.prompt.butteredToast(
                    "[KRETA] Getting Student Homework by id (" + homeworkId + ")..."
                );

                let response = await this.http.get(
                    institute.url + "/mapi/api/v1/HaziFeladat/TanuloHaziFeladatLista/" + homeworkId,
                    null,
                    headers
                );
                homeworks = <StudentHomework[]>JSON.parse(response.data);

                return homeworks;
            } catch (error) {
                console.error("Hiba történt a 'TanuloHaziFeladat' lekérése közben: ", error);
                this.basicErrorHandler(
                    "getStudentHomeworks()",
                    error,
                    "getStudentHomeworks.title",
                    "getStudentHomeworks.text"
                );
            }
        }
    }

    public async getTeacherHomeworks(
        fromDate: string,
        toDate: string,
        homeworkId: number = null,
        tokens: Token,
        institute: Institute,
        cacheId: string
    ): Promise<TeacherHomework[]> {
        //gets the teacher homeworks from fromDate to toDate (if homeworkId is null), or gets the teacher homework(s) using the homeworkId

        if (homeworkId == null) {
            let homeworkIds: string[] = [];
            let homeworks: TeacherHomework[] = [];

            //getting the lessons from given date to given date (skipping cache on it)
            let lessons: Lesson[] = await this.getLesson(
                fromDate,
                toDate,
                true,
                tokens,
                institute,
                cacheId
            );

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
                    Authorization: "Bearer " + tokens.access_token,
                    "User-Agent": this.app.userAgent,
                };

                try {
                    this.prompt.butteredToast(
                        "[KRETA] Refreshing Teacher Homeworks (" + homeworkIds.length + ")..."
                    );

                    homeworkIds.forEach(async homeworkId => {
                        let response = await this.http.get(
                            institute.url +
                                "/mapi/api/v1/HaziFeladat/TanarHaziFeladat/" +
                                homeworkId,
                            null,
                            headers
                        );
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
                    this.basicErrorHandler(
                        "getTeacherHomeworks()",
                        error,
                        "getTeacherHomeworks.title",
                        "getTeacherHomeworks.text"
                    );
                }
            } else {
                return cacheDataIf;
            }
        } else {
            let homeworks: TeacherHomework[] = [];
            //getting teacher homeworks by id (caching unnecessary)
            const headers = {
                Authorization: "Bearer " + tokens.access_token,
                "User-Agent": this.app.userAgent,
            };

            try {
                this.prompt.butteredToast(
                    "[KRETA] Getting Teacher Homework by id (" + homeworkId + ")..."
                );

                let response = await this.http.get(
                    institute.url + "/mapi/api/v1/HaziFeladat/TanarHaziFeladat/" + homeworkId,
                    null,
                    headers
                );

                //because the api sometimes sends back an html error
                if (response.data.indexOf("<!DOCTYPE html>") == -1) {
                    homeworks.push(<TeacherHomework>JSON.parse(response.data));
                } else {
                    homeworks = [];
                }

                return homeworks;
            } catch (error) {
                console.error("Hiba történt a 'TanarHaziFeladat' lekérése közben: ", error);
                this.basicErrorHandler(
                    "getTeacherHomeworks()",
                    error,
                    "getTeacherHomeworks.title",
                    "getTeacherHomeworks.text"
                );
            }
        }
    }

    public async changeHomeworkState(
        done: boolean,
        teacherHomeworkId: number,
        tokens: Token,
        institute: Institute
    ) {
        this.firebase.logEvent("change_homework_state", { done: done });

        let response;
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
                "User-Agent": this.app.userAgent,
                Accept: "application/json",
            };
            const params = {
                TanarHaziFeladatId: teacherHomeworkId,
                IsMegoldva: done,
            };

            this.http.setDataSerializer("json");

            response = await this.http.post(
                `${institute.url}/mapi/api/v1/HaziFeladat/Megoldva`,
                params,
                headers
            );
        } catch (error) {
            console.error(error);
            this.basicErrorHandler(
                "getTeacherHomeworks()",
                error,
                "getTeacherHomeworks.title",
                "getTeacherHomeworks.text"
            );
        } finally {
            this.http.setDataSerializer("urlencoded");
        }
    }

    public async getTests(
        fromDate: string,
        toDate: string,
        forceRefresh: boolean = false,
        skipCache: boolean = false,
        tokens: Token,
        institute: Institute,
        cacheId: string
    ): Promise<Test[]> {
        let cacheDataIf: any = false;
        if (!forceRefresh && !skipCache) {
            cacheDataIf = await this.cache.getCacheIf(cacheId);
        }

        if (cacheDataIf == false) {
            const headers = {
                Authorization: "Bearer " + tokens.access_token,
                Accept: "application/json",
                "User-Agent": this.app.userAgent,
            };
            fromDate = fromDate || "";
            toDate = toDate || "";

            try {
                this.prompt.butteredToast("[KRETA] Refreshing Tests...");

                let response = await this.http.get(
                    institute.url +
                        "/mapi/api/v1/BejelentettSzamonkeresAmi?fromDate=" +
                        fromDate +
                        "&toDate=" +
                        toDate,
                    null,
                    headers
                );

                let responseData = <Test[]>JSON.parse(response.data);

                //cache
                //removing old cached data
                if (!skipCache) {
                    this.cache.clearCacheByKey(cacheId);
                    await this.cache.setCache(cacheId, responseData);
                }

                return responseData;
            } catch (error) {
                console.error("Hiba történt a 'Számonkérések' lekérése közben: ", error);
                this.basicErrorHandler("getTests()", error, "getTests.title", "getTests.text");
            }
        } else {
            return <Test[]>cacheDataIf;
        }
    }

    public async getEvents(tokens: Token, institute: Institute): Promise<Event[]> {
        try {
            const headers = {
                Accept: `application/json`,
                "User-Agent": this.app.userAgent,
                Authorization: `Bearer ${tokens.access_token}`,
            };
            let response = await this.http.get(
                `${institute.url}/mapi/api/v1/EventAmi`,
                null,
                headers
            );
            let responseData = <Event[]>JSON.parse(response.data);
            return responseData;
        } catch (error) {
            console.error("An error occured during the Events request", error);
            this.basicErrorHandler("getEvents()", error, "getEvents.title", "getEvents.text");
        }
    }

    public async getInstituteList(): Promise<Institute[]> {
        let cacheKey = `_instituteData`;
        let cacheDataIf = await this.cache.getCacheIf(cacheKey);

        if (cacheDataIf == false) {
            try {
                this.prompt.butteredToast("[KRETA] Refreshing institute list");
                const headers = {
                    apiKey: "7856d350-1fda-45f5-822d-e1a2f3f1acf0",
                };

                let response = await this.http.get(
                    "https://kretaglobalmobileapi.ekreta.hu/api/v1/Institute",
                    null,
                    headers
                );

                let responseData: Institute[];
                responseData = <Institute[]>JSON.parse(response.data);

                //cache
                //removing old cached data
                let a;
                this.cache.clearCacheByKey(cacheKey);
                await this.cache.setCache(cacheKey, responseData);

                return responseData;
            } catch (error) {
                console.error("Error getting institute list", error),
                    this.basicErrorHandler(
                        "getInstituteList()",
                        error,
                        "getInstituteList.title",
                        "getInstituteList.text"
                    );
            }
        } else {
            return <Institute[]>cacheDataIf;
        }
    }

    public async getMessageList(
        forceRefresh: boolean = false,
        tokens: Token,
        cacheId: string
    ): Promise<Message[]> {
        let cacheDataIf: any = false;
        if (!forceRefresh) {
            cacheDataIf = await this.cache.getCacheIf(cacheId);
        }

        if (cacheDataIf == false) {
            try {
                const headers = {
                    Accept: "application/json",
                    "User-Agent": this.app.userAgent,
                    Authorization: "Bearer " + tokens.access_token,
                };

                let response = await this.http.get(
                    "https://eugyintezes.e-kreta.hu/integration-kretamobile-api/v1/kommunikacio/postaladaelemek/sajat",
                    null,
                    headers
                );
                let msgList = <Message[]>JSON.parse(response.data);

                this.cache.setCache(cacheId, msgList);
                return msgList;
            } catch (error) {
                console.error(error);
                this.basicErrorHandler(
                    "getMessageList()",
                    error,
                    "getMessageList.title",
                    "getMessageList.text"
                );
            }
        } else {
            return <Message[]>cacheDataIf;
        }
    }

    public async getMessage(messageId: number, tokens: Token): Promise<Message> {
        try {
            const headers = {
                Accept: "application/json",
                "User-Agent": this.app.userAgent,
                Authorization: "Bearer " + tokens.access_token,
            };

            let response = await this.http.get(
                `https://eugyintezes.e-kreta.hu/integration-kretamobile-api/v1/kommunikacio/postaladaelemek/${messageId}`,
                null,
                headers
            );
            let msg = <Message>JSON.parse(response.data);
            return msg;
        } catch (error) {
            console.error("Error trying to get message", error);
            this.basicErrorHandler("getMessage()", error, "getMessage.title", "getMessage.text");
        }
    }

    public async setMessageAsRead(messageId: number, tokens: Token): Promise<void> {
        let consoleText = "[KRETA -> setMessageAsRead]";
        try {
            const headers = {
                Accept: "application/json",
                "User-Agent": this.app.userAgent,
                Authorization: "Bearer " + tokens.access_token,
                "Accept-Encoding": "gzip",
                "Content-type": "application/json; charset=utf-8",
            };

            let params = {
                isOlvasott: true,
                uzenetAzonositoLista: [messageId],
            };

            this.http.setDataSerializer("json");

            let response = await this.http.post(
                "https://eugyintezes.e-kreta.hu/integration-kretamobile-api/v1/kommunikacio/uzenetek/olvasott",
                params,
                headers
            );

            let res = response;
        } catch (error) {
            console.error(consoleText, error);
            this.basicErrorHandler(
                "setMessageAsRead()",
                error,
                "setMessageAsRead.title",
                "setMessageAsRead.text"
            );
        } finally {
            this.http.setDataSerializer("urlencoded");
        }
    }
    //#endregion

    //#region KRÉTA->POST
    public async addStudentHomework(
        lesson: Lesson | any,
        text: string,
        tokens: Token,
        institute: Institute
    ): Promise<HomeworkResponse> {
        this.firebase.logEvent("add_student_homework");

        let OraId = lesson.lessonId;
        //"2020. 01. 17. 0:00:00"
        let OraDate = lesson.StartTime;
        let OraType = lesson.CalendarOraType;
        let HataridoUtc = this.fDate.getWeekLastUTC();

        //getting teacher homeworks by id (caching unnecessary)
        const headers = {
            Authorization: "Bearer " + tokens.access_token,
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": this.app.userAgent,
        };
        const params = {
            OraId: OraId,
            OraDate: OraDate,
            OraType: OraType,
            HataridoUtc: HataridoUtc,
            FeladatSzovege: text,
        };

        try {
            this.prompt.butteredToast("[KRETA] Adding Student homework");

            let response = await this.http.post(
                institute.url + "/mapi/api/v1/HaziFeladat/CreateTanuloHaziFeladat/",
                params,
                headers
            );

            return <HomeworkResponse>JSON.parse(response.data);
        } catch (error) {
            console.error("Hiba történt a Tanuló házi feladat hozzáadása közben: ", error);
            this.basicErrorHandler(
                "addStudentHomework()",
                error,
                "addStudentHomework.title",
                "addStudentHomework.text"
            );
        }
    }
    //#endregion

    //#region KRÉTA->DELETE
    public async deleteStudentHomework(
        id: number,
        tokens: Token,
        institute: Institute
    ): Promise<boolean> {
        this.firebase.logEvent("delete_student_homework");
        //the id isn't the TeacherHomeworkId, rather the id you get from getStudentHomeworks()
        try {
            this.prompt.butteredToast("[KRETA] Deleting student homework (" + id + ")");
            const headers = {
                Accept: "application/json",
                Authorization: "Bearer " + tokens.access_token,
                "Content-Type": "application/json; charset=utf-8",
                "User-Agent": this.app.userAgent,
            };

            let response = await this.http.delete(
                institute.url + "/mapi/api/v1/HaziFeladat/DeleteTanuloHaziFeladat/" + id,
                null,
                headers
            );
            return true;
        } catch (error) {
            console.error("Hiba történt a Tanuló házi feladat törlése közben: ", error);
            this.basicErrorHandler(
                "deleteStudentHomework()",
                error,
                "deleteStudentHomework.title",
                "deleteStudentHomework.text"
            );
        }
    }
    //#endregion

    //#region Push-notifications (deprecated)
    public async getFcmToken(): Promise<string> {
        let currentToken = await this.firebase.getToken();
        return currentToken;
    }

    public async subscribeToNotifications(
        tokens: Token,
        institute: Institute,
        cacheId: string
    ): Promise<string> {
        try {
            const headers = {
                Accept: "application/json",
                apiKey: "7856d350-1fda-45f5-822d-e1a2f3f1acf0",
                Authorization: "bearer " + tokens.access_token,
                "Accept-Encoding": "gzip",
            };
            let params = {
                InstituteCode: institute.instituteCode,
                InstituteUserId: this.decoded_user["kreta:institute_user_id"],
                TutelaryId: "",
                Platform: "Gcm",
                NotificationType: "All",
                NotificationRole: "Student",
                NotificationSource: "Kreta",
                NotificationEnvironment: "Ellenorzo_Xamarin",
                SchoolYearId: (
                    await this.getStudent(
                        this.fDate.getDate("thisYearBegin"),
                        this.fDate.getDate("today"),
                        false,
                        tokens,
                        institute,
                        cacheId
                    )
                ).SchoolYearId,
                Handle: await this.getFcmToken(),
            };

            let httpResponse = await this.http.post(
                "https://kretaglobalmobileapi2.ekreta.hu/api/v2/Registration",
                params,
                headers
            );

            this.registrationId = <string>JSON.parse(httpResponse.data).registrationId;
            return this.registrationId;
        } catch (error) {
            console.error("Hiba történt a feliratkozás közben", error);
        }
    }

    public async unsubscribeFromNotifications(
        tokens: Token,
        institute: Institute,
        cacheId: string
    ) {
        try {
            const headers = {
                Accept: "application/json",
                apiKey: "7856d350-1fda-45f5-822d-e1a2f3f1acf0",
                Authorization: "bearer " + tokens.access_token,
                "Accept-Encoding": "gzip",
            };
            let params = {
                registrationId: this.registrationId,
                NotificationSource: "Kreta",
                NotificationEnvironment: "Ellenorzo_Xamarin",
                SchoolYearId: (
                    await this.getStudent(
                        this.fDate.getDate("thisYearBegin"),
                        this.fDate.getDate("today"),
                        false,
                        tokens,
                        institute,
                        cacheId
                    )
                ).SchoolYearId,
            };

            let httpResponse = await this.http.delete(
                "https://kretaglobalmobileapi2.ekreta.hu/api/v2/Registration",
                params,
                headers
            );
        } catch (error) {
            console.error("Hiba történt a feliratkozás közben", error);
        }
    }
    //#endregion

    //#region KRÉTA->UA Lab
    public async getLessonLAB(
        fromDate: string,
        toDate: string,
        userAgent: string,
        tokens: Token,
        institute: Institute
    ): Promise<number> {
        let urlPath = "/mapi/api/v1/LessonAmi";

        const headers = {
            Authorization: "Bearer " + tokens.access_token,
            Accept: "application/json",
            "User-Agent": userAgent,
        };

        try {
            this.prompt.butteredToast("[KRETA] Refreshing Lesson...");

            let traceStart = new Date().valueOf();
            await this.http.get(
                institute.url + urlPath + "?fromDate=" + fromDate + "&toDate=" + toDate,
                null,
                headers
            );
            let traceEnd = new Date().valueOf();

            return traceEnd - traceStart;
        } catch (error) {
            console.error("Hiba történt a 'Lesson LAB' lekérése közben: ", error);
            this.basicErrorHandler(
                "getLessonLAB()",
                error,
                "getLessonLAB.title",
                "getLessonLAB.text"
            );
        }
    }
    //#endregion

    //#region KRÉTA->DOWNLOAD (deprecated due to administration API)
    public async getMessageFile(
        fileId: number,
        fileName: string,
        fileExtension: string,
        tokens: Token
    ): Promise<string> {
        let fileTransfer = this.transfer.create();
        let uri = `https://eugyintezes.e-kreta.hu/integration-kretamobile-api/v1/dokumentumok/uzenetek/${fileId}`;
        let fullFileName = fileName + "." + fileExtension;
        try {
            let url;
            await this.platform.ready().then(async x => {
                let entry = await fileTransfer.download(
                    uri,
                    (await this.getDownloadPath()) + fullFileName,
                    false,
                    {
                        headers: {
                            Authorization: `Bearer ${tokens.access_token}`,
                            "User-Agent": this.app.userAgent,
                        },
                    }
                );
                url = entry.nativeURL;
            });
            return url;
        } catch (error) {
            console.error("Error trying to get file", error);
            this.firebase.logError(`[KRETA->getMessageFile()]: ` + stringify(error));
            this.prompt.toast(
                this.translator.instant("services.kreta.cantDownloadText", {
                    fileName: fullFileName,
                }),
                true
            );
        }
    }
    //(deprecated due to administration API)
    public async getDownloadPath() {
        if (this.platform.is("ios")) {
            return this.file.documentsDirectory;
        }

        await this.androidPermissions
            .checkPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
            .then(result => {
                if (!result.hasPermission) {
                    this.androidPermissions.requestPermission(
                        this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE
                    );
                }
            });

        return this.file.dataDirectory;
    } //#endregion
}
