import { Component } from "@angular/core";
import { PopoverController } from "@ionic/angular";

@Component({
    selector: "app-attachment-options",
    templateUrl: "./attachment-options.component.html",
    styleUrls: ["./attachment-options.component.scss"],
})
export class AttachmentOptionsComponent {
    constructor(private popoverController: PopoverController) {}

    public choose(value: string) {
        this.popoverController.dismiss({
            result: value,
        });
    }
}
