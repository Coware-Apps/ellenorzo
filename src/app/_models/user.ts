import { Subject, Observable } from "rxjs";
import { Storage } from "@ionic/storage";
import { Test } from "./kreta-v2/test";
import { Message } from "./kreta-v2/message";
import { KretaService } from "../_services/kreta.service";
import { FormattedDateService } from "../_services/formatted-date.service";
import { CacheService } from "../_services/cache.service";
import { Institute } from "./institute";
import { Token } from "./token";
import { Lesson } from "./kreta-v2/lesson";
import { StudentHomework, TeacherHomework, HomeworkResponse } from "./kreta-v2/homework";
import { AppService } from "../_services/app.service";
import { NotificationService } from "../_services/notification.service";
import { PromptService } from "../_services/prompt.service";
import { Event } from "./kreta-v2/event";
import { AdministrationService } from "../_services/administration.service";
import { Addressee, AttachmentToSend, AdministrationMessage } from "./administration/message";
import { AddresseeType } from "./administration/addresseeType";
import { AddresseeListItem } from "./administration/addresseeListItem";
import { KretaV3Service } from "../_services";
export class User {
    //unique data
    public fullName: string;
    public id: number;
    public username: string;
    public yx: string;
    public institute: Institute;
    public role: string;
    //functional data
    public notificationsEnabled: boolean = false;
    public lastNotificationSetTime: number = 0;
    //public allowUpdatesIn = 10;
    public lastLoggedIn: number = 0;
    public lastLoggedInAdministration: number = 0;
    public lastLoggedInV3: number = 0;
    public tokens: Token;
    public administrationTokens: Token;
    public v3Tokens: Token;
    private authDiff: number = 300000;
    private cacheIds: {
        student: string;
        tests: string;
        messageList: string;
        lesson: string;
        studentHomeworks: string;
        teacherHomeworks: string;
        events: string;
        combined: string;
        //administration
        inboxMessageList: string;
        outboxMessageList: string;
        deletedMessageList: string;
        // addresseeTypeList: string;
        // studentAddresseeGroups: string;
        // studentAddresseeClasses: string;
        // parentAddresseeGroups: string;
        // parentAddresseeClasses: string;
        // studentAddresseeList: string;
        // parentAddresseeList: string;
        // teacherAddresseeList: string;
        // headTeacherAddresseeList: string;
        // directorateAddresseeList: string;
        // adminAddresseeList: string;
        // szmkAddresseeList: string;
        //v3
        v3Student: string;
        v3ClassGroups: string;
        v3Absences: string;
        v3Notes: string;
        v3Evaluations: string;
        v3Tests: string;
        v3SchoolYearPlan: string;
        v3Homeworks: string;
        v3Lessons: string;
        v3Averages: string;
        v3HeadTeachers: string;
        v3Events: string;
        v3ClassAverages: string;
    };
    private loginInProgress: boolean = false;

    constructor(
        tokens: Token,
        institute: Institute,
        username: string,
        yx: string,
        private kreta: KretaService,
        private storage: Storage,
        private fDate: FormattedDateService,
        private cache: CacheService,
        private app: AppService,
        private notificationService: NotificationService,
        private prompt: PromptService,
        private administrationService: AdministrationService,
        private kretaV3: KretaV3Service
    ) {
        this.v3Tokens = tokens;
        this.institute = institute;
        this.username = username;
        this.yx = yx;
    }

