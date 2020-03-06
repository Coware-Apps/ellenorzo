import { Subject } from 'rxjs';
import { Storage } from '@ionic/storage';
import { Student } from '../_models/student';
import { Test } from '../_models/test';
import { Message } from '../_models/message';
import { KretaService } from '../_services/kreta.service';
import { FormattedDateService } from '../_services/formatted-date.service';
import { CacheService } from '../_services/cache.service';
import { Institute } from './institute';
import { Token } from './token';
import { Lesson } from './lesson';
import { StudentHomework, TeacherHomework, HomeworkResponse } from './homework';
import { AppService } from '../_services/app.service';
import { NotificationService } from '../_services/notification.service';
import { PromptService } from '../_services/prompt.service';
export class User {
    //unique data
    public fullName: string;
    public id: number;
    public institute: Institute;
    public role: string;
    //functional data
    public notificationsEnabled: boolean = false;
    public lastNotificationSetTime: number = 0;
    //request subjects (pages that require datastreams should subscribe to these)
    /**
    * A subject that returns a loadedMessageList object 3 times upon init (skeleton->placeholder->final) and on updates (final)
    * @requires `initializeMessageList()`         
    */
    public messageList = new Subject<LoadedMessageList>();
    /**
    * A subject that returns a loadedStudent object 3 times upon init (skeleton->placeholder->final) and on updates (final)
    * @requires `initializeStudent()`
    */
    public student = new Subject<LoadedStudent>();
    /**
    * A subject that returns a loadedTests object 3 times upon init (skeleton->placeholder->final) and on updates (final)
    * @requires `initializeTests()`
    */
    public tests = new Subject<LoadedTests>();
    /**
     * How often the users datastream requests can be updated
     */
    public allowUpdatesIn = 30000;

    //anti-spam
    private lastUpdatedStudent = 0;
    private lastUpdatedStudentData: Student = null;
    private lastUpdatedMessageList = 0;
    private lastUpdatedMessageListData: Message[] = null;
    private lastUpdatedTests = 0;
    private lastUpdatedTestsData: Test[] = null;
    private tokens: Token;
    private lastLoggedIn: number = 0;
    private authDiff: number = 300000;
    private memoryCacheTime: number = 1200000;
    private cacheIds: {
        student: string;
        tests: string;
        messageList: string;
        lesson: string;
        studentHomeworks: string;
        teacherHomeworks: string
    }

    constructor(
        tokens: Token,
        institute: Institute,
        private kreta: KretaService,
        private storage: Storage,
        private fDate: FormattedDateService,
        private cache: CacheService,
        private app: AppService,
        private notificationService: NotificationService,
        private prompt: PromptService,
    ) {
        this.tokens = tokens;
        this.institute = institute;
    }

