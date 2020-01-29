import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

  constructor(
    private authService: AuthenticationService,
  ) { }

  //so this shit can only run if this.authService.isAuthenticated == true
   canActivate(): boolean {
     return this.authService.isAuthenticated();
   }
}
