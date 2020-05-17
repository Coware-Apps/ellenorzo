import { Injectable } from '@angular/core';
import { User, userInitData } from '../_models/user';
import { UserFactoryService } from './user-factory.service';
import { Institute } from '../_models/institute';
import { Token } from '../_models/token';
import { AppService } from './app.service';
import { Subject } from 'rxjs';
import { NotificationService } from './notification.service';
import { DataService } from './data.service';
import { Storage } from '@ionic/storage';
import { KretaService } from './kreta.service';
import { MenuController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class UserManagerService {
  public currentUser: User;
  public allUsers: User[] = [];
  public reloader = new Subject<'reload'>();
  constructor(
    private userFactory: UserFactoryService,
    private app: AppService,
    private notificationService: NotificationService,
    private data: DataService,
    private storage: Storage,
    private kreta: KretaService,
    private menuCtrL: MenuController,
  ) {
  }

  public async onInit() {
    let storedUsersInitData: userInitData[] = await this.storage.get("usersInitData");
    if (storedUsersInitData != null && storedUsersInitData.length > 0) {
      this.createExistingUsers(storedUsersInitData);
      this.switchToUser(storedUsersInitData[0].id);
      if (this.app.localNotificationsEnabled) {
        this.allUsers.forEach(async user => {
          user.preInitializeLocalNotifications();
        });
      }
      this.app.isStudentSelectorReady = true;
    } else {
      //migrating
      let oldRefreshToken = await this.storage.get('refresh_token');
      if (oldRefreshToken != null) {
        let oldInstitute = await this.storage.get('institute');
        let newTokens = await this.kreta.renewToken(oldRefreshToken, oldInstitute);
        if (newTokens != null) {
          await this.addUser(newTokens, oldInstitute);
          await this.storage.remove('refresh_token');
          await this.storage.remove('institute');
          await this.menuCtrL.enable(true);
          this.app.isStudentSelectorReady = true;
        }
      }
    }
  }

  /**
  * Adds a non existing user to both the initdata array as a userInitData object and to the user-manager service as a new instance of the class User. Also sets the currentUser of the user-manager to the new instance.
  @param {Token} tokens the tokens to create a new user object with
  @param {Institute} institute the institute to create a new user object with
  @returns {Promise<boolean>} true if the user doesn't yet exist, false if it does
  */
  public async addUser(tokens: Token, institute: Institute): Promise<boolean> {
    let newUser = this.userFactory.createUser(tokens, institute);
    if (await newUser.fetchUserData()) {
      this.allUsers.push(newUser);
      this.switchToUser(newUser.id);
      console.log('[USER-MANAGER] added user', this.currentUser);
      return true;
    } else {
      return false;
    }
  }
  public async removeUser(userId: number) {
    //removing the user from app.service.ts initData
    for (let i = 0; i < this.app.usersInitData.length; i++) {
      if (this.app.usersInitData[i].id == userId) {
        this.app.usersInitData.splice(i, 1);
      }
    }
    //removing the user from the user-manager.service allUsers,
    //removing the user's cache
    //deleting local notifications if the deleted user had them enabled
    for (let i = 0; i < this.allUsers.length; i++) {
      if (this.allUsers[i].id == userId) {
        //canceling notifications if they were enabled
        if (this.allUsers[i].notificationsEnabled) {
          await this.notificationService.cancelAllNotifications();
        }
        //removing cache, user
        await this.allUsers[i].clearUserCache();
        this.allUsers.splice(i, 1);
      }
    }
    //logging out if this was the last user and switching to the last user in the allUsers array if it wasn't,
    if (this.allUsers.length == 0) {
      //logging out, navigating
      this.app.isStudentSelectorReady = false;
      this.currentUser = null;
      await this.app.clearStorage(true);
      return "login";
    } else {
      //switching to another user
      if (this.currentUser.id == userId) {
        this.switchToUser(this.allUsers[this.allUsers.length - 1].id);
      }
    }
    await this.app.changeConfig("usersInitData", this.app.usersInitData);
    console.log('[USER-MANAGER] removed a user, new usersInitData', this.app.usersInitData);
  }
  public async logOutOfAdministration(userId: number) {
    for (let i = 0; i < this.allUsers.length; i++) {
      if (userId == this.allUsers[i].id) {
        await this.allUsers[i].logOutOfAdministration();
      }
    }
  }
  public switchToUser(userId: number) {
    console.log('[USER-MANAGER->switchToUser()] switching to user', userId);
    this.allUsers.forEach(user => {
      if (user.id == userId) {
        this.currentUser = user;
        this.reloader.next('reload');
      }
    });
  }
  public createExistingUsers(usersInitData: userInitData[]) {
    this.allUsers = [];
    usersInitData.forEach(userInitData => {
      let newUser = this.userFactory.createUser(userInitData.tokens, userInitData.institute);
      newUser.setUserData(
        userInitData.fullName,
        userInitData.id,
        userInitData.notificationsEnabled,
        userInitData.lastNotificationSetTime,
        userInitData.adminstrationTokens,
      );
      this.allUsers.push(newUser);
    });
  }
  public async clearAllUserCacheByCategory(
    key: 'student' | 'tests' | 'messageList' | 'lesson' |
      'studentHomeworks' | 'teacherHomeworks' | 'events' |
      'combined'
  ) {
    this.allUsers.forEach(async u => {
      await u.clearUserCacheByCategory(key);
    });
  }
}
