import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Storage } from '@ionic/storage';
import { Platform } from '@ionic/angular';
import { CacheService } from './cache.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  authenticationState = new BehaviorSubject(false);
  public authenticationTime = new BehaviorSubject(new Date().valueOf());

  constructor(
    private plt: Platform,
    private router: Router,
  ) {
    this.authenticationTime = new BehaviorSubject(new Date().valueOf());
    this.plt.ready().then(readySource => {
      this.authenticationTime = new BehaviorSubject(0);
    })
  }

  login() {
    this.authenticationState.next(true);
    this.authenticationTime.next(new Date().valueOf());
  }

  logout() {
    this.authenticationState.next(false);
    this.authenticationTime.next(null);
    this.router.navigate(['login']);
  }

  isLoginNeeded(authFor: number) {

    let date = new Date().valueOf()
    if (this.authenticationTime.value + authFor < date) {
      console.log("[AUTH->isLoginNeeded()] New login needed");
      return true;
    }
    else {
      console.log("[AUTH->isLoginNeeded()] No login needed (time until next login: " + ((date - this.authenticationTime.value) / 1000) + "s/" + (authFor / 1000) + "s)");
      return false;
    }
  }

  //not Async
  isAuthenticated() {
    return this.authenticationState.value;
  }

}
