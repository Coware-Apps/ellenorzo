import { Injectable } from '@angular/core';
import { CanDeactivate, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { DirtyPage } from './DirtyPage';
import { PromptService } from '../_services/prompt.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class ExitGuard implements CanDeactivate<DirtyPage> {
  constructor(
    private prompt: PromptService,
    private translator: TranslateService,
  ) { }
  async canDeactivate(
    component: DirtyPage,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ): Promise<boolean> {
    if (component.isDirty() && !component.allowNavigationTo.includes(nextState.url)) {
      let promptRes = await this.prompt.getTrueOrFalseWithText(
        this.translator.instant('common.alertText'),
        null,
        this.translator.instant('common.dataWillBeLost')
      );
      return promptRes;
    } else {
      return true;
    }
  }

}
