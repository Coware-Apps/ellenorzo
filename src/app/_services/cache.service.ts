import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage";
import { PromptService } from "./prompt.service";

interface storedData {
    data: any;
    storedDate: Date;
}
@Injectable({
    providedIn: "root",
})
export class CacheService {
    constructor(private storage: Storage, private prompt: PromptService) {}

    async setCache(key: string, data: any) {
        let date = new Date();
        let currentData: storedData = {
            data: data,
            storedDate: date,
        };
        await this.storage.set(key, currentData);
    }

    isCacheValid(cacheData: storedData, cacheTime: number = 1200000) {
        var date = new Date();
        if (cacheData == null) {
            console.log(
                "%c[CACHE->isCacheNeeded] Cache nonexistent",
                "background: #b38484; color: black"
            );
            return false;
        }
        let storedDate = new Date(cacheData.storedDate).valueOf();
        if (storedDate != 0 && storedDate + cacheTime > date.valueOf()) {
            console.log(
                "%c[CACHE->isCacheNeeded] Cache valid",
                "background: #86b384; color: black"
            );
            return true;
        } else {
            console.log(
                "%c[CACHE->isCacheNeeded] Cache outdated",
                "background: #b3a684; color: black"
            );
            return false;
        }
    }

    //cacheTime 1200000
    async getCacheIf(key: string, cacheTime: number = 1200000): Promise<any> {
        //300000ms = 5min
        //gives back the cache if it exists and if it isn't older than cacheTime
        let cacheItem = await this.storage.get(key);
        if (this.isCacheValid(cacheItem, cacheTime)) {
            return cacheItem.data;
        } else {
            return false;
        }
    }

    async clearCacheByKey(key: string) {
        this.storage.remove(key);
    }

    async updateCache(key: string, data) {
        await this.clearCacheByKey(key);
        await this.setCache(key, data);
    }
}
