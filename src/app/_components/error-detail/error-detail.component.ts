import { Component, OnInit, Input } from '@angular/core';
import { PromptService } from 'src/app/_services/prompt.service';
import { TranslateService } from '@ngx-translate/core';
import { stringify } from 'querystring';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { GlobalError } from 'src/app/_exceptions/global-exception';

@Component({
  selector: 'app-error-detail',
  templateUrl: './error-detail.component.html',
  styleUrls: ['./error-detail.component.scss'],
})
export class ErrorDetailComponent implements OnInit {

  @Input() public error: GlobalError | any;
  @Input() public showTranslatorKeys: boolean = true;
  public showMore = false;
  constructor(
    private clipboard: Clipboard,
    private prompt: PromptService,
    private translator: TranslateService,
  ) {
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    console.log('ERROR ON error-detail.component', this.error);
  }

  copyToClipboard() {
    try {
      this.clipboard.copy(stringify(this.error) + (this.error.httpErrorObject ? `&HTTPError=${stringify(this.error.httpErrorObject)}"` : ''));
      this.prompt.toast(this.translator.instant('pages.error.copiedText'), true);
    } catch (error) {
      this.prompt.toast(this.translator.instant('pages.error.errorCopyingText'), true);
    }
  }

  copyText(t: string) {
    try {
      this.clipboard.copy(t);
      this.prompt.toast(this.translator.instant('pages.error.copiedText'), true);
    } catch (error) {
      this.prompt.toast(this.translator.instant('pages.error.errorCopyingText'), true);
    }
  }

  getKeys(o: any) {
    let keys = Object.keys(o);
    if (keys.length == 0) keys = Object.getOwnPropertyNames(o);
    return keys;
  }
  stringify(a) {
    if (a instanceof Object) {
      return stringify(a);
    } else if (typeof (a) === "string") {
      return a;
    } else if (typeof (a) == "number") {
      return a.toString();
    }
  }
}
