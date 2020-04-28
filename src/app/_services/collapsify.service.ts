import { Injectable } from '@angular/core';
import { Note, Absence, evaluation } from '../_models/student';
import { TranslateService } from '@ngx-translate/core';
import { Lesson } from '../_models/lesson';

export interface UniversalSortedData {
  index: number;
  header: string;
  data: any[] | Note[] | Absence[] | evaluation[] | Lesson[];
  firstEntryCreatingTime: number;
  showAll: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CollapsifyService {
  private monthsName: string[];
  private dayNames: string[];
  constructor(
    private translator: TranslateService,
  ) {
    this.monthsName = this.translator.instant('dates.monthNames')
    this.dayNames = this.translator.instant('dates.dayNames');
  }

  collapsifyByMonths(data: any[], groupBy: string, sortBy: string = groupBy): UniversalSortedData[] {
    //sortBy and groupBy must reference a date field!
    let months: number[] = [];
    let sortedData: UniversalSortedData[] = [];

    data.forEach(element => {
      let sortByMonth = new Date(element[groupBy]).getMonth();
      if (!months.includes(sortByMonth)) {
        months.push(sortByMonth);
      }
    });

    let i = 0;
    months.forEach(month => {
      let monthlyData: any[] = [];
      data.forEach(item => {
        if (new Date(item[groupBy]).getMonth() == month) {
          monthlyData.push(item);
        }
      });

      monthlyData.sort((a, b) => new Date(b[sortBy]).valueOf() - new Date(a[sortBy]).valueOf());

      sortedData.push({
        index: i,
        header: this.monthsName[month],
        data: monthlyData,
        firstEntryCreatingTime: new Date(monthlyData[monthlyData.length - 1][sortBy]).valueOf(),
        showAll: true,
      });
      i++;
    });

    sortedData.sort((a, b) => b.firstEntryCreatingTime - a.firstEntryCreatingTime);

    return sortedData;
  }

  collapsifyByDates(data: any[], groupBy: string, sortBy: string = groupBy): UniversalSortedData[] {
    //sortBy, groupBy must reference a date / datestring field!
    let dates: string[] = [];
    let sortedData: UniversalSortedData[] = [];

    data.forEach(element => {
      //2020-01-01
      let sortByDate = element[groupBy].substring(0, 10);
      if (!dates.includes(sortByDate)) {
        dates.push(sortByDate);
      }
    });

    let i = 0;
    dates.forEach(date => {
      let dataOnCurrentDate: any[] = [];
      data.forEach(item => {
        if (item[groupBy].substring(0, 10) == date) {
          dataOnCurrentDate.push(item);
        }
      });

      dataOnCurrentDate.sort((a, b) => new Date(b[sortBy]).valueOf() - new Date(a[sortBy]).valueOf());

      //2019-01-01 ---> 2019.01.01 (dayOfWeek)
      let dayOfWeek = this.dayNames[new Date(date).getDay()];
      date = (date.replace('-', '.').replace('-', '.') + ' (' + dayOfWeek + ')');

      sortedData.push({
        index: i,
        header: date,
        data: dataOnCurrentDate,
        firstEntryCreatingTime: new Date(dataOnCurrentDate[dataOnCurrentDate.length - 1][sortBy]).valueOf(),
        showAll: true,
      });
      i++;
    });

    sortedData.sort((a, b) => b.firstEntryCreatingTime - a.firstEntryCreatingTime);

    return sortedData;
  }

  collapsifyByNames(data: any[], groupBy: string, sortBy: string = groupBy): UniversalSortedData[] {
    //sortBy, groupBy must reference a date / datestring field!
    let names: string[] = [];
    let sortedData: UniversalSortedData[] = [];

    data.forEach(element => {
      let groupByName = element[groupBy];
      if (!names.includes(groupByName)) {
        names.push(groupByName);
      }
    });

    let i = 0;
    names.forEach(name => {
      let dataWithCurrentName: any[] = [];
      data.forEach(item => {
        if (item[groupBy] == name) {
          dataWithCurrentName.push(item);
        }
      });

      dataWithCurrentName.sort((a, b) => new Date(b[sortBy]).valueOf() - new Date(a[sortBy]).valueOf());


      sortedData.push({
        index: i,
        header: name,
        data: dataWithCurrentName,
        firstEntryCreatingTime: new Date(dataWithCurrentName[dataWithCurrentName.length - 1][sortBy]).valueOf(),
        showAll: true,
      });
      i++;
    });

    sortedData.sort((a, b) => b.firstEntryCreatingTime - a.firstEntryCreatingTime);

    return sortedData;
  }

  closeAllOpenTop(universalSortedData: UniversalSortedData[]): UniversalSortedData[] {
    for (let i = 0; i < universalSortedData.length; i++) {
      if (i == 0) {
        universalSortedData[i].showAll = true;
      } else {
        universalSortedData[i].showAll = false;
      }
    }
    return universalSortedData;
  }
}
