import { Injectable, RendererFactory2, Inject, Renderer2 } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { BehaviorSubject } from "rxjs";
import { Storage } from "@ionic/storage";
import { StatusBar } from "@ionic-native/status-bar/ngx";

@Injectable({
    providedIn: "root",
})
export class ThemeService {
    public renderer: Renderer2;
    public currentTheme = new BehaviorSubject("light");
    public cardColors = {
        fiveColor: "#64dd17",
        fourColor: "#ffeb3b",
        threeColor: "#ffa000",
        twoColor: "#e65100",
        oneColor: "#d50000",
        noneColor: "#7e57c2",
    };

    constructor(
        private storage: Storage,
        private rendererFactory: RendererFactory2,
        @Inject(DOCUMENT) private document: Document,
        private statusBar: StatusBar
    ) {
        this.renderer = this.rendererFactory.createRenderer(null, null);
    }

    public async onInit() {
        const stored = await Promise.all([
            this.storage.get("theme"),
            this.storage.get("cardColor"),
        ]);

        let storedTheme = stored[0];

        if (!storedTheme) {
            this.storage.set("theme", "light");
            storedTheme = "light";
        }
        switch (storedTheme) {
            case "light":
                this.enableLight();
                break;
            case "dark":
                this.enableDark();
                break;
            case "minimalDark":
                this.enableMinimalDark();
                break;
            case "custom":
                this.enableCustom();
                break;
            default:
                this.enableLight();
                break;
        }

        //card colors
        if (stored[1] != null) {
            const cSplitted = stored[1].split("&");
            this.cardColors.fiveColor = cSplitted[0];
            this.cardColors.fourColor = cSplitted[1];
            this.cardColors.threeColor = cSplitted[2];
            this.cardColors.twoColor = cSplitted[3];
            this.cardColors.oneColor = cSplitted[4];
            this.cardColors.noneColor = cSplitted[5];
        }
    }

    //#region THEMES
    enableDark() {
        this.removeAll();
        this.renderer.addClass(this.document.body, "dark-theme");
        this.currentTheme.next("dark");
        this.styleStatusBarToTheme();
    }
    enableMinimalDark() {
        this.removeAll();
        this.renderer.addClass(this.document.body, "dark-minimal-theme");
        this.currentTheme.next("minimalDark");
        this.styleStatusBarToTheme();
    }
    enableLight() {
        this.removeAll();
        this.currentTheme.next("light");
        this.styleStatusBarToTheme();
    }
    async enableCustom() {
        this.removeAll();
        this.renderer.addClass(this.document.body, "custom-theme");
        this.currentTheme.next("custom");
        let temp;
        this.addBodyStyle(
            "background-position-x",
            (temp = await this.storage.get("bgX")) == null ? "center" : temp * -1 + "%"
        );
        this.addBodyStyle(
            "background-position-y",
            (temp = await this.storage.get("bgY")) == null ? "center" : temp + "%"
        );
        this.addBodyStyle(
            "background-size",
            (temp = await this.storage.get("bgSize")) == null || temp == "cover"
                ? "cover"
                : temp + "%"
        );
        let bd = await this.storage.get("bdClass");
        if (bd != null) {
            this.addBodyClass(bd);
        }
        this.changeBackground(await this.storage.get("base64bg"));
        //the order of these is important, otherwise it causes lag ^
        this.styleStatusBarToTheme();
    }
    styleStatusBarToTheme() {
        switch (this.currentTheme.value) {
            case "light":
                this.statusBar.backgroundColorByHexString("#fee94a");
                this.statusBar.styleDefault();
                break;
            case "dark":
                this.statusBar.backgroundColorByHexString("#fee94a");
                this.statusBar.styleDefault();
                break;
            case "minimalDark":
                this.statusBar.backgroundColorByName("black");
                this.statusBar.styleBlackOpaque();
                break;
            case "custom":
                this.statusBar.backgroundColorByName("black");
                this.statusBar.styleLightContent();
                break;
            default:
                break;
        }
    }
    styleStatusBarToBlend() {
        switch (this.currentTheme.value) {
            case "light":
                this.statusBar.backgroundColorByName("white");
                this.statusBar.styleDefault();
                break;
            case "dark":
                this.statusBar.backgroundColorByHexString("#121212");
                this.statusBar.styleBlackOpaque();
                break;
            case "minimalDark":
                this.statusBar.backgroundColorByName("black");
                this.statusBar.styleLightContent();
                break;
            case "custom":
                this.statusBar.backgroundColorByName("black");
                this.statusBar.styleLightContent();
                break;
            default:
                break;
        }
    }
    changeBackground(url) {
        this.renderer.setStyle(
            this.document.body,
            "background-image",
            "url(data:image/jpeg;base64," + url + ")"
        );
        this.storage.set("base64bg", url);
    }
    addBodyStyle(style: string, value: string) {
        this.renderer.setStyle(this.document.body, style, value);
    }
    addBodyClass(cls: string) {
        this.renderer.addClass(this.document.body, cls);
    }
    removeBodyClass(cls: string) {
        this.renderer.removeClass(this.document.body, cls);
    }
    removeBodyStyle(style: string) {
        this.renderer.removeStyle(this.document.body, style);
    }
    private removeAll() {
        this.renderer.removeClass(this.document.body, "dark-minimal-theme");
        this.renderer.removeClass(this.document.body, "custom-theme");
        this.renderer.removeClass(this.document.body, "dark-theme");

        //remove custom css styles here
        this.renderer.removeStyle(this.document.body, "background-image");
        this.renderer.removeStyle(this.document.body, "background-size");
        this.renderer.removeStyle(this.document.body, "background-position-x");
        this.renderer.removeStyle(this.document.body, "background-position-y");
    }
    //#endregion

