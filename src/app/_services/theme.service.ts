import { Injectable, RendererFactory2, Inject, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  renderer: Renderer2;
  currentTheme = new BehaviorSubject("light");

  constructor(
    private storage: Storage,
    private rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  enableDark() {
    this.removeAll();
    this.renderer.addClass(this.document.body, 'dark-theme');
    this.currentTheme.next("dark");
  }

  enableMinimalDark() {
    this.removeAll();
    this.renderer.addClass(this.document.body, 'dark-minimal-theme')
    this.currentTheme.next("minimalDark");
  }

  enableLight() {
    this.removeAll();
    this.currentTheme.next("light");
  }

  async enableCustom() {
    this.removeAll();
    this.renderer.addClass(this.document.body, 'custom-theme');
    this.currentTheme.next("custom");
    let temp;
    this.addBodyStyle("background-position-x", (temp = await this.storage.get('bgX')) == null ? "center" : (temp * -1) + "%");
    this.addBodyStyle("background-position-y", (temp = await this.storage.get('bgY')) == null ? "center" : temp + "%");
    this.addBodyStyle("background-size", (temp = await this.storage.get('bgSize')) == null || temp == "cover" ? "cover" :  temp + "%");
    this.changeBackground(await this.storage.get('base64bg'));

    //the order of these is important, otherwise it causes lag ^

  }

  changeBackground(url) {
    this.renderer.setStyle(this.document.body, 'background-image', 'url(data:image/jpeg;base64,' + url + ")");
    this.storage.set('base64bg', url);
  }

  addBodyStyle(style: string, value: string) {
    this.renderer.setStyle(this.document.body, style, value);
  }

  removeBodyStyle(style: string) {
    this.renderer.removeStyle(this.document.body, style);
  }

  private removeAll() {
    this.renderer.removeClass(this.document.body, 'dark-minimal-theme');
    this.renderer.removeClass(this.document.body, 'custom-theme')
    this.renderer.removeClass(this.document.body, 'dark-theme');

    //remove custom css styles here
    this.renderer.removeStyle(this.document.body, 'background-size');
    this.renderer.removeStyle(this.document.body, 'background-position-x');
    this.renderer.removeStyle(this.document.body, 'background-position-y');
  }
}
