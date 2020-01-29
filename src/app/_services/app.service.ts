import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppComponent } from '../app.component';
import { trimTrailingNulls } from '@angular/compiler/src/render3/view/util';

@Injectable({
  providedIn: 'root'
})


export class AppService {

  public appPages: {
    title: string,
    url: string,
    icon: string,
    src?: string;
    show: boolean,
  }[];

  constructor() { 
    this.appPages = [{
      title: 'Főoldal',
      url: '/home',
      icon: 'home',
      show: true,
    },
    {
      title: 'Értékelések',
      url: '/evaluations',
      icon: '',
      src: "/assets/extraicons/evaluation.svg",
      show: true,
    },
    {
      title: 'Órarend',
      url: '/list',
      icon: 'list',
      show: true,
    },
    {
      title: 'Statisztikák',
      url: '/statistics',
      icon: 'analytics',
      show: true,
    },
    {
      title: 'Átlagok',
      url: '/averages',
      icon: 'trending-up',
      show: true,
    },
    {
      title: 'Mulasztások',
      url: '/absences',
      icon: 'calendar',
      show: true,
    },
    {
      title: 'Feljegyzések',
      url: '/notes',
      icon: 'clipboard',
      show: true,
    },
    {
      title: 'Házi feladatok',
      url: '/homeworks',
      icon: '',
      show: true,
      src: "/assets/extraicons/homewarning.svg",
    },
    {
      title: 'Számonkérések',
      url: '/tests',
      icon: '',
      show: true,
      src: "/assets/extraicons/test.svg",
    },
    {
      title: 'Beállítások',
      url: '/settings',
      icon: 'settings',
      show: true,
    }];
  }  

  hidePage(title: string) {
    this.appPages.forEach(page => {
      if (page.title == title) {
        page.show = false;
      console.log("hid", page.title);
    }
    });
  }

  showPage(title: string) {
    this.appPages.forEach(page => {
      if (page.title == title) {
      page.show = true;
      console.log("shown", page.title);
      }
    });
  }

  //when something is updated
  updated = new BehaviorSubject("init");

  public updateConfig() {
    this.updated.next("updated");
  }

  public finishConfig() {
    this.updated.next("finished");
  }
}
