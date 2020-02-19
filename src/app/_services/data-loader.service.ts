import { Injectable } from '@angular/core';
import { KretaService } from './kreta.service';
import { Observable, Subject } from 'rxjs';
import { Storage } from '@ionic/storage';
import { FormattedDateService } from './formatted-date.service';
import { Student, CollapsibleStudent } from '../_models/student';
import { CacheService } from './cache.service';

interface LoadedData {
  data: Student;
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

  public student = new Subject<LoadedData>();

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
}
