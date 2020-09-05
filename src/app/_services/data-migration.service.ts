import { Injectable } from "@angular/core";
import { DataService } from "./data.service";
import { Storage } from "@ionic/storage";

@Injectable({
    providedIn: "root",
})
export class StorageMigrationService {
    constructor(private storage: Storage) {}

    private indexedDB: IDBFactory =
        window.indexedDB ||
        (<any>window).mozIndexedDB ||
        (<any>window).webkitIndexedDB ||
        (<any>window).msIndexedDB;
    private longtermStorageExpiry = 72 * 30 * 24 * 60 * 60;
    private database: IDBDatabase;
    private objectStoreName = "_ionickv";

    private latestDbVersion = 3;

    private openDB(): Promise<IDBDatabase> {
        return new Promise<IDBDatabase>((resolve, reject) => {
            let req: IDBOpenDBRequest = this.indexedDB.open("_ionicstorage");
            req.onsuccess = (e: any) => {
                this.database = e.target.result;
                resolve(e.target.result);
            };
            req.onerror = (e: any) => reject(e);
        });
    }

    private getByKey(key: string): Promise<any> {
        return new Promise<IDBRequest<IDBValidKey>>((resolve, reject) => {
            const transaction: IDBTransaction = this.database.transaction(
                this.objectStoreName,
                "readonly"
            );
            const objectStore: IDBObjectStore = transaction.objectStore(this.objectStoreName);

            let req: IDBRequest<IDBValidKey> = objectStore.get(key);
            req.onsuccess = (e: any) => resolve(e.target.result);
            req.onerror = (e: any) => reject(e);
        });
    }

    private clearOS(): Promise<IDBRequest> {
        return new Promise<IDBRequest>((resolve, reject) => {
            const transaction: IDBTransaction = this.database.transaction(
                this.objectStoreName,
                "readwrite"
            );
            const objectStore: IDBObjectStore = transaction.objectStore(this.objectStoreName);

            let req: IDBRequest<IDBValidKey> = objectStore.clear();
            req.onsuccess = (e: any) => resolve(e.target.result);
            req.onerror = (e: any) => reject(e);
        });
    }

    public async onInit() {
        if (!this.indexedDB) {
            console.log("[DB MIGRATION] No indexedDB, exiting.");
            return;
        }

        const UID = await this.storage.get("usersInitData");

        if (UID && UID.length > 0) {
            console.log("[DB MIGRATION] Init Data exists in SQLite, migration not needed.");
            return;
        }

        await this.openDB().catch(() => null);

        if (
            !this.database ||
            this.database.objectStoreNames.length < 1 ||
            !this.database.objectStoreNames.contains(this.objectStoreName)
        ) {
            console.log("[DB MIGRATION] No " + this.objectStoreName + " object store, exiting");
            return;
        }

        let oldInitData = await this.getByKey("usersInitData").catch(() => null);

        if (!oldInitData || oldInitData.length == 0) {
            console.log("[DB MIGRATION] No init data in IDB, no migration needed.");
            return;
        } else {
            await this.storage.set("usersInitData", oldInitData);
            console.log(
                "[DB MIGRATION] Migration complete: refresh_token = ",
                await this.storage.get("usersInitData")
            );
        }

        let keys = [
            //APP
            "analyticsCollectionEnabled",
            "toastLoggingEnabled",
            "devSettingsEnabled",
            "localNotificationsEnabled",
            "webApiRegistration",
            "userAgent",
            "language",
            "homeRequests",
            "doHomeworkFilter",
            "sidemenu",
            "usersInitData",
            "defaultPage",
            "lastClearedCacheStorage",
            //THEME
            "theme",
            "base64bg",
            "background-size",
            "background-position-x",
            "background-position-y",
            "bdClass",
            //COLOR
            "cardColor",
        ];

        let promises = [];
        keys.forEach(key => promises.push(this.migratePreference(key)));
        await Promise.all(promises);

        await this.clearOS();
        console.log("[DB MIGRATION] IDB cleared.");
        console.log("[DB MIGRATION] Complete.");
    }

    private async migratePreference(key: string): Promise<void> {
        console.log("[DB MIGRATION] Starting migration of key: ", key);

        if (!(await this.storage.get(key))) {
            let item = await this.getByKey(key);

            console.log("[DB MIGRATION] Key, item from idb: ", key, item);

            if (item) {
                await this.storage.set(key, item);
                console.log("[DB MIGRATION] Migration complete: ", key, item);
            }
        }
    }
}
