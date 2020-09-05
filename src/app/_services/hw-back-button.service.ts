import { Injectable, NgZone } from "@angular/core";
import { Platform } from "@ionic/angular";
import { Subject, Subscription } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { Router } from "@angular/router";

@Injectable({
    providedIn: "root",
})
export class HwBackButtonService {
    constructor(private platform: Platform, private ngZone: NgZone, private router: Router) {}

    public registerHwBackButton(unsubscribe$: Subject<void>, exit: boolean = false): Subscription {
        if (this.platform.is("android")) {
            return this.platform.backButton.pipe(takeUntil(unsubscribe$)).subscribe({
                next: () => {
                    if (exit) navigator["app"].exitApp();
                    else this.ngZone.run(() => this.router.navigateByUrl("/home"));
                },
            });
        } else {
            return new Subscription();
        }
    }
}
