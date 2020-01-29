import { Injectable } from '@angular/core';

interface memoryStorage {
  id: string;
  time: number;
}

@Injectable({
  providedIn: 'root'
})
export class AntiSpamService {

  private storedData: Array<memoryStorage>;
  private storageItem: memoryStorage;
  constructor() { 
    this.storedData = [];
    this.storageItem = {id: "", time: 0};
  }

  click(id: string) {
    let date = new Date();
    this.storageItem.id = id;
    this.storageItem.time = date.valueOf();

    this.storedData.push(this.storageItem);
  }

  canRefresh(id: string, time: number = 120000) {
    let date = new Date();
    let returnVal = false;
    let idExists = false;

    for (let i = 0; i < this.storedData.length; i++) {
      if (this.storedData[i].id == id && date.valueOf() - this.storedData[i].time.valueOf() > time) {
        returnVal = true;
      }
      if (this.storedData[i].id == id) {
        idExists = true;
      }
    }
    if (!idExists) {
      //because the shit was loaded form cache
      return true;
    } else {
      return returnVal;
    }
  }


}
