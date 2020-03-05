import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {
  activator: boolean = false;
  constructor() { }

  canActivate(): boolean {
    return this.activator;
  }
}
