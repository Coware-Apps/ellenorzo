import { Injectable, RendererFactory2, Inject, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { Storage } from '@ionic/storage';
import { StatusBar } from '@ionic-native/status-bar/ngx';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public renderer: Renderer2;
  public currentTheme = new BehaviorSubject("light");

  constructor(
    private storage: Storage,
    private rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document,
    private statusBar: StatusBar,
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  public async onInit() {
    let storedTheme = await this.storage.get("theme");
    if (storedTheme == null) {
      this.storage.set("theme", "light");
    }

    switch (await this.storage.get("theme")) {
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
  }
  enableDark() {
    this.removeAll();
    this.renderer.addClass(this.document.body, 'dark-theme');
    this.currentTheme.next("dark");
    this.styleStatusBarToTheme();
  }
  enableMinimalDark() {
    this.removeAll();
    this.renderer.addClass(this.document.body, 'dark-minimal-theme')
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
    this.renderer.addClass(this.document.body, 'custom-theme');
    this.currentTheme.next("custom");
    let temp;
    this.addBodyStyle("background-position-x", (temp = await this.storage.get('bgX')) == null ? "center" : (temp * -1) + "%");
    this.addBodyStyle("background-position-y", (temp = await this.storage.get('bgY')) == null ? "center" : temp + "%");
    this.addBodyStyle("background-size", (temp = await this.storage.get('bgSize')) == null || temp == "cover" ? "cover" : temp + "%");
    let bd = await this.storage.get('bdClass');
    if (bd != null) {
      this.addBodyClass(bd);
    }
    this.changeBackground(await this.storage.get('base64bg'));
    //the order of these is important, otherwise it causes lag ^
    this.styleStatusBarToTheme();
  }
  styleStatusBarToTheme() {
    switch (this.currentTheme.value) {
      case 'light':
        this.statusBar.backgroundColorByName("white");
        this.statusBar.styleDefault();
        break;
      case 'dark':
        this.statusBar.backgroundColorByHexString("#121212");
        this.statusBar.styleBlackOpaque();
        break;
      case 'minimalDark':
        this.statusBar.backgroundColorByName("black");
        this.statusBar.styleLightContent();
        break;
      case 'custom':
        this.statusBar.backgroundColorByName("black");
        this.statusBar.styleLightContent();
        break;
      default:
        break;
    }
  }
  changeBackground(url) {
    this.renderer.setStyle(this.document.body, 'background-image', 'url(data:image/jpeg;base64,' + url + ")");
    this.storage.set('base64bg', url);
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
    this.renderer.removeClass(this.document.body, 'dark-minimal-theme');
    this.renderer.removeClass(this.document.body, 'custom-theme')
    this.renderer.removeClass(this.document.body, 'dark-theme');

    //remove custom css styles here
    this.renderer.removeStyle(this.document.body, 'background-image');
    this.renderer.removeStyle(this.document.body, 'background-size');
    this.renderer.removeStyle(this.document.body, 'background-position-x');
    this.renderer.removeStyle(this.document.body, 'background-position-y');
  }
}
