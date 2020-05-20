import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { Injectable } from "@angular/core";

declare var Hammer: any;

@Injectable()
export class CustomHammerGestureConfig extends HammerGestureConfig {
    buildHammer(element: HTMLElement) {
        let mc = new Hammer(element, {
            touchAction: "pan-y",
        });
        return mc;
    }
}