    //#region user data manipulation 
    /**
     * Logs in with the users current refresh token if needed (the token's expires_in minus the user's authDiff passes)
     */
    public async loginWithRefreshToken() {
        console.log(`[USER->logingWithRefreshToken()] called | ${this.fullName}`);
        let now = new Date().valueOf();
        let loggedInFor = (this.tokens.expires_in * 1000) - this.authDiff;
        if (this.lastLoggedIn + loggedInFor <= now) {
            console.log(`%cRenewing tokens (${now / 1000 - (this.lastLoggedIn + loggedInFor) / 1000}s) over token expiry`, 'background: #93FF6B; color: black')
            let newTokens = await this.kreta.renewToken(this.tokens.refresh_token, this.institute);
            if (newTokens != null) {
                this.tokens = newTokens;
                this.lastLoggedIn = new Date().valueOf();
                //overwriting the tokens of the stored users init data
                let newUsersInitData = this.app.usersInitData;
                for (let i = 0; i < newUsersInitData.length; i++) {
                    if (newUsersInitData[i].id == this.id) {
                        newUsersInitData[i] = {
                            id: this.id,
                            tokens: this.tokens,
                            institute: this.institute,
                            fullName: this.fullName,
                            notificationsEnabled: this.notificationsEnabled,
                            lastNotificationSetTime: this.lastNotificationSetTime,
                        }
                    }
                }
                await this.app.changeConfig("usersInitData", newUsersInitData);
            }
        } else {
            console.log(`%cNot renewing tokens yet (${(this.lastLoggedIn + loggedInFor - now) / 1000} / ${(this.tokens.expires_in * 1000 - this.authDiff) / 1000}s remaining)`, 'background: #F6FF6B; color: black')
        }
    }
    /**
     * Fills the users missing data (fullName, id etc - with a getStudent request) of a user that doesn't yet exist
    @returns {Promise<boolean>} Promise that resolves to `true` if the user doesn't yet exist, `false` if it does
     */
    public async fetchUserData(): Promise<boolean> {
        let student = await this.kreta.getStudent(this.fDate.getDate("today"), this.fDate.getDate("today"), true, this.tokens, this.institute, '_studentLoginData');
        this.setUserData(student.Name, student.StudentId, this.notificationsEnabled, this.lastNotificationSetTime);
        //overwriting the name and id of the users init data
        let newUserInitData: userInitData = {
            id: this.id,
            tokens: this.tokens,
            institute: this.institute,
            fullName: this.fullName,
            notificationsEnabled: this.notificationsEnabled,
            lastNotificationSetTime: this.lastNotificationSetTime,
        }
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
    }
    /**
     * Adds a fullname (for displaying) an id (for handling), notificationsEnabled, lastNotificationSetTime to the user instance.
     * Sets the cacheKeys that the user instance will work with (by id)
     * @param fullName fullname to add to the user
     * @param id Student.id (see [kreta.service.ts->getStudent()])
     * @param notificationsEnabled whether notifications for the user are enabled
     * @param lastNotificationSetTime the last time notifications for this user were set
     */
    public setUserData(fullName: string, id: number, notificationsEnabled: boolean, lastNotificationSetTime: number) {
        this.fullName = fullName;
        this.id = id;
        this.notificationsEnabled = notificationsEnabled,
            this.lastNotificationSetTime = lastNotificationSetTime,
            this.cacheIds = {
                student: `${this.id}_studentData`,
                tests: `${this.id}_testsData`,
                messageList: `${this.id}_messageListData`,
                lesson: `${this.id}_lessonData`,
                studentHomeworks: `${this.id}_studentHomeworkData`,
                teacherHomeworks: `${this.id}_teacherHomeworkKey`,
            }
    }
    /**
     * Clears all of the cached data that the had ever stored
     */
    public async clearUserCache() {
        for (const key in this.cacheIds) {
            await this.storage.remove(this.cacheIds[key]);
        }
    }
    /**
     * Enables the user's local notifications. NOTE: Doesn't set any notifications. To do that, see: `User`.`setLocalNotifications()`
     * @param changeTo set to `true` to turn the user's local notifications on, `false` to turn them off
     */
    public localNotificationsEnabler(changeTo: boolean) {
        if (changeTo) {
            console.log(`%c[USER->localNotificationsEnabler()] Enabling notifications for ${this.fullName}`, 'background-color: darkgreen; color: white');
        } else {
            console.log(`%c[USER->localNotificationsEnabler()] Disabling notifications for ${this.fullName}`, 'background-color: pink; color: black')
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
            let lessons = await this.getLesson(this.fDate.getWeekFirst(0), this.fDate.getWeekLast(howManyWeeks - 1), true);
            this.notificationService.setLocalNotifications(lessons);
    }
    /**
     * Pre-initializes local notifications for 2 weeks (if it hasn't been initialized this week and notifications are enabled on the user)
     */
    public async preInitializeLocalNotifications() {
        console.log('preInitialization called | ', this.fullName);
        if (this.fDate.getWeek(new Date(this.lastNotificationSetTime)) != this.fDate.getWeek(new Date()) && this.notificationsEnabled) {
            console.log(`[USER->preInitializeLocalNotifications()] pre-initializing notifications for ${this.fullName}`);
            await this.setLocalNotifications(2);
            let newUsersInitData = this.app.usersInitData;
            for (let i = 0; i < newUsersInitData.length; i++) {
                if (newUsersInitData[i].id == this.id) {
                    newUsersInitData[i] = {
                        id: this.id,
                        tokens: this.tokens,
                        institute: this.institute,
                        fullName: this.fullName,
                        notificationsEnabled: this.notificationsEnabled,
                        lastNotificationSetTime: new Date().valueOf(),
                    }
                }
            }
            await this.app.changeConfig('usersInitData', newUsersInitData);
        }
    }
    //#endregion

    //#region datastream requests
    private async showAntiSpamToast(requestName: string, timeLeft: number) {
        //deprecated for now, it is just annoying to the user
        //this.prompt.toast(`${requestName} frissítése technikai okokból 30 másodpercenként lehetséges. (${Math.round(timeLeft / 1000)} / ${this.allowUpdatesIn / 1000})`, true)
    }
    //#region student
    /**
    * Initializes the user's student subject
    */
    async initializeStudent() {
        let cacheDataIf = await this.cache.getCacheIf(this.cacheIds.student);
        console.log('cacheDataIf that the initializeStudent got', cacheDataIf);
        if (cacheDataIf == false) {
            let storedStudent = await this.storage.get(this.cacheIds.student);
            if (storedStudent != null) {
                this.student.next({
                    data: storedStudent.data,
                    type: "placeholder",
                });
            } else {
                this.student.next({
                    data: null,
                    type: "skeleton",
                });
            }
            await this.loginWithRefreshToken();
            let refreshedStudent = await this.kreta.getStudent(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"), true, this.tokens, this.institute, this.cacheIds.student);
            this.student.next({
                data: refreshedStudent,
                type: "final",
            });
            this.lastUpdatedStudent = new Date().valueOf();
            this.lastUpdatedStudentData = refreshedStudent;
        } else {
            this.student.next({
                data: <Student>cacheDataIf,
                type: "final",
            });
            this.lastUpdatedStudentData = <Student>cacheDataIf;
        }
    }

    /**
    * Updates the user's student subject with data that it gets from the API
    */
    public async updateStudent() {
        let now = new Date().valueOf();
        if (this.lastUpdatedStudent + this.allowUpdatesIn < now) {
            await this.loginWithRefreshToken();
            let updatedStudent = await this.kreta.getStudent(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"), true, this.tokens, this.institute, this.cacheIds.student);
            this.student.next({
                data: updatedStudent,
                type: "final",
            });
            this.lastUpdatedStudentData = updatedStudent;
            this.lastUpdatedStudent = now;
        } else {
            this.showAntiSpamToast('A tanuló adatainak', now - this.lastUpdatedStudent);
            this.student.next({
                data: this.lastUpdatedStudentData,
                type: "final",
            });
        }
    }
    //#endregion

    //#region tests
    /**
    * Initializes the user's tests subject
    */
    async initializeTests() {
        let cacheDataIf = await this.cache.getCacheIf(this.cacheIds.tests);
        if (cacheDataIf == false) {
            let storedTests = await this.storage.get(this.cacheIds.tests);
            if (storedTests != null) {
                this.tests.next({
                    data: storedTests.data,
                    type: "placeholder",
                });
            } else {
                this.tests.next({
                    data: null,
                    type: "skeleton",
                });
            }
            await this.loginWithRefreshToken();
            let refreshedTests = await this.kreta.getTests(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"), true, this.tokens, this.institute, this.cacheIds.tests);
            this.tests.next({
                data: refreshedTests,
                type: "final",
            });
            this.lastUpdatedTests = new Date().valueOf();
            this.lastUpdatedTestsData = refreshedTests;
        } else {
            this.tests.next({
                data: <Test[]>cacheDataIf,
                type: "final",
            });
            this.lastUpdatedTestsData = <Test[]>cacheDataIf;
        }
    }

    /**
     * Updates the user's tests subject with data that it gets from the API
     */
    public async updateTests() {
        let now = new Date().valueOf();
        if (this.lastUpdatedTests + this.allowUpdatesIn < now) {
            await this.loginWithRefreshToken();
            let updatedTests = await this.kreta.getTests(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"), true, this.tokens, this.institute, this.cacheIds.tests);
            this.tests.next({
                data: updatedTests,
                type: "final",
            });
            this.lastUpdatedTestsData = updatedTests;
            this.lastUpdatedTests = now;
        } else {
            this.showAntiSpamToast('A bejelentett számonkérések', now - this.lastUpdatedTests)
            this.tests.next({
                data: this.lastUpdatedTestsData,
                type: "final",
            });
        }
    }
    //#endregion

    //#region messageList
    /**
     * Initializes the user's messageList subject
     */
    async initializeMessageList() {
        let cacheDataIf = await this.cache.getCacheIf(this.cacheIds.messageList);
        if (cacheDataIf == false) {
            let storedMessageList = await this.storage.get(this.cacheIds.messageList);
            if (storedMessageList != null) {
                this.messageList.next({
                    data: storedMessageList.data,
                    type: "placeholder",
                });
            } else {
                this.messageList.next({
                    data: null,
                    type: "skeleton",
                });
            }
            await this.loginWithRefreshToken();
            let refreshedMessageList = await this.kreta.getMessageList(true, this.tokens, this.cacheIds.messageList);
            this.messageList.next({
                data: refreshedMessageList,
                type: "final",
            });
            this.lastUpdatedMessageList = new Date().valueOf();
            this.lastUpdatedMessageListData = refreshedMessageList;
        } else {
            this.messageList.next({
                data: <Message[]>cacheDataIf,
                type: "final",
            });
            this.lastUpdatedMessageListData = <Message[]>cacheDataIf;
        }
    }

    /**
     * Updates the user's messageList subject with data that it gets from the API
     */
    public async updateMessageList() {
        let now = new Date().valueOf();
        if (this.lastUpdatedMessageList + this.allowUpdatesIn < now) {
            await this.loginWithRefreshToken();
            let updatedMessageList = await this.kreta.getMessageList(true, this.tokens, this.cacheIds.messageList);
            this.messageList.next({
                data: updatedMessageList,
                type: "final",
            });
            this.lastUpdatedMessageListData = updatedMessageList;
            this.lastUpdatedMessageList = now;
        } else {
            this.showAntiSpamToast('Az üzenetek listájának ', now - this.lastUpdatedMessageList)
            this.messageList.next({
                data: this.lastUpdatedMessageListData,
                type: "final",
            });
        }
    }
    //#endregion
    //#endregion

    //#region async requests
    /**
     * Gets the user's lessons between two dates, optionally uses cache
     * @param fromDate the date from which to get the lessons
     * @param toDate the date until which to get the lessons
     * @param skipCache whether or not it should be attempted to get, renew and return cached data.
     * @returns {Promise} Promise that resolves to a Lesson object array
     */
    public async getLesson(fromDate: string, toDate: string, skipCache: boolean = false): Promise<Lesson[]> {
        await this.loginWithRefreshToken();
        let lessons = await this.kreta.getLesson(fromDate, toDate, skipCache, this.tokens, this.institute, this.cacheIds.lesson)
        //await this.updateLocalNotifications(lessons); (deprecated for now)
        return lessons;
    }
    /**
     * Gets the user's student homeworks between two dates or by a homeworkId
     * @param fromDate the date from which to get the student homeworks
     * @param toDate the date until which to get the lessons
     * @param homeworkId the homeworkId to get the homeworks by
     * @returns {Promise} Promise that resolves to a StudentHomework object array
     *  */
    public async getStudentHomeworks(fromDate: string = null, toDate: string = null, homeworkId: number = null): Promise<StudentHomework[]> {
        await this.loginWithRefreshToken();
        return await this.kreta.getStudentHomeworks(fromDate, toDate, homeworkId, this.tokens, this.institute, this.cacheIds.studentHomeworks);
    }
    /**
     * Gets the user's teacher homeworks between two dates or by a homeworkId
     * @param fromDate the date from which to get the teacher homeworks
     * @param toDate the date until which to get the teacher homeworks
     * @param homeworkId the homeworkId to get the homeworks by
     * @returns {Promise} Promise that resolves to a TeacherHomework object array
     */
    public async getTeacherHomeworks(fromDate: string, toDate: string, homeworkId: number = null): Promise<TeacherHomework[]> {
        await this.loginWithRefreshToken();
        return await this.kreta.getTeacherHomeworks(fromDate, toDate, homeworkId, this.tokens, this.institute, this.cacheIds.teacherHomeworks);
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
        return await this.setMessageAsRead(messageId);
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
    /**
     * Makes a 'Lesson' request, and returns the server's response time afterwards
     * @param fromDate the date from which to get the lessons needed for the request
     * @param toDate the date until which to get the lessons needed for the request
     * @param userAgent the User-Agent that should be used in the HTTP request as a header
     * @returns {Promise} Promise that resolves to the response time [ms]
     */
    public async getLessonLAB(fromDate: string, toDate: string, userAgent: string): Promise<number> {
        await this.loginWithRefreshToken();
        return await this.kreta.getLessonLAB(fromDate, toDate, userAgent, this.tokens, this.institute);
    }
    //#endregion
}
interface LoadedStudent {
    data: Student;
    type: "skeleton" | "placeholder" | "final";
}
interface LoadedTests {
    data: Test[];
    type: "skeleton" | "placeholder" | "final";
}
interface LoadedMessageList {
    data: Message[];
    type: "skeleton" | "placeholder" | "final";
}
export interface userInitData {
    id: number;
    tokens: Token;
    institute: Institute;
    fullName: string;
    notificationsEnabled: boolean;
    lastNotificationSetTime: number;
}