import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';

declare var Hammer: any;

export class CustomHammerGestureConfig extends HammerGestureConfig {
    buildHammer(element: HTMLElement) {
        let mc = new Hammer(element, {
            touchAction: "pan-y",
        });
        return mc;
    }
}