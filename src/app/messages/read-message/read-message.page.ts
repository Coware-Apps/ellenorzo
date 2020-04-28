import { Component, OnInit } from '@angular/core';
import { AdministrationMessage } from 'src/app/_models/_administration/message';
import { DataService } from 'src/app/_services/data.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UserManagerService } from 'src/app/_services/user-manager.service';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';
import { PromptService } from 'src/app/_services/prompt.service';
import { AdministrationError } from 'src/app/_exceptions/administration-exception';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MenuController } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';

@Component({
  selector: 'app-read-message',
  templateUrl: './read-message.page.html',
  styleUrls: ['./read-message.page.scss'],
})
export class ReadMessagePage implements OnInit {
  public messageId: number;
  public message: AdministrationMessage;
  public pageState: 'sans' | 'error' | 'loaded' | 'login' = 'sans';
  public error: AdministrationError;

  private subs: Subscription[] = [];
  constructor(
    public fDate: FormattedDateService,
    public userManager: UserManagerService,
    public data: DataService,
    private router: Router,
    private route: ActivatedRoute,
    private FileOpener: FileOpener,
    private firebaseX: FirebaseX,
    private prompt: PromptService,
    private translator: TranslateService,
    private menuCtrl: MenuController,
    private file: File,
  ) {
    this.route.queryParams.subscribe(params => {
      this.messageId = params.messageId;
    });
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(false);
  }

  async ngOnInit() {
    this.firebaseX.setScreenName('read-message');
    if (!this.userManager.currentUser.isAdministrationRegistered()) {
      return this.pageState = "login";
    }
    this.pageState = 'sans';
    this.message = await this.userManager.currentUser.getMessageAdministration(this.messageId);
    for (let i = 0; i < this.message.uzenet.csatolmanyok.length; i++) {
      this.message.uzenet.csatolmanyok[i].loading = false;
    }
    this.pageState = 'loaded';
  }

  ngOnDestroy() {
    this.menuCtrl.enable(true);
    this.subs.forEach((s, index, object) => {
      s.unsubscribe();
      object.splice(index, 1);
    });
  }

  getAddresseeString() {
    return this.message.uzenet.cimzettLista
      .map(x =>
        this.userManager.currentUser.id == x.kretaAzonosito
          ? this.translator.instant('pages.read-message.meText')
          : x.nev
      )
      .join(", ");
  }


  replyToMsg() {
    this.data.setData('replyData', this.message);
    this.router.navigateByUrl('messages/new-message?replyDataKey=replyData');
  }
  forwardMsg() {
    this.data.setData('forwardData', this.message);
    this.router.navigateByUrl('messages/new-message?forwardDataKey=forwardData')
  }
  showStatusInfo() {
    this.prompt.presentUniversalAlert(
      `Azonosító: ${this.message.azonosito}`,
      `Státusz: ${this.message.uzenet.statusz.azonosito} (${this.message.uzenet.statusz.leiras})`,
      `Hibakód: ${this.message.uzenet.hibaCorrellationId}`
    )
  }
  async binMsg(action: 'put' | 'remove') {
    await this.userManager.currentUser.binMessage(action, [this.message.azonosito]);
    if (action == 'put') {
      this.prompt.toast(
        this.translator.instant('pages.read-message.successfullyBinned'), true
      );
      this.ngOnInit();
    } else {
      this.prompt.toast(
        this.translator.instant('pages.read-message.successfullyUnbinned'),
        true
      );
      this.ngOnInit();
    }
  }
  async deleteMsg() {
    let promptRes = await this.prompt.getTrueOrFalseWithText(
      this.translator.instant('pages.read-message.confirmDelete.header'),
      "",
      this.translator.instant('pages.read-message.confirmDelete.message'),
      "yes-no"
    );
    if (promptRes) {
      await this.userManager.currentUser.deleteMessage([this.message.azonosito]);
      this.router.navigateByUrl('messages?forceRefresh=true');
    }
  }
  async setAsUnread() {
    await this.userManager.currentUser.changeMessageState('unread', [this.message.azonosito]);
    this.prompt.toast(
      this.translator.instant('pages.read-message.successfullyUnread'),
      true
    );
    this.router.navigateByUrl('messages?forceRefresh=true');
  }

