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
    this.sans = false;
  }

  goBack() {
    this.router.navigateByUrl('messages');
  }

  async getFile(id: number, fullName: string) {
    const splitAt = (index: number) => (x: string) => [x.slice(0, index), x.slice(index)]

    let newName = splitAt(fullName.lastIndexOf('.'))(fullName);
    newName[1] = newName[1].slice(1);
    let filePath = await this.userManager.currentUser.getMessageFile(id, newName[0], newName[1]);
    let mime = require('mime-types');
    this.FileOpener.showOpenWithDialog(filePath, mime.lookup(newName[1]));
  }
}