    //#region user data manipulation
    /**
     * Logs in with the users current refresh token if needed (the token's expires_in minus the user's authDiff passes)
     */
    public async loginWithRefreshToken(toApi: "mobile" | "administration" | "v3" = "mobile") {
        let now = new Date().valueOf();

        let expIn: number;
        let lastLoggedIn: number;
        if (toApi == "mobile") {
            if (!this.tokens) this.tokens = await this.attemptReLogin(toApi);
            expIn = this.tokens.expires_in;
            lastLoggedIn = this.lastLoggedIn;
        } else if (toApi == "administration") {
            if (!this.administrationTokens)
                this.administrationTokens = await this.attemptReLogin(toApi);
            expIn = this.administrationTokens.expires_in;
            lastLoggedIn = this.lastLoggedInAdministration;
        } else if (toApi == "v3") {
            if (!this.v3Tokens) this.v3Tokens = await this.attemptReLogin(toApi);
            expIn = this.v3Tokens.expires_in;
            lastLoggedIn = this.lastLoggedInV3;
        }

        let loggedInFor = expIn * 1000 - this.authDiff;

        if (lastLoggedIn + loggedInFor <= now) {
            await this.acquireRefreshToken(toApi, now, lastLoggedIn, loggedInFor);
        } else {
            if (toApi == "mobile") {
                console.log(
                    `%c${this.fullName} - Not renewing ${toApi} tokens yet (${
                        (this.lastLoggedIn + loggedInFor - now) / 1000
                    } / ${(this.tokens.expires_in * 1000 - this.authDiff) / 1000}s remaining)`,
                    "background: #F6FF6B; color: black"
                );
            } else if (toApi == "administration") {
                console.log(
                    `%c${this.fullName} - Not renewing ${toApi} tokens yet (${
                        (this.lastLoggedInAdministration + loggedInFor - now) / 1000
                    } / ${
                        (this.administrationTokens.expires_in * 1000 - this.authDiff) / 1000
                    }s remaining)`,
                    "background: #F6FF6B; color: black"
                );
            } else {
                console.log(
                    `%c${this.fullName} - Not renewing ${toApi} tokens yet (${
                        (this.lastLoggedInV3 + loggedInFor - now) / 1000
                    } / ${(this.v3Tokens.expires_in * 1000 - this.authDiff) / 1000}s remaining)`,
                    "background: #F6FF6B; color: black"
                );
            }
        }
    }
    private async acquireRefreshToken(
        toApi: "mobile" | "administration" | "v3" = "mobile",
        now: number,
        lastLoggedIn: number,
        loggedInFor: number
    ) {
        if (this.loginInProgress) {
            while (this.loginInProgress) await this.delay(20);
            return this.loginWithRefreshToken(toApi);
        }

        this.loginInProgress = true;

        if (toApi == "mobile") {
            console.log(
                `%c${this.fullName} - Renewing ${toApi} tokens (${
                    now / 1000 - (lastLoggedIn + loggedInFor) / 1000
                }s) over token expiry`,
                "background: #93FF6B; color: black"
            );
        } else if (toApi == "administration") {
            console.log(
                `%c${this.fullName} - Renewing ${toApi} tokens (${
                    now / 1000 - (this.lastLoggedInAdministration + loggedInFor) / 1000
                }s) over token expiry`,
                "background: #93FF6B; color: black"
            );
        } else {
            console.log(
                `%c${this.fullName} - Renewing ${toApi} tokens (${
                    now / 1000 - (this.lastLoggedInV3 + loggedInFor) / 1000
                }s) over token expiry`,
                "background: #93FF6B; color: black"
            );
        }

        let newTokens;
        if (toApi == "mobile") {
            try {
                newTokens = await this.kreta.renewToken(this.tokens.refresh_token, this.institute);
            } catch (error) {
                newTokens = await this.attemptReLogin(toApi);
                this.loginInProgress = false;
                if (!newTokens) throw error;
            }
        } else if (toApi == "administration") {
            try {
                newTokens = await this.administrationService.renewToken(
                    this.administrationTokens.refresh_token,
                    this.institute
                );
            } catch (error) {
                newTokens = await this.attemptReLogin(toApi);
                this.loginInProgress = false;
                if (!newTokens) throw error;
            }
        } else {
            try {
                newTokens = await this.kretaV3.renewToken(this.v3Tokens.refresh_token);
            } catch (error) {
                newTokens = await this.attemptReLogin(toApi);
                this.loginInProgress = false;
                if (!newTokens) throw error;
            }
        }

        if (newTokens != null) {
            if (toApi == "mobile") {
                this.tokens = newTokens;
                this.lastLoggedIn = new Date().valueOf();
            } else if (toApi == "administration") {
                this.administrationTokens = newTokens;
                this.lastLoggedInAdministration = new Date().valueOf();
            } else {
                this.v3Tokens = newTokens;
                this.lastLoggedInV3 = new Date().valueOf();
            }

            //overwriting the tokens of the stored users init data
            let newUsersInitData = this.app.usersInitData;
            for (let i = 0; i < newUsersInitData.length; i++) {
                if (newUsersInitData[i].id == this.id) {
                    newUsersInitData[i] = {
                        id: this.id,
                        username: this.username,
                        tokens: this.tokens,
                        adminstrationTokens: this.administrationTokens,
                        v3Tokens: this.v3Tokens,
                        institute: this.institute,
                        fullName: this.fullName,
                        notificationsEnabled: this.notificationsEnabled,
                        lastNotificationSetTime: this.lastNotificationSetTime,
                        yx: this.yx,
                    };
                }
            }
            await this.app.changeConfig("usersInitData", newUsersInitData);
        }
        this.loginInProgress = false;
    }
    private delay(timer: number): Promise<void> {
        return new Promise(resolve => setTimeout(() => resolve(), timer));
    }
    private async attemptReLogin(toApi: "mobile" | "administration" | "v3") {
        console.warn("Attempting re-login");

        if (!this.username || !this.yx) return;

        let tokens;
        try {
            if (toApi == "mobile") {
                tokens = await this.kreta.getToken(this.username, this.yx, this.institute);
            } else if (toApi == "administration") {
                tokens = await this.administrationService.getToken(
                    this.username,
                    this.yx,
                    this.institute
                );
            } else {
                tokens = await this.kretaV3.getToken(this.username, this.yx, this.institute);
            }
        } catch (e) {
            console.error("Re-login failed with:", e);
        }

        return tokens;
    }
    /**
     * Fills the users missing data (fullName, id etc - with a getStudent request) of a user that doesn't yet exist
    @returns {Promise<boolean>} Promise that resolves to `true` if the user doesn't yet exist, `false` if it does
     */
    public async fetchUserData(): Promise<boolean> {
        let student = await this.kretaV3.getStudent(this.v3Tokens, this.institute);
        if (student != null) {
            this.setUserData(
                student.Nev,
                +student.Uid,
                this.notificationsEnabled,
                this.lastNotificationSetTime,
                this.administrationTokens,
                this.v3Tokens
            );
            //overwriting the name and id of the users init data
            let newUserInitData: userInitData = {
                id: this.id,
                username: this.username,
                tokens: this.tokens,
                adminstrationTokens: this.administrationTokens,
                v3Tokens: this.v3Tokens,
                institute: this.institute,
                fullName: this.fullName,
                notificationsEnabled: this.notificationsEnabled,
                lastNotificationSetTime: this.lastNotificationSetTime,
                yx: this.yx,
            };
            let doesUserAlreadyExist = false;
            this.app.usersInitData.forEach(userInitData => {
                if (userInitData.id == newUserInitData.id) {
                    doesUserAlreadyExist = true;
                }
            });
            if (!doesUserAlreadyExist) {
                this.app.usersInitData.push(newUserInitData);
                await this.app.changeConfig("usersInitData", this.app.usersInitData);
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
    /**
     * Adds a fullname (for displaying) an id (for handling), notificationsEnabled, lastNotificationSetTime to the user instance.
     * Sets the cacheKeys that the user instance will work with (by id)
     * @param fullName fullname to add to the user
     * @param id Student.id (see [kreta.service.ts->getStudent()])
     * @param notificationsEnabled whether notifications for the user are enabled
     * @param lastNotificationSetTime the last time notifications for this user were set
     */
    public setUserData(
        fullName: string,
        id: number,
        notificationsEnabled: boolean,
        lastNotificationSetTime: number,
        administrationTokens: Token,
        v3Tokens: Token
    ) {
        this.fullName = fullName;
        this.id = id;
        this.administrationTokens = administrationTokens;
        this.v3Tokens = v3Tokens;
        (this.notificationsEnabled = notificationsEnabled),
            (this.lastNotificationSetTime = lastNotificationSetTime),
            (this.cacheIds = {
                student: `${this.id}_studentData`,
                tests: `${this.id}_testsData`,
                messageList: `${this.id}_messageListData`,
                lesson: `${this.id}_lessonData`,
                studentHomeworks: `${this.id}_studentHomeworkData`,
                teacherHomeworks: `${this.id}_teacherHomeworkKey`,
                events: `${this.id}_eventsData`,
                combined: `${this.id}_combinedData`,
                inboxMessageList: `${this.id}_aministrationInboxData`,
                outboxMessageList: `${this.id}_aministrationOutboxData`,
                deletedMessageList: `${this.id}_administrationDeletedData`,
                // addresseeTypeList: `${this.id}_addresseeTypeListData`,
                // studentAddresseeGroups: `${this.id}_studentAddresseeGroupsData`,
                // studentAddresseeClasses: `${this.id}_studentAddresseeClassesData`,
                // parentAddresseeGroups: `${this.id}_parentAddresseeGroupsData`,
                // parentAddresseeClasses: `${this.id}_parentAddresseeClassesData`,
                // studentAddresseeList: `${this.id}_studentAddresseeListData`,
                // parentAddresseeList: `${this.id}_parentAddresseeListData`,
                // teacherAddresseeList: `${this.id}_teacherAddresseeListData`,
                // headTeacherAddresseeList: `${this.id}_headTeacherAddresseeListData`,
                // directorateAddresseeList: `${this.id}_directorateAddresseeListData`,
                // adminAddresseeList: `${this.id}_adminAddresseeListData`,
                // szmkAddresseeList: `${this.id}_szmkAddresseeListData`,
                v3Averages: `${this.id}_v3AveragesData`,
                v3ClassAverages: `${this.id}_v3ClassAveragesData`,
                v3ClassGroups: `${this.id}_v3ClassGroupsData`,
                v3Evaluations: `${this.id}_v3EvaluationsData`,
                v3Events: `${this.id}_v3EventsData`,
                v3HeadTeachers: `${this.id}_v3HeadTeachersData`,
                v3Homeworks: `${this.id}_v3HomeworksData`,
                v3Lessons: `${this.id}_v3LessonsData`,
                v3Notes: `${this.id}_v3NotesData`,
                v3SchoolYearPlan: `${this.id}_v3SchoolYearPlanData`,
                v3Student: `${this.id}_v3StudentData`,
                v3Tests: `${this.id}_v3TestsData`,
                v3Absences: `${this.id}_v3AbsencesData`,
            });
    }
    public resetTokenTime(API: "mobile" | "administration" | "v3") {
        if (API == "mobile") {
            this.lastLoggedIn = 0;
        } else if (API == "administration") {
            this.lastLoggedInAdministration = 0;
        } else {
            this.lastLoggedInV3 = 0;
        }
    }
    public isTokenTimeZero(API: "mobile" | "administration" | "v3") {
        return API == "mobile"
            ? this.lastLoggedIn == 0
            : API == "administration"
            ? this.lastLoggedInAdministration == 0
            : this.lastLoggedInV3 == 0;
    }
    public removePassword() {
        let i = this.app.usersInitData.findIndex(uid => uid.id == this.id);
        this.app.usersInitData[i].yx = null;
        this.yx = null;

        this.app.changeConfig("usersInitData", this.app.usersInitData);
    }
    /**
     * Clears all of the cached data that the user had ever stored
     */
    public async clearUserCache() {
        for (const key in this.cacheIds) {
            await this.storage.remove(this.cacheIds[key]);
        }
    }
    public async redoKretaLogin(newUsername: string, newPassword: string) {
        let newTokens = await this.kreta.getToken(newUsername, newPassword, this.institute);
        let newTokensV3 = await this.kretaV3.getToken(newUsername, newPassword, this.institute);

        if (newTokens) {
            this.tokens = newTokens;
            this.v3Tokens = newTokensV3;
            this.username = newUsername;
            this.yx = newPassword;

            let i = this.app.usersInitData.findIndex(uid => uid.id == this.id);
            this.app.usersInitData[i].tokens = newTokens;
            this.app.usersInitData[i].v3Tokens = newTokensV3;
            this.app.usersInitData[i].username = newUsername;
            this.app.usersInitData[i].yx = newPassword;

            await this.app.changeConfig("usersInitData", this.app.usersInitData);
        }
    }
    public async logOutOfAdministration() {
        this.administrationTokens = null;
        let newUserInitData: userInitData = {
            adminstrationTokens: null,
            fullName: this.fullName,
            username: this.username,
            id: this.id,
            institute: this.institute,
            lastNotificationSetTime: this.lastNotificationSetTime,
            notificationsEnabled: this.notificationsEnabled,
            tokens: this.tokens,
            v3Tokens: this.v3Tokens,
            yx: this.yx,
        };
        for (let i = 0; i < this.app.usersInitData.length; i++) {
            if (this.app.usersInitData[i].id == this.id) {
                this.app.usersInitData[i] = newUserInitData;
            }
        }
        await this.app.changeConfig("usersInitData", this.app.usersInitData);
    }
    /**
     * Clears the user's stored cache for a specific category (this will enforce some pages to be reloaded)
     * @param key the name of the category you want to be cleared from the storage
     */
    public async clearUserCacheByCategory(
        key:
            | "student"
            | "tests"
            | "messageList"
            | "lesson"
            | "studentHomeworks"
            | "teacherHomeworks"
            | "events"
            | "combined"
            | "inboxMessageList"
            | "outboxMessageList"
            | "deletedMessageList"
            | "v3Student"
            | "v3ClassGroupsData"
            | "v3absences"
            | "v3Notes"
            | "v3Evaluations"
            | "v3Tests"
            | "v3SchoolYearPlan"
            | "v3Homeworks"
            | "v3Lessons"
            | "v3Averages"
            | "v3HeadTeachers"
            | "v3Events"
            | "v3ClassAverages"
    ) {
        await this.storage.remove(this.cacheIds[key]);
    }
    /**
     * Enables the user's local notifications. NOTE: Doesn't set any notifications. To do that, see: `User`.`setLocalNotifications()`
     * @param changeTo set to `true` to turn the user's local notifications on, `false` to turn them off
     */
    public localNotificationsEnabler(changeTo: boolean) {
        if (changeTo) {
            console.log(
                `%c[USER->localNotificationsEnabler()] Enabling notifications for ${this.fullName}`,
                "background-color: darkgreen; color: white"
            );
        } else {
            console.log(
                `%c[USER->localNotificationsEnabler()] Disabling notifications for ${this.fullName}`,
                "background-color: pink; color: black"
            );
        }
        this.notificationsEnabled = changeTo;

        try {
            for (let i = 0; i < this.app.usersInitData.length; i++) {
                if (this.app.usersInitData[i].id == this.id) {
                    this.app.usersInitData[i].notificationsEnabled = changeTo;
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
    /**
     * Sets the user's local timetable notifications from the current week to `howManyWeeks` in the future
     * @param howManyWeeks how many weeks in the future to set the user's local timetable notifications (1 means the current week only)
     */
    public async setLocalNotifications(howManyWeeks: number) {
        let lessons = await this.getLessonsV3(
            this.fDate.getWeekFirst(0),
            this.fDate.getWeekLast(howManyWeeks - 1)
        );
        this.notificationService.setLocalNotifications(lessons);
    }
    /**
     * Pre-initializes local notifications for 2 weeks (if it hasn't been initialized this week and notifications are enabled on the user)
     */
    public async preInitializeLocalNotifications() {
        if (
            this.notificationsEnabled &&
            (await this.notificationService.getAllNonDismissed()).length < 10
        ) {
            console.log(
                `[USER->preInitializeLocalNotifications()] pre-initializing notifications for ${this.fullName}`
            );
            await this.setLocalNotifications(2);
            let newUsersInitData = this.app.usersInitData;
            for (let i = 0; i < newUsersInitData.length; i++) {
                if (newUsersInitData[i].id == this.id) {
                    newUsersInitData[i] = {
                        id: this.id,
                        username: this.username,
                        tokens: this.tokens,
                        adminstrationTokens: this.tokens,
                        v3Tokens: this.v3Tokens,
                        institute: this.institute,
                        fullName: this.fullName,
                        notificationsEnabled: this.notificationsEnabled,
                        lastNotificationSetTime: new Date().valueOf(),
                        yx: this.yx,
                    };
                }
            }
            await this.app.changeConfig("usersInitData", newUsersInitData);
        }
    }
    //#endregion

    public getAsyncAsObservableWithCache<T>(
        asyncFns: {
            name: string;
            cacheKey: string;
            params: any[];
        }[],
        forceRefresh: boolean = false,
        skipCache: boolean = false
    ): Observable<T> {
        asyncFns.forEach(fn => {
            if (!this[fn.name])
                throw new Error(
                    `The user class has no declared function '${fn.name}()'. Check your spelling or declare it manually.`
                );
            if (!this.cacheIds[fn.cacheKey])
                throw new Error(
                    `The user class contains no cacheId corresponding to key: '${fn.cacheKey}'. Check your spelling or add it to the cacheIds object.`
                );
        });

        let returnVal = new Subject<T | any>();
        Promise.all(
            asyncFns.map(c => {
                return this.storage.get(this.cacheIds[c.cacheKey]);
            })
        ).then(cacheData => {
            let allCacheData = [];

            cacheData.forEach(currentCacheData => {
                if (currentCacheData) {
                    allCacheData.push(currentCacheData.data);
                }
            });

            if (!skipCache) returnVal.next(allCacheData);

            let isCacheValid = true;
            cacheData.forEach(currentCacheData => {
                if (!this.cache.isCacheValid(currentCacheData)) isCacheValid = false;
            });

            if (!isCacheValid || forceRefresh) {
                const d1 = new Date().valueOf();

                Promise.all(
                    asyncFns.map(asyncFn => {
                        return this[asyncFn.name].apply(this, asyncFn.params);
                    })
                )
                    .then(res => {
                        console.log(
                            `%c[USER] ✓ Performed ${asyncFns.length} request${
                                asyncFns.length > 1 ? "s" : ""
                            } in ${Math.round((new Date().valueOf() - d1) * 1000) / 1000}ms`,
                            "color: #2196f3"
                        );

                        let d = [];
                        res.forEach((e, i) => {
                            if (e) {
                                d.push(e);
                                if (!skipCache)
                                    this.cache.setCache(this.cacheIds[asyncFns[i].cacheKey], e);

                                //lastUpdated (for notifications)
                                this.storage.set(
                                    `LU_${asyncFns[i].cacheKey}`,
                                    new Date().valueOf()
                                );
                            }
                        });

                        returnVal.next(d);
                        returnVal.complete();
                    })
                    .catch(error => {
                        console.log(
                            `%c[USER] X Failed to perform ${asyncFns.length} request${
                                asyncFns.length > 1 ? "s" : ""
                            } in ${Math.round((new Date().valueOf() - d1) * 1000) / 1000}ms`,
                            "color: #ff5131"
                        );
                        returnVal.error(error);
                    });
            } else {
                returnVal.complete();
            }
        });
        return returnVal.asObservable();
    }

    //#region other requests
    /**
     * Gets the user's lessons between two dates, optionally uses cache
     * @param fromDate the date from which to get the lessons
     * @param toDate the date until which to get the lessons
     * @param skipCache whether or not it should be attempted to get, renew and return cached data.
     * @returns {Promise} Promise that resolves to a Lesson object array
     */
    public async getLesson(
        fromDate: string,
        toDate: string,
        skipCache: boolean = false
    ): Promise<Lesson[]> {
        await this.loginWithRefreshToken();
        let lessons = await this.kreta.getLesson(
            fromDate,
            toDate,
            skipCache,
            this.tokens,
            this.institute,
            this.cacheIds.lesson
        );
        //await this.updateLocalNotifications(lessons); (deprecated for now)
        return lessons;
    }
    public async getStudent(fromDate: string, toDate: string, forceRefresh: boolean = false) {
        await this.loginWithRefreshToken();
        return this.kreta.getStudent(
            fromDate,
            toDate,
            forceRefresh,
            this.tokens,
            this.institute,
            this.cacheIds.student
        );
    }
    public async getEvents(): Promise<Event[]> {
        await this.loginWithRefreshToken();
        return this.kreta.getEvents(this.tokens, this.institute);
    }
    public async getTests(
        fromDate: string,
        toDate: string,
        forceRefresh: boolean = false,
        skipCache: boolean = false
    ): Promise<Test[]> {
        await this.loginWithRefreshToken();
        return this.kreta.getTests(
            fromDate,
            toDate,
            forceRefresh,
            skipCache,
            this.tokens,
            this.institute,
            this.cacheIds.tests
        );
    }
    public async getMessageListMobile(forceRefresh: boolean) {
        await this.loginWithRefreshToken();
        return this.kreta.getMessageList(forceRefresh, this.tokens, this.cacheIds.messageList);
    }
    /**
     * Gets the user's student homeworks between two dates or by a homeworkId
     * @param fromDate the date from which to get the student homeworks
     * @param toDate the date until which to get the lessons
     * @param homeworkId the homeworkId to get the homeworks by
     * @returns {Promise} Promise that resolves to a StudentHomework object array
     *  */
    public async getStudentHomeworks(
        fromDate: string = null,
        toDate: string = null,
        homeworkId: number = null
    ): Promise<StudentHomework[]> {
        await this.loginWithRefreshToken();
        return await this.kreta.getStudentHomeworks(
            fromDate,
            toDate,
            homeworkId,
            this.tokens,
            this.institute,
            this.cacheIds.studentHomeworks
        );
    }
    /**
     * Gets the user's teacher homeworks between two dates or by a homeworkId
     * @param fromDate the date from which to get the teacher homeworks
     * @param toDate the date until which to get the teacher homeworks
     * @param homeworkId the homeworkId to get the homeworks by
     * @returns {Promise} Promise that resolves to a TeacherHomework object array
     */
    public async getTeacherHomeworks(
        fromDate: string,
        toDate: string,
        homeworkId: number = null
    ): Promise<TeacherHomework[]> {
        await this.loginWithRefreshToken();
        return await this.kreta.getTeacherHomeworks(
            fromDate,
            toDate,
            homeworkId,
            this.tokens,
            this.institute,
            this.cacheIds.teacherHomeworks
        );
    }
    public async changeHomeworkState(done: boolean, teacherHomeworkId: number) {
        await this.loginWithRefreshToken();
        await this.kreta.changeHomeworkState(done, teacherHomeworkId, this.tokens, this.institute);
    }
    /**
     * Gets a full message with the whole text
     * @param messageId
     * @returns {Promise} Promise that resolves to a Message object
     */
    public async getMessage(messageId: number): Promise<Message> {
        await this.loginWithRefreshToken();
        return await this.kreta.getMessage(messageId, this.tokens);
    }
    /**
     * Sets one of the user's messages as read
     * @param messageId
     */
    public async setMessageAsRead(messageId: number): Promise<void> {
        await this.loginWithRefreshToken();
        return await this.kreta.setMessageAsRead(messageId, this.tokens);
    }
    /**
     * Adds a homework to one of the user's lessons
     * @param lesson the lesson to which a homework should be added
     * @param text the text of the homework that should be added
     * @returns {Promise} Promise that resolves to a HomeworkResponse object
     */
    public async addStudentHomework(lesson: Lesson | any, text: string): Promise<HomeworkResponse> {
        await this.loginWithRefreshToken();
        return await this.kreta.addStudentHomework(lesson, text, this.tokens, this.institute);
    }
    /**
     * Deletes one of the user's student homeworks. (It doesn't need to have been added by the user)
     * @param id
     * @returns {Promise} Promise that resolves true if the request was successful, false if not
     */
    public async deleteStudentHomework(id: number): Promise<boolean> {
        await this.loginWithRefreshToken();
        return await this.kreta.deleteStudentHomework(id, this.tokens, this.institute);
    }
    public async getHomeworkAttachment(fileId: number, fileName: string) {
        await this.loginWithRefreshToken("v3");
        return this.kretaV3.getHomeworkAttachment(fileId, fileName, this.v3Tokens, this.institute);
    }
    /**
     * Makes a 'Lesson' request, and returns the server's response time afterwards
     * @param fromDate the date from which to get the lessons needed for the request
     * @param toDate the date until which to get the lessons needed for the request
     * @param userAgent the User-Agent that should be used in the HTTP request as a header
     * @returns {Promise} Promise that resolves to the response time [ms]
     */
    public async getLessonLAB(
        fromDate: string,
        toDate: string,
        userAgent: string
    ): Promise<number> {
        await this.loginWithRefreshToken("v3");
        return await this.kretaV3.getLessonLAB(
            fromDate,
            toDate,
            userAgent,
            this.v3Tokens,
            this.institute
        );
    }
    public async getMessageFile(fileId: number, fileName: string, fileExtension: string) {
        await this.loginWithRefreshToken();
        return this.kreta.getMessageFile(fileId, fileName, fileExtension, this.tokens);
    }

    //administration
    public async logIntoAdministration(username: string, password: string) {
        let newTokens = await this.administrationService.getToken(
            username,
            password,
            this.institute
        );
        if (newTokens) {
            this.administrationTokens = newTokens;
            this.username = username;
            this.app.usersInitData.find(u => u.id == this.id).adminstrationTokens = newTokens;
            this.app.usersInitData.find(u => u.id == this.id).username = username;
            this.app.usersInitData.find(u => u.id == this.id).yx = password;
            await this.app.changeConfig(`usersInitData`, this.app.usersInitData);
            //successfully logged user in to administration
            return true;
        } else {
            //login error
            return false;
        }
    }
    public isAdministrationRegistered() {
        return this.administrationTokens != null;
    }
    public async getMessageList(state: "inbox" | "outbox" | "deleted") {
        await this.loginWithRefreshToken("v3");
        return this.administrationService.getMessageList(state, this.v3Tokens);
    }
    public async getMessageAdministration(messageId: number): Promise<AdministrationMessage> {
        await this.loginWithRefreshToken("v3");
        return this.administrationService.getMessage(messageId, this.v3Tokens);
    }
    public async binMessage(action: "put" | "remove", messageIdList: number[]) {
        await this.loginWithRefreshToken("v3");
        return this.administrationService.binMessages(action, messageIdList, this.v3Tokens);
    }
    public async deleteMessage(messageIdList: number[]) {
        await this.loginWithRefreshToken("v3");
        return this.administrationService.deleteMessages(messageIdList, this.v3Tokens);
    }
    public async changeMessageState(newState: "read" | "unread", messageIdList: number[]) {
        await this.loginWithRefreshToken("v3");
        return this.administrationService.changeMessageState(
            newState,
            messageIdList,
            this.v3Tokens
        );
    }
    public async replyToMessage(
        messageId: number,
        targy: string,
        szoveg: string,
        attachmentList: AttachmentToSend[]
    ) {
        await this.loginWithRefreshToken("v3");
        return this.administrationService.replyToMessage(
            messageId,
            targy,
            szoveg,
            attachmentList,
            this.v3Tokens
        );
    }
    public async sendNewMessage(
        addresseeList: Addressee[],
        targy: string,
        szoveg: string,
        attachmentList: AttachmentToSend[]
    ) {
        await this.loginWithRefreshToken("v3");
        return this.administrationService.sendNewMessage(
            addresseeList,
            targy,
            szoveg,
            attachmentList,
            this.v3Tokens
        );
    }
    public async getAddresseeTypeList(): Promise<AddresseeType[]> {
        await this.loginWithRefreshToken("v3");
        return this.administrationService.getAddresseeTypeList(this.v3Tokens);
    }
    public async getAddresseListByCategory(
        category:
            | "teachers"
            | "headTeachers"
            | "directorate"
            | "tutelaries"
            | "students"
            | "admins"
            | "szmk"
    ): Promise<AddresseeListItem[]> {
        await this.loginWithRefreshToken("v3");
        return this.administrationService.getAddresseeListByCategory(category, this.v3Tokens);
    }
    public async getAddresseeGroups(
        addresseeType: "tutelaries" | "students",
        groupType: "classes" | "groups"
    ) {
        await this.loginWithRefreshToken("v3");
        return this.administrationService.getAddresseeGroups(
            addresseeType,
            groupType,
            this.v3Tokens
        );
    }
    public async getStudentsOrParents(
        category: "students" | "tutelaries",
        by: "byGroups" | "byClasses",
        groupOrClassId: number
    ) {
        await this.loginWithRefreshToken("v3");
        return this.administrationService.getStudentsOrParents(
            category,
            by,
            groupOrClassId,
            this.v3Tokens
        );
    }
    public async addAttachment(using: "camera" | "gallery" | "file"): Promise<AttachmentToSend> {
        await this.loginWithRefreshToken("v3");
        return this.administrationService.addAttachment(using, this.v3Tokens);
    }
    public async removeAttachment(attachmentId: string) {
        await this.loginWithRefreshToken("v3");
        return this.administrationService.removeAttachment(attachmentId, this.v3Tokens);
    }
    public async getAttachmentThroughAdministration(fileId: number, fileName: string) {
        await this.loginWithRefreshToken("v3");
        return this.administrationService.getAttachment(fileId, fileName, this.v3Tokens);
    }

    //v3 (commented functions not yet implemented due to limitations with testing ://)
    public async getStudentV3() {
        await this.loginWithRefreshToken("v3");
        return this.kretaV3.getStudent(this.v3Tokens, this.institute);
    }
    public async getClassGroupsV3() {
        await this.loginWithRefreshToken("v3");
        return this.kretaV3.getClassGroups(this.v3Tokens, this.institute);
    }
    public async getAbsencesV3() {
        await this.loginWithRefreshToken("v3");
        return this.kretaV3.getAbsences(this.v3Tokens, this.institute);
    }
    public async getNotesV3() {
        await this.loginWithRefreshToken("v3");
        return this.kretaV3.getNotes(this.v3Tokens, this.institute);
    }
    public async getEvaluationsV3() {
        await this.loginWithRefreshToken("v3");
        return this.kretaV3.getEvaluations(this.v3Tokens, this.institute);
    }
    public async getTestsV3() {
        await this.loginWithRefreshToken("v3");
        return this.kretaV3.getTests(this.v3Tokens, this.institute);
    }
    public async getSchoolYearPlanV3() {
        await this.loginWithRefreshToken("v3");
        return this.kretaV3.getSchoolYearPlan(this.v3Tokens, this.institute);
    }
    // public async getEventsV3() {
    //     await this.loginWithRefreshToken("v3");
    //     return this.kretaV3.getEvents(this.v3Tokens, this.institute);
    // }

    public async getHomeworksV3(
        fromDate: string,
        toDate: string,
        type: "date" | "uid" = "date",
        uid?: number
    ) {
        await this.loginWithRefreshToken("v3");
        return this.kretaV3.getHomeworks(
            this.v3Tokens,
            this.institute,
            fromDate,
            toDate,
            type,
            uid
        );
    }
    public async changeHomeworkStateV3(homeworkUid: number, newState: boolean) {
        await this.loginWithRefreshToken("v3");
        return this.kretaV3.changeHomeworkState(
            this.v3Tokens,
            this.institute,
            homeworkUid,
            newState
        );
    }
    public async getLessonsV3(fromDate: string, toDate: string) {
        await this.loginWithRefreshToken("v3");
        return this.kretaV3.getLessons(this.v3Tokens, this.institute, fromDate, toDate);
    }

    public async getAveragesV3() {
        const classGroups = await this.kretaV3.getClassGroups(this.v3Tokens, this.institute);
        if (!classGroups[0] || !classGroups[0].OktatasNevelesiFeladat)
            throw new Error(
                "Cannot get averages: No OktatasiNevelesiFeladat registered with the current user"
            );

        await this.loginWithRefreshToken("v3");
        return this.kretaV3.getAverages(
            this.v3Tokens,
            this.institute,
            classGroups[0].OktatasNevelesiFeladat.Uid
        );
    }
    // public async getClassAveragesV3(oktatasiNevelesiFeladatUid: string) {
    //     await this.loginWithRefreshToken("v3");
    //     return this.kretaV3.getClassAverages(
    //         this.v3Tokens,
    //         this.institute,
    //         oktatasiNevelesiFeladatUid
    //     );
    // }

    // public async getHeadTeachersByUidV3(uids: string[]) {
    //     await this.loginWithRefreshToken("v3");
    //     return this.kretaV3.getHeadTeachersByUid(this.v3Tokens, this.institute, uids);
    // }

    //#endregion
}
export interface userInitData {
    id: number;
    username: string;
    yx: string;
    tokens: Token;
    adminstrationTokens: Token;
    v3Tokens: Token;
    institute: Institute;
    fullName: string;
    notificationsEnabled: boolean;
    lastNotificationSetTime: number;
}
export interface CollapsibleCombined {
    index: number;
    header: string;
    data: any[];
    firstEntryCreatingTime: number;
    showEvaluations: boolean;
    showAbsences: boolean;
    //events, notes and tests will be categorized under docs
    showDocs: boolean;
    showMessages: boolean;
    showAll: boolean;
}
