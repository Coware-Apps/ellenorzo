import { Component, OnInit, Input } from '@angular/core';
import { evaluation } from 'src/app/_models/student';
import { PromptService } from 'src/app/_services/prompt.service';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';
import { ColorService } from 'src/app/_services/color.service';

@Component({
  selector: 'app-evaluation',
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.scss'],
})
export class EvaluationComponent implements OnInit {
  @Input() evaluation: evaluation;
  @Input() type: 'full' | 'displayDate' | 'displaySubject' = 'full';
  @Input() enableClick: boolean = true;

  constructor(
    public fDate: FormattedDateService,

    private prompt: PromptService,
    private color: ColorService,
  ) { }

  ngOnInit() {
  }

  getMoreData(evaluation: evaluation) {
    if (!this.enableClick) return;

    this.prompt.evaluationAlert(evaluation);
  }

  themeIf(theme: string) {
    if (theme == null || theme == "") {
      return "";
    } else {
      return " - " + theme;
    }
  }

  getShadowColor(numberValue: number, form: string) {
    if (form == "Mark") {
      switch (numberValue) {
        case 5:
          return this.color.cardColors.fiveColor;
        case 4:
          return this.color.cardColors.fourColor;
        case 3:
          return this.color.cardColors.threeColor;
        case 2:
          return this.color.cardColors.twoColor;
        case 1:
          return this.color.cardColors.oneColor;

        default:
          return this.color.cardColors.noneColor
      }
    } else if (form == 'Percent') {
      if (numberValue < 50) {
        return this.color.cardColors.oneColor;
      } else if (numberValue < 60 && numberValue >= 50) {
        return this.color.cardColors.twoColor;
      } else if (numberValue < 70 && numberValue >= 60) {
        return this.color.cardColors.threeColor;
      } else if (numberValue < 80 && numberValue >= 70) {
        return this.color.cardColors.fourColor;
      } else if (numberValue >= 80) {
        return this.color.cardColors.fiveColor;
      }
    } else {
      return this.color.cardColors.noneColor
    }
  }

  getSubject(evaluation: evaluation) {
    return evaluation.Subject ? evaluation.Subject : evaluation.Jelleg.Leiras;
  }
  getValue(evaluation: evaluation) {
    return evaluation.Form == 'Deportment' || evaluation.Form == 'Diligence' ? `${evaluation.Value}` : '';
  }
  getWeight(w: string) {
    return w.length > 3 ? w : w + '&nbsp;'
  }
  getContrast50(hexcolor: string) {
    hexcolor = hexcolor.substring(1);
    var r = parseInt(hexcolor.substr(0, 2), 16);
    var g = parseInt(hexcolor.substr(2, 2), 16);
    var b = parseInt(hexcolor.substr(4, 2), 16);
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
  }

  styleEval(evaluation) {
    let c = this.getShadowColor(evaluation.NumberValue, evaluation.Form);
    return {
      'background-color': c,
      'color': this.getContrast50(c)
    }
  }
}
