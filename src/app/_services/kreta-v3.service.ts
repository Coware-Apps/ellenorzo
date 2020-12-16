import { Injectable } from "@angular/core";
import { HTTP } from "@ionic-native/http/ngx";
import { Token } from "../_models/token";
import { Institute } from "../_models";
import {
    KretaV3InvalidResponseError,
    KretaV3NetworkError,
    KretaV3InvalidGrantError,
    KretaV3HttpError,
    KretaV3SchoolYearChangedError,
    KretaV3FileError,
} from "../_exceptions/kreta-v3-exception";
import { Student } from "../_models/kreta-v3/student";
import { ClassGroup } from "../_models/kreta-v3/classGroup";
import { Absence } from "../_models/kreta-v3/absence";
import { Note } from "../_models/kreta-v3/note";
import { Homework } from "../_models/kreta-v3/homework";
import { Evaluation } from "../_models/kreta-v3/evaluation";
import { Test } from "../_models/kreta-v3/test";
import { SchoolYearPlan } from "../_models/kreta-v3/schoolYearPlan";
import { Lesson } from "../_models/kreta-v3/lesson";
import { SubjectAverage } from "../_models/kreta-v3/average";
import { stringify } from "querystring";
import { KretaRenewTokenError } from "../_exceptions";
import { HomeworkComment } from "../_models/kreta-v3/!homeworkComment";
import { FirebaseService } from '../_services/firebase.service';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { Platform } from '@ionic/angular';
import { File, FileEntry } from "@ionic-native/file/ngx";
import {
    FileTransfer,
    FileUploadOptions,
    FileTransferObject,
} from "@ionic-native/file-transfer/ngx";

@Injectable({
    providedIn: "root",
})
export class KretaV3Service {
    private _userAgent: string = "hu.ekreta.student/1.0.5/SM-G950F/8.1.0/27";
    public get userAgent() {
        return this._userAgent;
    }
    private apiKey: string = "7856d350-1fda-45f5-822d-e1a2f3f1acf0";
    private clientId: string = "kreta-ellenorzo-mobile";
    private endpoints = {
        student: "/ellenorzo/v3/sajat/TanuloAdatlap",
        classGroups: "/ellenorzo/v3/sajat/OsztalyCsoportok",
        absences: "/ellenorzo/v3/sajat/Mulasztasok",
        homeworks: "/ellenorzo/v3/sajat/HaziFeladatok",
        homeworkAttachment: "ellenorzo/v3/sajat/HaziFeladatok/Csatolmanyok",
        notes: "/ellenorzo/v3/sajat/Feljegyzesek",
        evaluations: "/ellenorzo/v3/sajat/Ertekelesek",
        tests: "/ellenorzo/v3/sajat/BejelentettSzamonkeresek",
        events: "/ellenorzo/v3/sajat/FaliujsagElemek",
        schoolYearPlan: "/ellenorzo/v3/sajat/TanevRendjeElemek",
        timetable: "/ellenorzo/v3/sajat/OrarendElemek",
        averages: "/ellenorzo/v3/sajat/Ertekelesek/Atlagok/TantargyiAtlagok",
        classAverages: "/ellenorzo/v3/sajat/OsztalyAtlagok",
        headTeachers: "/ellenorzo/v3/felhasznalok/Alkalmazottak/Tanarok/Osztalyfonokok",
    };

    constructor(
        private http: HTTP, 
        private _firebase: FirebaseService,
        private _platform: Platform,
        private _file: File,
        private _androidPermissions: AndroidPermissions,
        private _transfer: FileTransfer,
        ) {}

    private async doRequestWithAuth<T>(
        url: string,
        params,
        headers,
        v3Tokens: Token,
        method: string,
        queryName: string,
        errorTitleKey?: string,
        errorTextKey?: string
    ): Promise<T> {
        if (!this.http[method])
            throw new Error(`Method ${method} does not exist on the HTTP library`);
        if (!headers) headers = {};
        if (!params) params = {};

        headers["User-Agent"] = this._userAgent;
        headers["Authorization"] = `Bearer ${v3Tokens.access_token}`;

        try {
            const res = await this.http[method](url, params, headers);

            if (!res?.data) return null;
            return JSON.parse(res.data);
        } catch (error) {
            this.handleError(error, queryName, errorTitleKey, errorTextKey);
        }
    }

