import { Component, OnInit, Input } from '@angular/core';
import { SubjectAverage } from 'src/app/_models/student';
import { ColorService } from 'src/app/_services/color.service';

@Component({
  selector: 'app-average',
  templateUrl: './average.component.html',
  styleUrls: ['./average.component.scss'],
})
export class AverageComponent implements OnInit {
  @Input() subjectAverage: SubjectAverage;
  @Input() totalGrades: number;
  constructor(
    private color: ColorService,
  ) { }

  ngOnInit() { }




  getContrast50(hexcolor: string) {
    hexcolor = hexcolor.substring(1);
    var r = parseInt(hexcolor.substr(0, 2), 16);
    var g = parseInt(hexcolor.substr(2, 2), 16);
    var b = parseInt(hexcolor.substr(4, 2), 16);
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
  }

  getShadowColor() {
    if (this.subjectAverage.Value >= 4.5) {
      return this.color.cardColors.fiveColor;
    }
    else if (this.subjectAverage.Value < 4.5 && this.subjectAverage.Value >= 3.5) {
      return this.color.cardColors.fourColor;
    }
    else if (this.subjectAverage.Value < 3.5 && this.subjectAverage.Value >= 2.5) {
      return this.color.cardColors.threeColor;
    }
    else if (this.subjectAverage.Value < 2.5 && this.subjectAverage.Value >= 1.5) {
      return this.color.cardColors.twoColor;
    }
    else if (this.subjectAverage.Value < 1.5) {
      return this.color.cardColors.oneColor;
    } else {
      return this.color.cardColors.noneColor;
    }
  }

  getCardStyle() {
    let c = this.getShadowColor();
    return {
      'background-color': c,
      'color': this.getContrast50(c)
    }
  }

}