    //#region COLORS
    returnColorCodes() {
        return `${this.cardColors.fiveColor}&${this.cardColors.fourColor}&${this.cardColors.threeColor}&${this.cardColors.twoColor}&${this.cardColors.oneColor}&${this.cardColors.noneColor}`;
    }

    getContrast() {
        if (
            this.currentTheme.value == "custom" ||
            this.currentTheme.value == "dark" ||
            this.currentTheme.value == "minimalDark"
        ) {
            return "#FFFFFF";
        } else {
            return "#000000";
        }
    }
    getPopUpClass() {
        if (
            this.currentTheme.value == "custom" ||
            this.currentTheme.value == "dark" ||
            this.currentTheme.value == "minimalDark"
        ) {
            return "timeTableAlert";
        } else {
            return "";
        }
    }
    getToastClass() {
        if (
            this.currentTheme.value == "custom" ||
            this.currentTheme.value == "dark" ||
            this.currentTheme.value == "minimalDark"
        ) {
            return "darkToast";
        } else {
            return "";
        }
    }
    getChartBgColor() {
        if (this.currentTheme.value == "minimalDark") {
            return "black";
        } else if (this.currentTheme.value == "dark") {
            //the ion-card header color in dark mode (--ion-item-background)
            return "#1a1b1e";
        } else if (this.currentTheme.value == "custom") {
            return "transparent";
        } else {
            return "white";
        }
    }
    getChartTextColor() {
        if (this.currentTheme.value == "custom" || this.currentTheme.value == "minimalDark") {
            return "white";
        } else if (this.currentTheme.value == "dark") {
            //the ion-card header color in dark mode (--ion-item-background)
            return "white";
        } else {
            return "black";
        }
    }
    getChartSeriesColor() {
        if (this.currentTheme.value == "custom" || this.currentTheme.value == "minimalDark") {
            return "yellow";
        } else if (this.currentTheme.value == "dark") {
            return "yellow";
        } else {
            return "";
        }
    }
    getChartSecondarySeriesColor() {
        if (this.currentTheme.value == "custom" || this.currentTheme.value == "minimalDark") {
            return "#aba76a";
        } else if (this.currentTheme.value == "dark") {
            return "#aba76a";
        } else {
            return "#7d7d7d";
        }
    }
    getChartPlotLineColor(count: number) {
        if (count == 0) {
            if (this.currentTheme.value == "custom" || this.currentTheme.value == "minimalDark") {
                return "red";
            } else if (this.currentTheme.value == "dark") {
                //the ion-card header color in dark mode (--ion-item-background)
                return "red";
            } else {
                return "red";
            }
        } else {
            if (this.currentTheme.value == "custom" || this.currentTheme.value == "minimalDark") {
                return "green";
            } else if (this.currentTheme.value == "dark") {
                //the ion-card header color in dark mode (--ion-item-background)
                return "green";
            } else {
                return "green";
            }
        }
    }
    //#endregion
}