    private handleError(
        error: any,
        queryName: string,
        errorTitleKey?: string,
        errorTextKey?: string
    ) {
        console.log("Error with v3 API", error);
        const errorstr = stringify(error);
        if (error instanceof SyntaxError) throw new KretaV3InvalidResponseError(queryName);
        if (error.status && error.status < 0) throw new KretaV3NetworkError(queryName);
        if (error.status && error.status == 401)
            throw new KretaV3InvalidGrantError(queryName, error);
        if (error.status && error.status == 400 && errorstr.includes("invalid_grant"))
            throw new KretaRenewTokenError(error);
        if (error.status && error.status == 409 && errorstr.includes("IntezmenyMarTanevetValtott"))
            throw new KretaV3SchoolYearChangedError(error);
        console.log(error);
        console.log(errorstr);

        throw new KretaV3HttpError(queryName, error, errorTitleKey, errorTextKey);
    }

    protected get<T>(
        url: string,
        params: any,
        headers: any,
        v3Tokens: Token,
        queryName: string,
        errorTitleKey?: string,
        errorTextKey?: string
    ) {
        return this.doRequestWithAuth<T>(
            url,
            params,
            headers,
            v3Tokens,
            "get",
            queryName,
            errorTitleKey,
            errorTextKey
        );
    }

    protected post<T>(
        url: string,
        params: any,
        headers: any,
        v3Tokens: Token,
        queryName: string,
        errorTitleKey?: string,
        errorTextKey?: string
    ) {
        return this.doRequestWithAuth<T>(
            url,
            params,
            headers,
            v3Tokens,
            "post",
            queryName,
            errorTitleKey,
            errorTextKey
        );
    }

    public async getInstituteList(): Promise<Institute[]> {
        const queryName = "getInstituteList";

        const headers = {
            "User-Agent": this._userAgent,
            apiKey: this.apiKey,
        };
        const params = {};

        try {
            const resp = await this.http.get(
                "https://kretaglobalmobileapi2.ekreta.hu/api/v3/Institute",
                params,
                headers
            );

            return <Institute[]>JSON.parse(resp.data);
        } catch (error) {
            this.handleError(error, queryName, `${queryName}.title`, `${queryName}.text`);
        }
    }

    public async getToken(
        username: string,
        password: string,
        institute: Institute
    ): Promise<Token> {
        const queryName = "getToken";

        const headers = {
            "User-Agent": this._userAgent,
        };
        const params = {
            userName: username,
            password: password,
            institute_code: institute.instituteCode,
            client_id: this.clientId,
            grant_type: "password",
        };

        try {
            const resp = await this.http.post(
                "https://idp.e-kreta.hu/connect/token",
                params,
                headers
            );

            return <Token>JSON.parse(resp.data);
        } catch (error) {
            this.handleError(error, queryName, `${queryName}.title`, `${queryName}.text`);
        }
    }

    public async renewToken(refresh_token: string): Promise<Token> {
        const queryName = "renewToken";

        const headers = {
            "User-Agent": this._userAgent,
        };
        const params = {
            refresh_token: refresh_token,
            client_id: this.clientId,
            grant_type: "refresh_token",
        };

        try {
            const resp = await this.http.post(
                "https://idp.e-kreta.hu/connect/token",
                params,
                headers
            );

            return <Token>JSON.parse(resp.data);
        } catch (error) {
            this.handleError(error, queryName, `${queryName}.title`, `${queryName}.text`);
        }
    }

    public async getStudent(tokens: Token, institute: Institute): Promise<Student> {
        const queryName = "getStudent";

        return this.get<Student>(
            institute.url + this.endpoints.student,
            null,
            null,
            tokens,
            queryName,
            `${queryName}.title`,
            `${queryName}.text`
        );
    }

    public async getClassGroups(tokens: Token, institute: Institute): Promise<ClassGroup[]> {
        const queryName = "getClassGroups";

        return this.get<ClassGroup[]>(
            institute.url + this.endpoints.classGroups,
            null,
            null,
            tokens,
            queryName,
            `${queryName}.title`,
            `${queryName}.text`
        );
    }

    public async getAbsences(tokens: Token, institute: Institute): Promise<Absence[]> {
        const queryName = "getAbsences";

        return this.get<Absence[]>(
            institute.url + this.endpoints.absences,
            null,
            null,
            tokens,
            queryName,
            `${queryName}.title`,
            `${queryName}.text`
        );
    }

    public async getNotes(tokens: Token, institute: Institute): Promise<Note[]> {
        const queryName = "getNotes";

        return this.get<Note[]>(
            institute.url + this.endpoints.notes,
            null,
            null,
            tokens,
            queryName,
            `${queryName}.title`,
            `${queryName}.text`
        );
    }

    public async getEvaluations(tokens: Token, institute: Institute): Promise<Evaluation[]> {
        const queryName = "getEvaluations";

        return this.get<Evaluation[]>(
            institute.url + this.endpoints.evaluations,
            null,
            null,
            tokens,
            queryName,
            `${queryName}.title`,
            `${queryName}.text`
        );
    }

