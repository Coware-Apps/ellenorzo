import { Component, OnInit, Input } from "@angular/core";
import { PromptService } from "src/app/_services/prompt.service";
import { FormattedDateService } from "src/app/_services/formatted-date.service";
import { ThemeService } from "src/app/_services/theme.service";
import { Evaluation } from "src/app/_models/kreta-v3/evaluation";

@Component({
    selector: "app-evaluation",
    templateUrl: "./evaluation.component.html",
    styleUrls: ["./evaluation.component.scss"],
})
export class EvaluationComponent implements OnInit {
    @Input() evaluation: Evaluation;
    @Input() type: "full" | "displayDate" | "displaySubject" = "full";
    @Input() enableClick: boolean = true;

    constructor(
        public fDate: FormattedDateService,

        private prompt: PromptService,
        private theme: ThemeService
    ) {}

    ngOnInit() {}

    getMoreData(evaluation: Evaluation) {
        if (!this.enableClick) return;

        this.prompt.evaluationV3Alert(evaluation);
    }

    themeIf(theme: string) {
        if (theme == null || theme == "") {
            return "";
        } else {
            return " - " + theme;
        }
    }

    getShadowColor(evaluation: Evaluation) {
        if (evaluation.ErtekFajta.Nev == "Osztalyzat") {
            switch (evaluation.SzamErtek) {
                case 5:
                    return this.theme.cardColors.fiveColor;
                case 4:
                    return this.theme.cardColors.fourColor;
                case 3:
                    return this.theme.cardColors.threeColor;
                case 2:
                    return this.theme.cardColors.twoColor;
                case 1:
                    return this.theme.cardColors.oneColor;

                default:
                    return this.theme.cardColors.noneColor;
            }
        } else if (evaluation.ErtekFajta.Nev == "Szazalekos") {
            if (evaluation.SzamErtek < 50) {
                return this.theme.cardColors.oneColor;
            } else if (evaluation.SzamErtek < 60 && evaluation.SzamErtek >= 50) {
                return this.theme.cardColors.twoColor;
            } else if (evaluation.SzamErtek < 70 && evaluation.SzamErtek >= 60) {
                return this.theme.cardColors.threeColor;
            } else if (evaluation.SzamErtek < 80 && evaluation.SzamErtek >= 70) {
                return this.theme.cardColors.fourColor;
            } else if (evaluation.SzamErtek >= 80) {
                return this.theme.cardColors.fiveColor;
            }
        } else {
            return this.theme.cardColors.noneColor;
        }
    }

    getSubject(evaluation: Evaluation) {
        return evaluation.Tantargy.Nev ? evaluation.Tantargy.Nev : evaluation.Jelleg;
    }
    getValue(evaluation: Evaluation) {
        return evaluation.ErtekFajta.Nev == "MagatartasErtek" ||
            evaluation.ErtekFajta.Nev == "SzorgalomErtek"
            ? `${evaluation.SzamErtek}`
            : "";
    }
    getWeight(w: string) {
        return w.length > 3 ? w : w + "&nbsp;";
    }
    getContrast50(hexcolor: string) {
        hexcolor = hexcolor.substring(1);
        var r = parseInt(hexcolor.substr(0, 2), 16);
        var g = parseInt(hexcolor.substr(2, 2), 16);
        var b = parseInt(hexcolor.substr(4, 2), 16);
        var yiq = (r * 299 + g * 587 + b * 114) / 1000;
        return yiq >= 128 ? "black" : "white";
    }
    styleEval(evaluation: Evaluation) {
        let c = this.getShadowColor(evaluation);
        return {
            "background-color": c,
            color: this.getContrast50(c),
        };
    }
    getSmallText(evaluation: Evaluation) {
        if (
            evaluation.ErtekFajta?.Nev == "MagatartasErtek" ||
            evaluation.ErtekFajta?.Nev == "SzorgalomErtek"
        ) {
            return evaluation.SzovegesErtek;
        } else {
            if (evaluation.Tema) return evaluation.Tema;

            return evaluation.Mod?.Leiras;
        }
    }
}
