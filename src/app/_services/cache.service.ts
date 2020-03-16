import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { stringify } from 'querystring';
import { Lesson } from '../_models/lesson';
import { Institute } from '../_models/institute';
import { Student } from '../_models/student';
import { Test } from '../_models/test';
import { PromptService } from './prompt.service';
import { Message } from '../_models/message';
import { DataService } from './data.service';
import { Event } from '../_models/event';

interface storedData {
  data: any;
  storedDate: Date;
}
@Injectable({
  providedIn: 'root'
})
export class CacheService {

  constructor(
    private storage: Storage,
    private prompt: PromptService,
  ) {
  }

  async setCache(key: string, data: any) {
    let date = new Date();
    let currentData: storedData = {
      data: data,
      storedDate: date
    };
    await this.storage.set(key, currentData);
  }

  async isCacheNeeded(cacheData: storedData, cacheTime: number) {
    var date = new Date();
    if (cacheData == null) {
      console.log('%c[CACHE->isCacheNeeded] Cache nonexistent', 'background: #b38484; color: black');
      return false;
    }
    let storedDate = new Date(cacheData.storedDate).valueOf();
    if (storedDate != 0 && storedDate + cacheTime > date.valueOf()) {
      console.log('%c[CACHE->isCacheNeeded] Caching', 'background: #86b384; color: black');
      return true;
    } else {
      console.log('%c[CACHE->isCacheNeeded] Cache outdated', 'background: #b3a684; color: black');
      return false;
    }
  }

  //cacheTime 1200000
  async getCacheIf(key: string, cacheTime: number = 1200000): Promise<boolean | Event[] | Lesson[] | Institute[] | Student | Test[] | Message[] | Message> { //300000ms = 5min
    //gives back the cache if it exists and if it isn't older than cacheTime
    let cacheItem = await this.storage.get(key);
    if (await this.isCacheNeeded(cacheItem, cacheTime)) {
      return cacheItem.data;
    }
    else {
      return false;
    };
  }

  async clearCacheByKey(key: string) {
    this.storage.remove(key)
  }
}