    public async getTests(tokens: Token, institute: Institute): Promise<Test[]> {
        const queryName = "getTests";

        return this.get<Test[]>(
            institute.url + this.endpoints.tests,
            null,
            null,
            tokens,
            queryName,
            `${queryName}.title`,
            `${queryName}.text`
        );
    }

    public async getSchoolYearPlan(tokens: Token, institute: Institute): Promise<SchoolYearPlan[]> {
        const queryName = "getSchoolYearPlan";

        return this.get<SchoolYearPlan[]>(
            institute.url + this.endpoints.schoolYearPlan,
            null,
            null,
            tokens,
            queryName,
            `${queryName}.title`,
            `${queryName}.text`
        );
    }

    //fromDate-toDate
    public async getHomeworks(
        tokens: Token,
        institute: Institute,
        datumTol?: string,
        datumIg?: string,
        type: "date" | "uid" = "date",
        uid?: number
    ): Promise<Homework[]> {
        const queryName = "getHomeworks";

        if (type == "date") {
            if (new Date(datumIg).valueOf() - new Date(datumTol).valueOf() > 1814400000)
                throw new RangeError(
                    `${queryName} datumTol and datumIg values must have less than 3 weeks in between them.`
                );

            return this.get<Homework[]>(
                institute.url + this.endpoints.homeworks,
                {
                    datumTol: datumTol,
                    datumIg: datumIg,
                },
                null,
                tokens,
                queryName,
                `${queryName}.title`,
                `${queryName}.text`
            );
        } else {
            return [
                await this.get<Homework>(
                    institute.url + this.endpoints.homeworks + `/${uid}`,
                    {},
                    null,
                    tokens,
                    queryName,
                    `${queryName}.title`,
                    `${queryName}.text`
                ),
            ];
        }
    }

    public async changeHomeworkState(
        tokens: Token,
        institute: Institute,
        homeworkUid: number,
        newState: boolean
    ) {
        const queryName = "changeHomeworkState";

        const params = {
            IsMegoldva: newState,
            TanarHaziFeladatUid: homeworkUid,
        };

        console.log("params", params);

        this.http.setDataSerializer("json");

        try {
            await this.post<any>(
                institute.url + this.endpoints.homeworks + `/Megoldva`,
                params,
                null,
                tokens,
                queryName,
                `${queryName}.title`,
                `${queryName}.text`
            );
        } catch (error) {
            //lemor xd
        } finally {
            this.http.setDataSerializer("urlencoded");
        }
    }

    public async getHomeworkComments(
        tokens: Token,
        institute: Institute,
        homeworkUid: number
    ): Promise<HomeworkComment[]> {
        const queryName = "getHomeworkComments";

        return this.get<HomeworkComment[]>(
            institute.url + this.endpoints.homeworks + `/${homeworkUid}/Kommentek`,
            null,
            null,
            tokens,
            queryName,
            `${queryName}.title`,
            `${queryName}.text`
        );
    }

