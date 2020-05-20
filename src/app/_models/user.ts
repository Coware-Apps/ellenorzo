import { Subject, Observable, observable, from, defer } from 'rxjs';
import { mergeMap, } from "rxjs/operators";
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
import { Event } from './event';
import { AdministrationService } from '../_services/administration.service';
import { MessageListItem, Addressee, AttachmentToSend, AdministrationMessage } from './_administration/message';
import { AddresseeType } from './_administration/addresseeType';
import { AddresseeListItem } from './_administration/addresseeListItem';
export class User {
    //unique data
    public fullName: string;
    public id: number;
    public institute: Institute;
    public role: string;
    //functional data
    public notificationsEnabled: boolean = false;
    public lastNotificationSetTime: number = 0;
    //public allowUpdatesIn = 10;
    public lastLoggedIn: number = 0;
    public lastLoggedInAdministration: number = 0;
    public tokens: Token;
    public administrationTokens: Token;
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
        inboxMessageList: string,
        outboxMessageList: string,
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
    }
    private loginInProgress: boolean = false;

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
        private administrationService: AdministrationService,
    ) {
        this.tokens = tokens;
        this.institute = institute;
    }

    //#region user data manipulation 
    /**
     * Logs in with the users current refresh token if needed (the token's expires_in minus the user's authDiff passes)
     */
    public async loginWithRefreshToken(toApi: 'mobile' | 'administration' = 'mobile') {
        let now = new Date().valueOf();
        let loggedInFor = ((toApi == 'mobile' ? this.tokens.expires_in : this.administrationTokens.expires_in) * 1000) - this.authDiff;
        let lastLoggedIn = toApi == 'mobile' ? this.lastLoggedIn : this.lastLoggedInAdministration;

        if (lastLoggedIn + loggedInFor <= now) {
            await this.acquireRefreshToken(toApi, now, lastLoggedIn, loggedInFor);
        } else {
            if (toApi == 'mobile') {
                console.log(`%c${this.fullName} - Not renewing ${toApi} tokens yet (${(this.lastLoggedIn + loggedInFor - now) / 1000} / ${(this.tokens.expires_in * 1000 - this.authDiff) / 1000}s remaining)`, 'background: #F6FF6B; color: black')
            } else {
                console.log(`%c${this.fullName} - Not renewing ${toApi} tokens yet (${(this.lastLoggedInAdministration + loggedInFor - now) / 1000} / ${(this.administrationTokens.expires_in * 1000 - this.authDiff) / 1000}s remaining)`, 'background: #F6FF6B; color: black')
            }
        }
    }
    private async acquireRefreshToken(toApi: 'mobile' | 'administration' = 'mobile', now: number, lastLoggedIn: number, loggedInFor: number) {

        if (this.loginInProgress) {
            while (this.loginInProgress) await this.delay(20);
            return this.loginWithRefreshToken();
        }

        this.loginInProgress = true;


        if (toApi == "mobile") {
            console.log(`%c${this.fullName} - Renewing ${toApi} tokens (${now / 1000 - (lastLoggedIn + loggedInFor) / 1000}s) over token expiry`, 'background: #93FF6B; color: black')
        } else {
            console.log(`%c${this.fullName} - Renewing ${toApi} tokens (${now / 1000 - (this.lastLoggedInAdministration + loggedInFor) / 1000}s) over token expiry`, 'background: #93FF6B; color: black')
        }

        let newTokens;
        if (toApi == 'mobile') {
            try {
                newTokens = await this.kreta.renewToken(this.tokens.refresh_token, this.institute);
            } catch (error) {
                this.loginInProgress = false;
                throw error;
            }
        } else {
            try {
                newTokens = await this.administrationService.renewToken(this.administrationTokens.refresh_token, this.institute);
            } catch (error) {
                this.loginInProgress = false;
                throw error;
            }
        }

        if (newTokens != null) {
            if (toApi == 'mobile') {
                this.tokens = newTokens;
                this.lastLoggedIn = new Date().valueOf();
            } else {
                this.administrationTokens = newTokens;
                this.lastLoggedInAdministration = new Date().valueOf();
            }

            //overwriting the tokens of the stored users init data
            let newUsersInitData = this.app.usersInitData;
            for (let i = 0; i < newUsersInitData.length; i++) {
                if (newUsersInitData[i].id == this.id) {
                    newUsersInitData[i] = {
                        id: this.id,
                        tokens: this.tokens,
                        adminstrationTokens: this.administrationTokens,
                        institute: this.institute,
                        fullName: this.fullName,
                        notificationsEnabled: this.notificationsEnabled,
                        lastNotificationSetTime: this.lastNotificationSetTime,
                    }
                }
            }
            await this.app.changeConfig("usersInitData", newUsersInitData);
        }
        this.loginInProgress = false;
    }
    private delay(timer: number): Promise<void> {
        return new Promise(resolve => setTimeout(() => resolve(), timer));
    }
    /**
     * Fills the users missing data (fullName, id etc - with a getStudent request) of a user that doesn't yet exist
    @returns {Promise<boolean>} Promise that resolves to `true` if the user doesn't yet exist, `false` if it does
     */
    public async fetchUserData(): Promise<boolean> {
        let student = await this.kreta.getStudent(this.fDate.getDate("today"), this.fDate.getDate("today"), true, this.tokens, this.institute, '_studentLoginData');
        if (student != null) {
            this.setUserData(student.Name, student.StudentId, this.notificationsEnabled, this.lastNotificationSetTime, this.administrationTokens);
            //overwriting the name and id of the users init data
            let newUserInitData: userInitData = {
                id: this.id,
                tokens: this.tokens,
                adminstrationTokens: this.administrationTokens,
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
    public setUserData(fullName: string, id: number, notificationsEnabled: boolean, lastNotificationSetTime: number, administrationTokens: Token) {
        this.fullName = fullName;
        this.id = id;
        this.administrationTokens = administrationTokens;
        this.notificationsEnabled = notificationsEnabled,
            this.lastNotificationSetTime = lastNotificationSetTime,
            this.cacheIds = {
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
            }
    }
    public resetTokenTime(API: 'mobile' | 'administration') {
        if (API == "mobile") {
            this.lastLoggedIn = 0;
        } else {
            this.lastLoggedInAdministration = 0;
        }
    }
    public isTokenTimeZero(API: 'mobile' | 'administration') {
        return API == "mobile" ? this.lastLoggedIn == 0 : this.lastLoggedInAdministration == 0;
    }
    /**
     * Clears all of the cached data that the user had ever stored
     */
    public async clearUserCache() {
        for (const key in this.cacheIds) {
            await this.storage.remove(this.cacheIds[key]);
        }
    }
    public async logOutOfAdministration() {
        this.administrationTokens = null;
        let newUserInitData: userInitData = {
            adminstrationTokens: null,
            fullName: this.fullName,
            id: this.id,
            institute: this.institute,
            lastNotificationSetTime: this.lastNotificationSetTime,
            notificationsEnabled: this.notificationsEnabled,
            tokens: this.tokens,
        };
        for (let i = 0; i < this.app.usersInitData.length; i++) {
            if (this.app.usersInitData[i].id == this.id) {
                this.app.usersInitData[i] = newUserInitData;
            }
        }
        await this.app.changeConfig('usersInitData', this.app.usersInitData);
    }
    /**
     * Clears the user's stored cache for a specific category (this will enforce some pages to be reloaded)
     * @param key the name of the category you want to be cleared from the storage
     */
    public async clearUserCacheByCategory(
        key: 'student' | 'tests' | 'messageList' | 'lesson' |
            'studentHomeworks' | 'teacherHomeworks' | 'events' |
            'combined' | 'administration.inboxMessageList' |
            'administration.outboxMessageList' | 'administration.deletedMessageList'
    ) {
        await this.storage.remove(this.cacheIds[key]);
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
        if (this.notificationsEnabled && (await this.notificationService.getAllNonDismissed()).length < 10) {
            console.log(`[USER->preInitializeLocalNotifications()] pre-initializing notifications for ${this.fullName}`);
            await this.setLocalNotifications(2);
            let newUsersInitData = this.app.usersInitData;
            for (let i = 0; i < newUsersInitData.length; i++) {
                if (newUsersInitData[i].id == this.id) {
                    newUsersInitData[i] = {
                        id: this.id,
                        tokens: this.tokens,
                        adminstrationTokens: this.tokens,
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

    public getAsyncAsObservableWithCache<T>(
        asyncFns: {
            name: string,
            cacheKey: string,
            params: any[],
        }[],
        forceRefresh: boolean = false,
        skipCache: boolean = false,
    ): Observable<T> {

        asyncFns.forEach(fn => {
            if (!this[fn.name]) throw new Error(`The user class has no declared function '${fn.name}()'. Check your spelling or declare it manually.`)
            if (!this.cacheIds[fn.cacheKey]) throw new Error(`The user class contains no cacheId called '${fn.name}'. Check your spelling or add it to the cacheIds object.`)
        })

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
                ).then(res => {
                    console.log(
                        `%c[USER] ✓ Performed ${
                        asyncFns.length
                        } request${
                        asyncFns.length > 1 ? 's' : ''
                        } in ${
                        Math.round((new Date().valueOf() - d1) * 1000) / 1000
                        }ms`,
                        'color: #2196f3'
                    )

                    let d = [];
                    res.forEach((e, i) => {
                        if (e) {
                            d.push(e);
                            if (!skipCache) this.cache.setCache(this.cacheIds[asyncFns[i].cacheKey], e);
                        }
                    });

                    returnVal.next(d);
                    returnVal.complete();
                }).catch(error => {
                    console.log(
                        `%c[USER] X Failed to perform ${
                        asyncFns.length
                        } request${
                        asyncFns.length > 1 ? 's' : ''
                        } in ${
                        Math.round((new Date().valueOf() - d1) * 1000) / 1000
                        }ms`,
                        'color: #ff5131'
                    )
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
    public async getLesson(fromDate: string, toDate: string, skipCache: boolean = false): Promise<Lesson[]> {
        await this.loginWithRefreshToken();
        let lessons = await this.kreta.getLesson(fromDate, toDate, skipCache, this.tokens, this.institute, this.cacheIds.lesson)
        //await this.updateLocalNotifications(lessons); (deprecated for now)
        return lessons;
    }
    public async getStudent(fromDate: string, toDate: string, forceRefresh: boolean = false) {
        await this.loginWithRefreshToken();
        return this.kreta.getStudent(fromDate, toDate, forceRefresh, this.tokens, this.institute, this.cacheIds.student);
    }
    public async getEvents(): Promise<Event[]> {
        await this.loginWithRefreshToken();
        return this.kreta.getEvents(this.tokens, this.institute);
    }
    public async getTests(fromDate: string, toDate: string, forceRefresh: boolean = false, skipCache: boolean = false): Promise<Test[]> {
        await this.loginWithRefreshToken();
        return this.kreta.getTests(fromDate, toDate, forceRefresh, skipCache, this.tokens, this.institute, this.cacheIds.tests)
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
    public async getMessageFile(fileId: number, fileName: string, fileExtension: string) {
        await this.loginWithRefreshToken();
        return this.kreta.getMessageFile(fileId, fileName, fileExtension, this.tokens);
    }


    public async logIntoAdministration(username: string, password: string) {
        let newTokens = await this.administrationService.getToken(username, password, this.institute);
        if (newTokens) {
            this.administrationTokens = newTokens;
            this.app.usersInitData.find(u => u.id == this.id).adminstrationTokens = newTokens;
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
    public async getMessageList(state: 'inbox' | 'outbox' | 'deleted') {
        await this.loginWithRefreshToken('administration');
        return this.administrationService.getMessageList(state, this.administrationTokens);
    }
    public async getMessageAdministration(messageId: number): Promise<AdministrationMessage> {
        await this.loginWithRefreshToken('administration');
        return this.administrationService.getMessage(messageId, this.administrationTokens);
    }
    public async binMessage(action: 'put' | 'remove', messageIdList: number[]) {
        await this.loginWithRefreshToken('administration');
        return this.administrationService.binMessages(action, messageIdList, this.administrationTokens);
    }
    public async deleteMessage(messageIdList: number[]) {
        await this.loginWithRefreshToken('administration');
        return this.administrationService.deleteMessages(messageIdList, this.administrationTokens);
    }
    public async changeMessageState(newState: 'read' | 'unread', messageIdList: number[]) {
        await this.loginWithRefreshToken('administration');
        return this.administrationService.changeMessageState(newState, messageIdList, this.administrationTokens)
    }
    public async replyToMessage(
        messageId: number,
        targy: string,
        szoveg: string,
        attachmentList: AttachmentToSend[],
    ) {
        await this.loginWithRefreshToken('administration');
        return this.administrationService.replyToMessage(messageId, targy, szoveg, attachmentList, this.administrationTokens);
    }
    public async sendNewMessage(
        addresseeList: Addressee[],
        targy: string,
        szoveg: string,
        attachmentList: AttachmentToSend[],
    ) {
        await this.loginWithRefreshToken('administration');
        return this.administrationService.sendNewMessage(addresseeList, targy, szoveg, attachmentList, this.administrationTokens);
    }
    public async getAddresseeTypeList(): Promise<AddresseeType[]> {
        await this.loginWithRefreshToken('administration');
        return this.administrationService.getAddresseeTypeList(this.administrationTokens);
    }
    public async getAddresseListByCategory(category: 'teachers' | 'headTeachers' | 'directorate' | 'tutelaries' | 'students' | 'admins' | 'szmk'): Promise<AddresseeListItem[]> {
        await this.loginWithRefreshToken('administration');
        return this.administrationService.getAddresseeListByCategory(category, this.administrationTokens);
    }
    public async getAddresseeGroups(addresseeType: 'tutelaries' | 'students', groupType: 'classes' | 'groups', ) {
        await this.loginWithRefreshToken('administration');
        return this.administrationService.getAddresseeGroups(addresseeType, groupType, this.administrationTokens);
    }
    public async getStudentsOrParents(category: 'students' | 'tutelaries', by: 'byGroups' | 'byClasses', groupOrClassId: number) {
        await this.loginWithRefreshToken('administration');
        return this.administrationService.getStudentsOrParents(category, by, groupOrClassId, this.administrationTokens);
    }
    public async addAttachment(using: 'camera' | 'gallery' | 'file'): Promise<AttachmentToSend> {
        await this.loginWithRefreshToken('administration');
        return this.administrationService.addAttachment(using, this.administrationTokens);
    }
    public async removeAttachment(attachmentId: string) {
        await this.loginWithRefreshToken('administration');
        return this.administrationService.removeAttachment(attachmentId, this.administrationTokens);
    }
    public async getAttachmentThroughAdministration(fileId: number, fileName: string) {
        await this.loginWithRefreshToken('administration');
        return this.administrationService.getAttachment(fileId, fileName, this.administrationTokens);
    }
    //#endregion
}
export interface userInitData {
    id: number;
    tokens: Token;
    adminstrationTokens: Token;
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
