import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import {
    AdministrationError,
    AdministrationNetworkError,
} from "src/app/_exceptions/administration-exception";
import { AppService } from "src/app/_services/app.service";

@Component({
    selector: "app-administration-error",
    templateUrl: "./administration-error.component.html",
    styleUrls: ["./administration-error.component.scss"],
})
export class AdministrationErrorComponent implements OnInit {
    @Input() public error: AdministrationError;
    @Input() public iconName: string = "bug-outline";
    @Input() public buttonText: string = "Újra";

    @Output() retry: EventEmitter<void> = new EventEmitter<void>();

    public debuggingShown: boolean = false;
    constructor(public app: AppService) {}

    ngOnInit() {
        this.iconName =
            this.error instanceof AdministrationNetworkError ? "wifi-outline" : "bug-outline";
    }

    public toggleDebuggingInfo() {
        this.debuggingShown = !this.debuggingShown;
    }
}