        /**
     * Gets an attachment from the final attachment storage. Use this for existing messages.
     * @param fileId The id of the file to get from the server
     * @param fileName The name of the file to get from the server (used to save the file), include extensions!
     * @param tokens `Token` used for authentication
     */
    public async getHomeworkAttachment(
        fileId: number,
        fileName: string,
        tokens: Token,
        institute: Institute,
    ): Promise<FileEntry> {
        this._firebase.logEvent("download_homework_attachment");

        const splitAt = (index: number) => (x: string) => [x.slice(0, index), x.slice(index)];
        const newName = splitAt(fileName.lastIndexOf("."))(fileName);
        newName[1] = newName[1].slice(1);

        const name = newName[0] + "_" + fileId + "." + newName[1];

        await this.getPermission();

        const messageCacheDir = await this._file.getDirectory(
            await this._file.resolveDirectoryUrl(this._file.cacheDirectory),
            "homeworkattachment",
            { create: true }
        );

        const fileExists = await this._file
            .checkFile(messageCacheDir.toInternalURL(), name)
            .catch(() => false);
        if (fileExists) {
            console.log("File exists in cache");
            const fileEntry = await this._file
                .getFile(messageCacheDir, name, {
                    create: false,
                })
                .catch(() => null);

            if (fileEntry) return fileEntry;
        }

        const fileTransfer: FileTransferObject = this._transfer.create();
        let fileEntry: FileEntry;

        try {
            fileEntry = await fileTransfer.download(
                `${institute.url}/${this.endpoints.homeworkAttachment}/${fileId},Csatolmany`,
                messageCacheDir.toInternalURL() + name,
                undefined,
                {
                    headers: {
                        Authorization: `Bearer ${tokens.access_token}`,
                        "User-Agent": this._userAgent,
                    },
                }
            );
        } catch (error) {
            if (error.status && error.status < 0)
                throw new KretaV3NetworkError("getAttachment()");
            throw new KretaV3FileError(
                "getAttachment()",
                error,
                fileName,
                "getAttachment.title",
                "getAttachment.text"
            );
        }

        return fileEntry;
    }
    protected async getPermission() {
        if (this._platform.is("ios")) {
            return;
        }

        await this._androidPermissions
            .checkPermission(this._androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
            .then(result => {
                if (!result.hasPermission) {
                    return this._androidPermissions.requestPermission(
                        this._androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE
                    );
                }
            });
    }

    public async getLessons(
        tokens: Token,
        institute: Institute,
        datumTol: string,
        datumIg: string
    ): Promise<Lesson[]> {
        const queryName = "getHomeworks";

        if (new Date(datumIg).valueOf() - new Date(datumTol).valueOf() > 1814400000)
            throw new RangeError(
                `${queryName} datumTol and datumIg values must have less than 3 weeks in between them.`
            );

        return this.get<Lesson[]>(
            institute.url + this.endpoints.timetable,
            {
                datumTol: datumTol,
                datumIg: datumIg,
            },
            null,
            tokens,
            queryName,
            `${queryName}.title`,
            `${queryName}.text`
        );
    }

    public async getLessonLAB(
        fromDate: string,
        toDate: string,
        userAgent: string,
        tokens: Token,
        institute: Institute
    ): Promise<number> {
        const headers = {
            "User-Agent": userAgent,
            Authorization: `Bearer ${tokens.access_token}`,
        };

        try {
            const traceStart = new Date().valueOf();

            await this.http.get(
                institute.url + this.endpoints.timetable,
                { datumTol: fromDate, datumIg: toDate },
                headers
            );

            const traceEnd = new Date().valueOf();
            return traceEnd - traceStart;
        } catch (error) {
            this.handleError(error, "getLesssonLAB", "getLesssonLAB.title", "getLesssonLAB.text");
        }
    }

    //by uids and stuff
    public async getAverages(
        tokens: Token,
        institute: Institute,
        oktatasiNevelesiFeladatUid: string
    ): Promise<SubjectAverage[]> {
        const queryName = "getAverages";

        if (!oktatasiNevelesiFeladatUid)
            throw new Error(
                `Cannot get averages without an oktatasiNevelesiFeladatUid (its value is: ${oktatasiNevelesiFeladatUid})`
            );

        return this.get<SubjectAverage[]>(
            institute.url + this.endpoints.averages,
            {
                oktatasiNevelesiFeladatUid: oktatasiNevelesiFeladatUid,
            },
            null,
            tokens,
            queryName,
            `${queryName}.title`,
            `${queryName}.text`
        );
    }

    //not yet implemented (missing interface)
    public async getHeadTeachersByUid(
        tokens: Token,
        institute: Institute,
        uids: string[]
    ): Promise<any[]> {
        const queryName = "getHeadTeachersByUid";

        console.error(`${queryName} not yet implemented, missing interface!`);
        throw new Error("Implementation error");

        if (!uids || uids.length == 0) throw new Error(`Cannot get head teachers (missing uids)`);

        return this.get<any[]>(
            institute.url + this.endpoints.headTeachers,
            {
                Uids: uids.join(";"),
            },
            null,
            tokens,
            queryName,
            `${queryName}.title`,
            `${queryName}.text`
        );
    }

    //not yet implemented (missing interface)
    public async getEvents(tokens: Token, institute: Institute): Promise<any> {
        const queryName = "getEvents";

        console.error(`${queryName} not yet implemented, missing interface!`);
        throw new Error("Implementation error");

        return this.get<any>(
            institute.url + this.endpoints.events,
            null,
            null,
            tokens,
            queryName,
            `${queryName}.title`,
            `${queryName}.text`
        );
    }

    //not yet implemented (missing interface)
    public async getClassAverages(
        tokens: Token,
        institute: Institute,
        oktatasiNevelesiFeladatUid: string
    ): Promise<any[]> {
        const queryName = "getClassAverages";

        console.error(`${queryName} not yet implemented, missing interface!`);
        throw new Error("Implementation error");

        if (!oktatasiNevelesiFeladatUid)
            throw new Error(
                `Cannot get class averages without an oktatasiNevelesiFeladatUid (its value is: ${oktatasiNevelesiFeladatUid})`
            );

        return this.get<any[]>(
            institute.url + this.endpoints.classAverages,
            {
                oktatasiNevelesiFeladatUid: oktatasiNevelesiFeladatUid,
            },
            null,
            tokens,
            queryName,
            `${queryName}.title`,
            `${queryName}.text`
        );
    }
}
