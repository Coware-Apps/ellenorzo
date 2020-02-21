import { Injectable } from '@angular/core';
import { KretaService } from './kreta.service';
import { Observable, Subject } from 'rxjs';
import { Storage } from '@ionic/storage';
import { FormattedDateService } from './formatted-date.service';
import { Student, CollapsibleStudent } from '../_models/student';
import { CacheService } from './cache.service';
import { Test } from '../_models/test';
import { Message } from '../_models/message';

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
@Injectable({
  providedIn: 'root'
})
export class DataLoaderService {
  constructor(
    private kreta: KretaService,
    private storage: Storage,
    private fDate: FormattedDateService,
    private cache: CacheService,
  ) {

  }

  //#region student
  public student = new Subject<LoadedStudent>();

  initializeStudent() {
    this.cache.getCacheIf("_studentData").then(cacheDataIf => {
      if (cacheDataIf == false) {
        //cache is outdated
        this.storage.get('_studentData').then(storedStudent => {
          if (storedStudent != null) {
            this.student.next({
              data: storedStudent.data,
              type: "placeholder"
            });
            console.log('storedData exists, displaying it');
          } else {
            this.student.next({
              data: null,
              type: "skeleton"
            });
            console.log('storedData doesnt exist, showing skeleton');
          }
          //this would check for cache again, but we don't need it to, we know that cache doesn't exist, ergo the forceRefresh parameter must be true 
          this.kreta.getStudent(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"), true).then(student => {
            console.log('got student from the server returning it');
            this.student.next({
              data: student,
              type: "final",
            });
          });
        });
      } else {
        //cache exists and it isn't outdated
        console.log('[DATA-LOADER] Returning cached data');
        this.student.next({
          data: <Student>cacheDataIf,
          type: "final"
        });
      }
    });
  }

  public async updateStudent() {
    let updatedStudent = await this.kreta.getStudent(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"), true);
    this.student.next({
      data: updatedStudent,
      type: "final",
    });
  }
  //#endregion

  //#region tests
  public tests = new Subject<LoadedTests>();

  initializeTests() {
    this.cache.getCacheIf("_testData").then(cacheDataIf => {
      if (cacheDataIf == false) {
        //cache is outdated
        this.storage.get('_testData').then(storedTests => {
          if (storedTests != null) {
            this.tests.next({
              data: storedTests.data,
              type: "placeholder"
            });
            console.log('storedData exists, displaying it');
          } else {
            this.tests.next({
              data: null,
              type: "skeleton"
            });
            console.log('storedData doesnt exist, showing skeleton');
          }
          //this would check for cache again, but we don't need it to, we know that cache doesn't exist, ergo the forceRefresh parameter must be true 
          this.kreta.getTests(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"), true).then(tests => {
            console.log('got tests from the server, returning it');
            this.tests.next({
              data: tests,
              type: "final",
            });
          });
        });
      } else {
        //cache exists and it isn't outdated
        this.tests.next({
          data: <Test[]>cacheDataIf,
          type: "final"
        });
      }
    });
  }

  public async updateTests() {
    let updatedTests = await this.kreta.getTests(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"), true);
    this.tests.next({
      data: updatedTests,
      type: "final",
    });
  }
  //#endregion

  //#region messageList
  public messageList = new Subject<LoadedMessageList>();

  initializeMessageList() {
    this.cache.getCacheIf('_messageListData').then(cacheDataIf => {
      if (cacheDataIf == false) {
        //cache is outdated
        this.storage.get('_messageListData').then(storedMessageList => {
          if (storedMessageList != null) {
            this.messageList.next({
              data: storedMessageList.data,
              type: "placeholder"
            });
            console.log('storedData exists, displaying it');
          } else {
            this.messageList.next({
              data: null,
              type: "skeleton"
            });
            console.log('storedData doesnt exist, showing skeleton');
          }
          //this would check for cache again, but we don't need it to, we know that cache doesn't exist, ergo the forceRefresh parameter must be true 
          this.kreta.getMessageList(true).then(messageList => {
            console.log('got messageList from the server, returning it');
            this.messageList.next({
              data: messageList,
              type: "final",
            });
          });
        });
      } else {
        //cache exists and it isn't outdated
        this.messageList.next({
          data: <Message[]>cacheDataIf,
          type: "final"
        });
      }
    });
  }

  public async updateMessageList() {
    let updatedMessageList = await this.kreta.getMessageList(true);
    this.messageList.next({
      data: updatedMessageList,
      type: "final",
    });
  }
  //#endregion


}