  async getFile(id: number, fullName: string) {
    for (let i = 0; i < this.message.uzenet.csatolmanyok.length; i++) {
      if (this.message.uzenet.csatolmanyok[i].azonosito == id) {
        this.message.uzenet.csatolmanyok[i].loading = true;
      }
    }
    const splitAt = (index: number) => (x: string) => [x.slice(0, index), x.slice(index)]
    let newName = splitAt(fullName.lastIndexOf('.'))(fullName);
    newName[1] = newName[1].slice(1);
    let filePath = await this.userManager.currentUser.getAttachmentThroughAdministration(id, newName[0], newName[1]);
    await this.FileOpener.showOpenWithDialog(filePath, this.types[newName[1]]);
    for (let i = 0; i < this.message.uzenet.csatolmanyok.length; i++) {
      if (this.message.uzenet.csatolmanyok[i].azonosito == id) {
        this.message.uzenet.csatolmanyok[i].loading = false;
      }
    }
  }
  public types = {
    '3dmf': 'x-world/x-3dmf',
    '3dm': 'x-world/x-3dmf',
    'avi': 'video/x-msvideo',
    'ai': 'application/postscript',
    'bin': 'application/octet-stream',
    'bmp': 'image/bmp',
    'cab': 'application/x-shockwave-flash',
    'c': 'text/plain',
    'c++': 'text/plain',
    'class': 'application/java',
    'css': 'text/css',
    'csv': 'text/comma-separated-values',
    'cdr': 'application/cdr',
    'doc': 'application/msword',
    'dot': 'application/msword',
    'docx': 'application/msword',
    'dwg': 'application/acad',
    'eps': 'application/postscript',
    'exe': 'application/octet-stream',
    'gif': 'image/gif',
    'gz': 'application/gzip',
    'gtar': 'application/x-gtar',
    'flv': 'video/x-flv',
    'fh4': 'image/x-freehand',
    'fh5': 'image/x-freehand',
    'fhc': 'image/x-freehand',
    'help': 'application/x-helpfile',
    'hlp': 'application/x-helpfile',
    'html': 'text/html',
    'htm': 'text/html',
    'ico': 'image/x-icon',
    'imap': 'application/x-httpd-imap',
    'inf': 'application/inf',
    'jpe': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'js': 'application/x-javascript',
    'java': 'text/x-java-source',
    'latex': 'application/x-latex',
    'log': 'text/plain',
    'm3u': 'audio/x-mpequrl',
    'midi': 'audio/midi',
    'mid': 'audio/midi',
    'mov': 'video/quicktime',
    'mp3': 'audio/mpeg',
    'mpeg': 'video/mpeg',
    'mpg': 'video/mpeg',
    'mp2': 'video/mpeg',
    'ogg': 'application/ogg',
    'phtml': 'application/x-httpd-php',
    'php': 'application/x-httpd-php',
    'pdf': 'application/pdf',
    'pgp': 'application/pgp',
    'png': 'image/png',
    'pps': 'application/mspowerpoint',
    'ppt': 'application/mspowerpoint',
    'ppz': 'application/mspowerpoint',
    'pot': 'application/mspowerpoint',
    'ps': 'application/postscript',
    'qt': 'video/quicktime',
    'qd3d': 'x-world/x-3dmf',
    'qd3': 'x-world/x-3dmf',
    'qxd': 'application/x-quark-express',
    'rar': 'application/x-rar-compressed',
    'ra': 'audio/x-realaudio',
    'ram': 'audio/x-pn-realaudio',
    'rm': 'audio/x-pn-realaudio',
    'rtf': 'text/rtf',
    'spr': 'application/x-sprite',
    'sprite': 'application/x-sprite',
    'stream': 'audio/x-qt-stream',
    'swf': 'application/x-shockwave-flash',
    'svg': 'text/xml-svg',
    'sgml': 'text/x-sgml',
    'sgm': 'text/x-sgml',
    'tar': 'application/x-tar',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'tgz': 'application/x-compressed',
    'tex': 'application/x-tex',
    'txt': 'text/plain',
    'vob': 'video/x-mpg',
    'wav': 'audio/x-wav',
    'wrl': 'model/vrml',
    'xla': 'application/msexcel',
    'xls': 'application/msexcel',
    'xlc': 'application/vnd.ms-excel',
    'xml': 'text/xml',
    'zip': 'application/zip',
  };
}
