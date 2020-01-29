import { Injectable } from '@angular/core';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class ColorService {

  private currentTheme: string;
  constructor(
    private theme: ThemeService,
  ) {
    this.theme.currentTheme.subscribe(value => {
      this.currentTheme = value;
    })
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
      //the ion-card header color in dark mode (--ion-item-background)
      return "yellow";
    }
    else {
      return "";
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
