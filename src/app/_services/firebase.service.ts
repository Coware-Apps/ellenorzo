import { Injectable } from "@angular/core";
import { FirebaseX } from "@ionic-native/firebase-x/ngx";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn: "root",
})
export class FirebaseService {
    private _isAnalyticsEnabled: boolean = true;
    private _userId: number;

    public get isAnalyticsEnabled() {
        return this._isAnalyticsEnabled;
    }
    public set isAnalyticsEnabled(n: boolean) {
        this._isAnalyticsEnabled = n;
        this.firebaseX.setAnalyticsCollectionEnabled(n);
    }

    constructor(private firebaseX: FirebaseX, private storage: Storage) {}

    async onInit() {
        const stored = await this.storage.get("analyticsCollectionEnabled");

        if (stored !== false && this.isProduction()) {
            this._isAnalyticsEnabled = true;
        } else {
            this._isAnalyticsEnabled = false;
        }

        if (!this._isAnalyticsEnabled) {
            console.log(`[FIREBASE] Analytics collection disabled (${this._userId})`);
            this.firebaseX.setAnalyticsCollectionEnabled(false);
        } else {
            if (this._userId) this.setUserId(this._userId);
            console.log(`[FIREBASE] Analytics collection enabled (${this._userId})`);
        }
    }

    private isProduction() {
        return environment.production;
    }

    setScreenName(name: string) {
        if (!this._isAnalyticsEnabled) return;

        return this.firebaseX.setScreenName(name);
    }

    /**
     * Sets the userId to be used in analytics (if enabled) and in crashlytics
     * ONLY USE AN ID THAT THE USER _CANNOT_ BE IDENTIFIED BY!
     *
     * @param userId The id of the user to use with crashlytics and analytics
     */
    async setUserId(userId: number | string) {
        this._userId = Number(userId);
        await this.firebaseX.setCrashlyticsUserId(userId + "");

        if (!this._isAnalyticsEnabled) return;
        await this.firebaseX.setUserId(userId + "");
    }

    logEvent(type: string, data?: any) {
        if (!this._isAnalyticsEnabled) return;

        return this.firebaseX.logEvent(type, data ? data : {});
    }

    startTrace(name: string) {
        if (!this._isAnalyticsEnabled) return;

        return this.firebaseX.startTrace(name);
    }

    stopTrace(name: string) {
        if (!this._isAnalyticsEnabled) return;

        return this.firebaseX.stopTrace(name);
    }

    logError(error: string, stackTrace?: Object) {
        return this.firebaseX.logError(error, stackTrace);
    }
    getToken() {
        return this.firebaseX.getToken();
    }
}
