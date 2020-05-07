import { Component, OnInit } from '@angular/core';
import { UserManagerService } from 'src/app/_services/user-manager.service';
import { Router } from '@angular/router';
import { AppService } from 'src/app/_services/app.service';
import { PromptService } from 'src/app/_services/prompt.service';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.page.html',
  styleUrls: ['./user-settings.page.scss'],
})
export class UserSettingsPage implements OnInit {

  constructor(
    public userManager: UserManagerService,
    public app: AppService,

    private router: Router,
    private prompt: PromptService
  ) { }

  ngOnInit() {
  }

  public addUser() {
    this.router.navigateByUrl("/login");
  }

  resetTokenTime(API: 'mobile' | 'administration', id: number) {
    this.userManager.allUsers.forEach(u => {
      if (u.id == id) {
        u.resetTokenTime(API);
      }
    });
    this.prompt.toast('Last token refresh time set to 0. Before the next request the user will get fresh tokens.', true);
  }

  isTokenTimeZero(API: 'mobile' | 'administration', id: number) {
    let rVal = false;
    this.userManager.allUsers.forEach(u => {
      if (u.id == id) {
        rVal = u.isTokenTimeZero(API);
      }
    });
    return rVal;
  }

  async removeUser(userId) {
    let res = await this.userManager.removeUser(userId)
    if (res == "login") {
      this.router.navigateByUrl("login");
    }
  }
}
