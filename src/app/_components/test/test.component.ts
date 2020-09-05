import { Component, OnInit, Input } from "@angular/core";
import { Test } from "src/app/_models/kreta-v3/test";
import { FormattedDateService } from "src/app/_services/formatted-date.service";

@Component({
    selector: "app-test",
    templateUrl: "./test.component.html",
    styleUrls: ["./test.component.scss"],
})
export class TestComponent implements OnInit {
    @Input() test: Test;

    constructor(public fDate: FormattedDateService) {}

    ngOnInit() {}
}
