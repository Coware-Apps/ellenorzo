import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { PromptService } from './prompt.service';
@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  constructor(
    private transfer: FileTransfer,
    private file: File,
    private platform: Platform,
    private prompt: PromptService,
    //private androidPermissions: AndroidPermissions,
  ) {
  }

  public downloadFile(fileId: number, fileName: string, fileExtension): Promise<any> {
    return this.performDownload(fileId, fileName, fileExtension);
  }

  protected async performDownload(fileId: number, fileName: string, fileExtension: string) {
    const fileTransfer: FileTransferObject = this.transfer.create();

    let uri = encodeURI(`www.yourapi.com/file/download?id=fileId`);

    let path = await this.getDownloadPath();

    let fullFileName = fileName + '.' + fileExtension;

    // Depending on your needs, you might want to use some form of authentication for your API endpoints
    // In this case, we are using bearer tokens
    let bearerToken = 'yourToken';

    return fileTransfer.download(
      uri,
      path + fileName,
      false,
      {
        headers: {
          "Authorization": `Bearer ${bearerToken}`
        }
      }
    ).then(
      result => {
        this.showAlert(true, fileName);
      },
      error => {
        this.showAlert(false, fileName);
      }
    )
  }

  public async getDownloadPath() {
    if (this.platform.is('ios')) {
      return this.file.documentsDirectory;
    }

    // To be able to save files on Android, we first need to ask the user for permission. 
    // We do not let the download proceed until they grant access
    // await this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE).then(
    //   result => {
    //     if (!result.hasPermission) {
    //       return this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE);
    //     }
    //   }
    // );

    return this.file.externalRootDirectory + "/Download/";
  }

  // Here we are using simple alerts to show the user if the download was successful or not
  public showAlert(hasPassed: boolean, fileName: string) {
    let title = hasPassed ? "Download complete!" : "Download failed!";

    let subTitle = hasPassed ? `Successfully downloaded ${fileName}.` : `There was a problem while downloading ${fileName}`;

    this.prompt.presentUniversalAlert(title, subTitle, "");
  }
}
