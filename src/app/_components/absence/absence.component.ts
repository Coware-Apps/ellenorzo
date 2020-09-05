import { Component, OnInit, Input } from "@angular/core";
import { Absence } from "src/app/_models/kreta-v3/absence";
import { PromptService } from "src/app/_services/prompt.service";

@Component({
    selector: "app-absence",
    templateUrl: "./absence.component.html",
    styleUrls: ["./absence.component.scss"],
})
export class AbsenceComponent implements OnInit {
    @Input() absence: Absence;

    constructor(private prompt: PromptService) {}

    ngOnInit() {}

    getMoreData(absence: Absence) {
        this.prompt.absenceV3Alert(absence);
    }

    getColor(absence: Absence) {
        return absence.IgazolasAllapota == "Igazolt"
            ? "green"
            : absence.IgazolasAllapota == "Igazolando"
            ? "yellow"
            : "red";
    }
    getStateTranslatorKey(stateName: string) {
        if (stateName == "Igazolt") return "JustifiedName";
        if (stateName == "Igazolando") return "BeJustifiedName";

        return "UnJustifiedName";
    }
}
