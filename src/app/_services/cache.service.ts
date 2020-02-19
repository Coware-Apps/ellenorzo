import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { stringify } from 'querystring';
import { Lesson } from '../_models/lesson';
import { Institute } from '../_models/institute';
import { Student } from '../_models/student';
import { Test } from '../_models/test';
import { PromptService } from './prompt.service';
import { Message } from '../_models/message';

interface storedData {
  data: any;
  storedDate: Date;
}
@Injectable({
  providedIn: 'root'
})
export class CacheService {

  private ramStorage: any[];

  constructor(
    private storage: Storage,
    private prompt: PromptService,
  ) {
    this.ramStorage = [];
  }

  async setCache(key: string, data: any) {
    let date = new Date();
    let currentData: storedData = {
      data: data,
      storedDate: date
    };
    this.storage.set(key, currentData);
  }

  async getCache(key: string) {
    return (await this.storage.get(key)).data;
  }

  async doWeNeedCache(key: string, cacheTime: number) {
    var date = new Date();
    let stored = await this.storage.get(key);
    if (stored == null) {
      return false;
    }
    let storedDate = new Date(stored.storedDate).valueOf();
    // console.log('[CACHE] key: ', key);
    // console.log('[CACHE] data corresponding to key: ', await this.storage.get(key));
    //console.log('[CACHE] cacheTime: ', cacheTime);
    //console.log('[CACHE] timeDiff', date.valueOf() - storedDate.valueOf());
    if (storedDate != 0 && storedDate + cacheTime > date.valueOf()) {
      return true;
    }
    else {
      return false;
    }
  }

  async clearStorage(keepSettings: boolean = true) {
    if (keepSettings) {
      this.ramStorage.push(await this.storage.get("base64bg"));
      this.ramStorage.push(await this.storage.get("bgSize"));
      this.ramStorage.push(await this.storage.get("bgX"));
      this.ramStorage.push(await this.storage.get("bgY"));
      this.ramStorage.push(await this.storage.get("cardColor"));
      this.ramStorage.push(await this.storage.get("defaultPage"));
      this.ramStorage.push(await this.storage.get("theme"));
      this.ramStorage.push(await this.storage.get("antiSpamUA"));

      await this.storage.clear();

      this.storage.set("base64bg", this.ramStorage[0]);
      this.storage.set("bgSize", this.ramStorage[1]);
      this.storage.set("bgX", this.ramStorage[2]);
      this.storage.set("bgY", this.ramStorage[3]);
      this.storage.set("cardColor", this.ramStorage[4]);
      this.storage.set("defaultPage", this.ramStorage[5]);
      this.storage.set("theme", this.ramStorage[6]);
      this.storage.set("antiSpamUA", this.ramStorage[7]);
    } else {
      this.storage.clear();
    }
  }

  //cacheTime 1200000
  async getCacheIf(key: string, cacheTime: number = 1200000): Promise<boolean | Lesson[] | Institute[] | Student | Test[] | Message[] | Message> { //300000ms = 5min
    //gives back the cache if it exists and if it isn't older than cacheTime
    if (await this.doWeNeedCache(key, cacheTime)) {
      console.log('[CACHE] Getting data from cache...');
      this.prompt.butteredToast('[CACHE] Getting data from cache...');
      return await this.getCache(key);
    }
    else {
      console.log('[CACHE] Cache outdated or nonexistent');
      this.prompt.butteredToast('[CACHE] Cache outdated or nonexistent');
      return false;
    };
  }

  async clearCacheByKey(key: string) {
    this.storage.remove(key)
  }
}
