import { Injectable } from '@angular/core';
import { ConvertActionBindingResult } from '@angular/compiler/src/compiler_util/expression_converter';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class FormattedDateService {

  getDate(whatDate: "today" | "thisMonthBegin" | "thisMonthEnd" | "thisYearBegin" = "today") {
    let date: Date = new Date();
    let month: number = 0;

    //Because .Day() gives back monday, tuesday etc
    let dateStringSplitted: string[] = date.toString().split(" ");

    //Because this shit gives back a value from 0-11
    month = date.getMonth() + 1;

    if (whatDate == "today") {
      return (date.getFullYear() + "-" + month + "-" + dateStringSplitted[2]);
    }
    else if (whatDate == "thisMonthBegin") {
      return (date.getFullYear() + "-" + month + "-" + "01");
    }
    else if (whatDate == "thisMonthEnd") {
      let numOfDays = new Date(date.getFullYear(), date.getMonth() + 1, 1).getDay();
      return (date.getFullYear() + "-" + month + "-" + numOfDays);
    }
    else if (whatDate == "thisYearBegin") {
      if (date.getMonth() + 1 >= 9) {
        //from september
        return (date.getFullYear() + "-" + "09" + "-" + "01");
      } else {
        //until september
        return ((date.getFullYear() - 1) + "-" + "09" + "-" + "01");
      }
    }
  }

  getTomorrow(extradays: number = 0) {
    let date = new Date()
    let month: number = 0;
    let dayNum: number;

    let chosenDay = new Date(date);
    chosenDay.setDate(date.getDate() + 1 + extradays);

    //day
    let dateStringSplitted: string[] = chosenDay.toString().split(" ");

    //month
    month = chosenDay.getMonth() + 1;
    return (chosenDay.getFullYear() + "-" + month + "-" + dateStringSplitted[2]);
  }

  formatDate(adate: Date) {
    let date = new Date(adate);
    let month: number = 0;

    //Because .Day() gives back monday, tuesday etc
    let dateStringSplitted: string[] = date.toString().split(" ");

    //Because this shit gives back a value from 0-11
    month = date.getMonth() + 1;

    return (date.getFullYear() + "-" + month + "-" + dateStringSplitted[2]);
  }

  formatDateWithZerosAndDots(d: any) {
    let date = new Date(d);
    let month: number = 0;

    //Because .Day() gives back monday, tuesday etc
    let dateStringSplitted: string[] = date.toString().split(" ");

    //Because this shit gives back a value from 0-11
    month = date.getMonth() + 1;

    return (this.addZeroToNumberByLength(date.getFullYear()) + ". " + this.addZeroToNumberByLength(month) + ". " + this.addZeroToNumberByLength(dateStringSplitted[2]) + ".");
  }

  getWeekFirst(extraWeeks: number = 0) {
    var date = new Date();
    date.setDate(date.getDate() + extraWeeks * 7);
    var day = date.getDay();
    let returndate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + (day == 0 ? -6 : 1) - day);
    let month = returndate.getMonth() + 1;
    return (returndate.getFullYear() + "-" + month + "-" + parseInt(returndate.toString().split(" ")[2]));
  }

  getWeekLast(extraWeeks: number = 0) {
    var date = new Date();
    date.setDate(date.getDate() + extraWeeks * 7);
    var day = date.getDay();
    let returndate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + (day == 0 ? 0 : 7) - day);
    let month = returndate.getMonth() + 1;
    return (returndate.getFullYear() + "-" + month + "-" + parseInt(returndate.toString().split(" ")[2]));
  }

  getWeekFirstDate(extraWeeks: number = 0) {
    var date = new Date();
    date.setDate(date.getDate() + extraWeeks * 7);
    var day = date.getDay();
    let returndate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + (day == 0 ? -6 : 1) - day);
    return returndate;
  }

  getWeekLastDate(extraWeeks: number = 0) {
    var date = new Date();
    date.setDate(date.getDate() + extraWeeks * 7);
    var day = date.getDay();
    let returndate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + (day == 0 ? 0 : 7) - day);
    return returndate;
  }
  getWeekLastUTC(extraWeeks: number = 0): string {
    //gives back sunday, 23:00 of the current week in UTC string format
    let date = new Date();
    date.setDate(date.getDate() + extraWeeks * 7);
    date.setDate(date.getDate() + (7 - date.getDay()));
    date.setMinutes(23, 0);

    let month = date.getMonth() + 1;

    return date.toUTCString();
  }

  formatDateKRETA(date: Date): string {
    let dateStringSplitted: string[] = date.toString().split(" ");

    return (date.getFullYear() + '. ' + (date.getMonth() + 1) + '. ' + dateStringSplitted[2] + '. ' + '0:00:00')
  }

  addZeroToNumber(n: any) {
    if (n < 10) {
      return "0" + n;
    } else {
      return n;
    }
  }

  public addZeroToNumberByLength(n: number | string) {
    if (n.toString().length < 2) {
      return "0" + n;
    } else {
      return n;
    }
  }

  getTimetableTime(StartTime: Date, EndTime: Date) {
    let start = this.returnCorrectTime(StartTime);
    let end = this.returnCorrectTime(EndTime);
    return start.getHours() + ":" + (start.getMinutes() >= 10 ? start.getMinutes() : "0" + start.getMinutes()) + "-" + end.getHours() + ":" + (end.getMinutes() >= 10 ? end.getMinutes() : "0" + end.getMinutes());
  }

  getTime(d: Date) {
    let date = this.returnCorrectTime(d);
    return date.getHours() + ":" + (date.getMinutes() >= 10 ? date.getMinutes() : "0" + date.getMinutes());
  }

  returnCorrectTime(d: Date) {
    let date = new Date(d);
    if (this.plt.is('ios')) {
      date.setHours(new Date(date.getTime()).getHours() + date.getTimezoneOffset() / 60)
    }
    return date;
  }

  getWeek(d: Date) {
    //returns the 1-based week of the year
    let onejan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.valueOf() - onejan.valueOf()) / 86400000) + onejan.getDay() + 1) / 7);
  }


  constructor(private plt: Platform) { }
}
