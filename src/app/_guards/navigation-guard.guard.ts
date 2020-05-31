import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Platform } from '@ionic/angular';
@Injectable({
  providedIn: 'root'
})
export class NavigationGuard implements CanActivate {
  private isReady = false;
  constructor(
    private plt: Platform,
  ) {
    this.plt.ready().then(() => {
      this.isReady = true;
    })
  }
  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    if (this.isReady) {
      return true;
    } else {
      await this.plt.ready();
      return true;
    }
  }
}
