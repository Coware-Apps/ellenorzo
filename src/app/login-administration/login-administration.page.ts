import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserManagerService } from '../_services/user-manager.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-login-administration',
  templateUrl: './login-administration.page.html',
  styleUrls: ['./login-administration.page.scss'],
})
export class LoginAdministrationPage implements OnInit {

  private willLeaveUnsubscribe$: Subject<void>;

  constructor(
    private router: Router,
    private userManager: UserManagerService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.willLeaveUnsubscribe$ = new Subject<void>();
    this.userManager.reloader.pipe(takeUntil(this.willLeaveUnsubscribe$)).subscribe(r => {
      if (r == 'reload') {
        if (this.userManager.currentUser.administrationTokens) {
          this.router.navigateByUrl("messages");
        }
      }
    })
  }

  ionViewWillLeave() {
    this.willLeaveUnsubscribe$.next();
    this.willLeaveUnsubscribe$.complete();
  }

  goToMessages() {
    this.router.navigateByUrl("messages");
  }
}
