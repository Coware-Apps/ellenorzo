import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, DefaultUrlSerializer } from '@angular/router';
import { KretaError, KretaHttpError } from 'src/app/_exceptions/kreta-exception';
import { DataService } from 'src/app/_services/data.service';
import { KretaInvalidResponseError, KretaInvalidGrantError, KretaNetworkError, KretaTokenError } from '../../_exceptions/kreta-exception';
import { stringify } from 'querystring';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { PromptService } from 'src/app/_services/prompt.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-error',
  templateUrl: './error.page.html',
  styleUrls: ['./error.page.scss'],
})
export class ErrorPage implements OnInit {

  public error: any;
  public showMore = false;
  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private clipboard: Clipboard,
    private prompt: PromptService,
    private translator: TranslateService,
  ) {
    this.route.queryParams.subscribe(p => {
      this.error = this.dataService.getData(p.errorDataKey);
    });
  }

  ngOnInit() {
    console.log('ERROR ON error.page', this.error);
  }
  copyToClipboard() {
    try {
      this.clipboard.copy(stringify(this.error) + (this.error.httpErrorObject ? `&HTTPError=${stringify(this.error.httpErrorObject)}"` : ''));
      this.prompt.toast(this.translator.instant('pages.error.copiedText'), true);
    } catch (error) {

      this.prompt.toast(this.translator.instant('pages.error.errorCopyingText'), true);
    }
  }
}
