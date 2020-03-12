import { Injectable } from '@angular/core';
import { ThemeService } from './theme.service';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class ColorService {

  public cardColors = {
    fiveColor: "#00CC66",
    fourColor: "#FFFF66",
    threeColor: "#FF9933",
    twoColor: "#663300",
    oneColor: "#FF0000",
    noneColor: "#9933FF",
  };
  private currentTheme: string;
  constructor(
    private theme: ThemeService,
    private storage: Storage,
  ) {
    this.theme.currentTheme.subscribe(value => {
      this.currentTheme = value;
    })
  }

  public async onInit() {
    let storedCardColor = await this.storage.get('cardColor');
    if (storedCardColor != null) {
      let cSplitted = storedCardColor.split('&');
      this.cardColors.fiveColor = cSplitted[0];
      this.cardColors.fourColor = cSplitted[1];
      this.cardColors.threeColor = cSplitted[2];
      this.cardColors.twoColor = cSplitted[3];
      this.cardColors.oneColor = cSplitted[4];
      this.cardColors.noneColor = cSplitted[5];
    }
  }

  returnColorCodes() {
    return `${this.cardColors.fiveColor}&${this.cardColors.fourColor}&${this.cardColors.threeColor}&${this.cardColors.twoColor}&${this.cardColors.oneColor}&${this.cardColors.noneColor}`
  }

  getContrast() {
    if (this.currentTheme == 'custom' || this.currentTheme == "dark" || this.currentTheme == "minimalDark") {
      return "#FFFFFF"
    }
    else {
      return "#000000"
    }
  }
  getPopUpClass() {
    if (this.currentTheme == 'custom' || this.currentTheme == "dark" || this.currentTheme == "minimalDark") {
      return "timeTableAlert";
    }
    else {
      return "";
    }
  }
  getToastClass() {
    if (this.currentTheme == 'custom' || this.currentTheme == "dark" || this.currentTheme == "minimalDark") {
      return "darkToast";
    }
    else {
      return "";
    }
  }
  getChartBgColor() {
    if (this.currentTheme == "minimalDark") {
      return "black";
    } else if (this.currentTheme == 'dark') {
      //the ion-card header color in dark mode (--ion-item-background)
      return "#1a1b1e";
    } else if (this.currentTheme == 'custom') {
      return "transparent";
    }
    else {
      return "white";
    }
  }
  getChartTextColor() {
    if (this.currentTheme == 'custom' || this.currentTheme == "minimalDark") {
      return "white";
    } else if (this.currentTheme == 'dark') {
      //the ion-card header color in dark mode (--ion-item-background)
      return "white";
    }
    else {
      return "black";
    }
  }
  getChartSeriesColor() {
    if (this.currentTheme == 'custom' || this.currentTheme == "minimalDark") {
      return "yellow";
    } else if (this.currentTheme == 'dark') {
      return "yellow";
    }
    else {
      return "";
    }
  }
  getChartSecondarySeriesColor() {
    if (this.currentTheme == 'custom' || this.currentTheme == "minimalDark") {
      return "#aba76a";
    } else if (this.currentTheme == 'dark') {
      return "#aba76a";
    }
    else {
      return "#7d7d7d";
    }
  }
  getChartPlotLineColor(count: number) {
    if (count == 0) {
      if (this.currentTheme == 'custom' || this.currentTheme == "minimalDark") {
        return "red";
      } else if (this.currentTheme == 'dark') {
        //the ion-card header color in dark mode (--ion-item-background)
        return "red";
      }
      else {
        return "red";
      }
    } else {
      if (this.currentTheme == 'custom' || this.currentTheme == "minimalDark") {
        return "green";
      } else if (this.currentTheme == 'dark') {
        //the ion-card header color in dark mode (--ion-item-background)
        return "green";
      }
      else {
        return "green";
      }
    }
  }
}
