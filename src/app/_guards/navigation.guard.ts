import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AppService } from '../_services/app.service';
import { UserManagerService } from '../_services/user-manager.service';
import { Storage } from '@ionic/storage';
import { userInitData } from '../_models/user';

@Injectable({
  providedIn: 'root'
})
export class NavigationGuard implements CanActivate {
  constructor(
    private app: AppService,
    private router: Router,
    private storage: Storage,
  ) {
  }
  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    let s: userInitData[] = await this.storage.get('usersInitData');
    let p = await this.storage.get('defaultPage');
    if (s && s.length > 0) {
      if (next.queryParams["startup"]) {
        if (p) {
          if (state.url.includes('?') && p == state.url.split('?')[0]) {
            return true;
          } else {
            await this.router.navigate([p]);
          }
        } else {
          if (state.url.includes('?') && state.url.split('?')[0] == "/home") {
            return true;
          } else {
            await this.router.navigate(["/home"]);
          }
        }
      }
      //so if we want to go to the main page (defined by the user), we add a startup queryparam to any page
      return true;
    } else {
      await this.router.navigate(["/login"], {
        replaceUrl: true,
      });
      return false;
    }
  }
}
