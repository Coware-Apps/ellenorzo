import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/_services/theme.service';
import { Storage } from '@ionic/storage';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { AppService } from 'src/app/_services/app.service';

@Component({
  selector: 'app-bg-settings',
  templateUrl: './bg-settings.page.html',
  styleUrls: ['./bg-settings.page.scss'],
})
export class BgSettingsPage implements OnInit {
  public sizeChanger: boolean;
  public size: number;
  public storedSize: any;
  public x: number;
  public y: number;
  public backdrop: number;

  constructor(
    private theme: ThemeService,
    private storage: Storage,
    private firebase: FirebaseX,
  ) {
    this.sizeChanger = false;
    this.storedSize = 100;
  }

  async ngOnInit() {
    let temp;
    this.storedSize = await this.storage.get("bgSize");
    if ((this.storedSize == "cover" || this.storedSize == null) && this.storedSize != NaN) {
      //if it is set to cover or if it isn't set at all (on first initialization)
      this.sizeChanger = true;
    }
    else if (this.storedSize != NaN) {
      //handling NaN bug
      this.size = this.storedSize;
      this.sizeChanger = false;
    }
    else {
      this.size = 100;
      this.sizeChanger = true;
    }
    this.x = (temp = await this.storage.get('bgX')) == null ? 0 : temp;
    this.y = (temp = await this.storage.get('bgY')) == null ? 0 : temp;
    this.backdrop = (temp = await this.storage.get('bdClass')) == null ? 0 : temp.split('bd-')[1];
    console.log('this.backdrop', this.backdrop);
    this.firebase.setScreenName('bg-settings');
  }

  sizeChange(event) {
    if (event.detail.checked) {
      this.theme.addBodyStyle("background-size", "cover");
      this.sizeChanger = true;
    }
  }
  xChange(event) {
    this.theme.addBodyStyle("background-position-x", (event.detail.value * -1) + "%");
    this.x = event.detail.value;
  }
  yChange(event) {
    this.theme.addBodyStyle("background-position-y", event.detail.value + "%");
    this.y = event.detail.value;
  }
  sizeSlider(event) {
    this.theme.addBodyStyle("background-size", event.detail.value + "%");
    this.size = event.detail.value;
  }
  backdropSlider(event) {
    [0, 25, 50, 75, 100].forEach(n => { this.theme.removeBodyClass(`bd-${n}`) });
    this.theme.addBodyClass(`bd-${event.detail.value}`);
    this.backdrop = event.detail.value;
  }


  ionViewWillLeave() {
    //saving stuff
    this.storage.set('bgX', this.x);
    this.storage.set('bdClass', `bd-${this.backdrop}`);
    this.storage.set('bgY', this.y);
    if (this.sizeChanger == false) {
      //if the image isn't fit to the screen but manually adjusted (if the top switch is off O.o)
      this.storage.set('bgSize', this.size);
    } else {
      this.storage.set('bgSize', 'cover');
    }
  }

}
