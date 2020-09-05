import { Component, OnInit } from "@angular/core";
import { AppService } from "src/app/_services/app.service";

@Component({
    selector: "app-web-login-info",
    templateUrl: "./web-login-info.component.html",
    styleUrls: ["./web-login-info.component.scss"],
})
export class WebLoginInfoComponent implements OnInit {
    constructor(private app: AppService) {}

    ngOnInit() {}
}
