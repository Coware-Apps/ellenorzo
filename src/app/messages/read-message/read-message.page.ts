import { Component, OnInit } from '@angular/core';
import { Message } from 'src/app/_models/message';
import { DataService } from 'src/app/_services/data.service';
import { Router } from '@angular/router';
import { UserManagerService } from 'src/app/_services/user-manager.service';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';

@Component({
  selector: 'app-read-message',
  templateUrl: './read-message.page.html',
  styleUrls: ['./read-message.page.scss'],
})
export class ReadMessagePage implements OnInit {
  public message: Message;
  public sans: boolean;
  constructor(
    public userManager: UserManagerService,
    public data: DataService,
    private router: Router,
    private FileOpener: FileOpener,
    private firebaseX: FirebaseX,
  ) {
    this.sans = true;
  }

  ngOnInit() {
    this.firebaseX.setScreenName('read-message');
  }

  async ionViewDidEnter() {
    this.sans = true;
    let messageId = this.data.getData('messageId');
    this.message = await this.userManager.currentUser.getMessage(messageId);
    for (let i = 0; i < this.message.uzenet.csatolmanyok.length; i++) {
      this.message.uzenet.csatolmanyok[i].loading = false;
    }

    this.sans = false;
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
    let filePath = await this.userManager.currentUser.getMessageFile(id, newName[0], newName[1]);
    this.FileOpener.showOpenWithDialog(filePath, this.types[newName[1]]);
    for (let i = 0; i < this.message.uzenet.csatolmanyok.length; i++) {
      if (this.message.uzenet.csatolmanyok[i].azonosito == id) {
        this.message.uzenet.csatolmanyok[i].loading = false;
      }
    }
  }
  //Bodging it together, piece by piece
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
