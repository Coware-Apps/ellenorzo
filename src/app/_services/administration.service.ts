import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PromptService } from './prompt.service';
import { Institute } from '../_models/institute';
import { Token } from '../_models/token';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { stringify } from 'querystring';
import { MessageListItem, Addressee, AttachmentToSend, AdministrationMessage } from '../_models/_administration/message';
import { AddresseeType } from '../_models/_administration/addresseeType';
import { FileTransfer, FileUploadOptions } from '@ionic-native/file-transfer/ngx';
import { Platform } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { AddresseeListItem, ParentAddresseeListItem, StudentAddresseeListItem } from '../_models/_administration/addresseeListItem';
import { AddresseeGroup } from '../_models/_administration/adresseeGroup';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { IOSFilePicker } from '@ionic-native/file-picker/ngx';
import { AdministrationHttpError, AdministrationInvalidResponseError, AdministrationTokenError, AdministrationFileError, AdministrationError, AdministrationNetworkError, AdministrationInvalidGrantErorr } from '../_exceptions/administration-exception';

@Injectable({
  providedIn: 'root'
})
export class AdministrationService {
  private _userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36";
  private _errorStatus = new BehaviorSubject(0);
  private _host = 'https://eugyintezes.e-kreta.hu/api/v1/';
  private _endpoints = {
    inboxList: 'kommunikacio/postaladaelemek/beerkezett',
    outboxList: 'kommunikacio/postaladaelemek/elkuldott',
    deletedList: 'kommunikacio/postaladaelemek/torolt',
    message: 'kommunikacio/postaladaelemek',
    manageBin: 'kommunikacio/postaladaelemek/kuka',
    delete: 'kommunikacio/postaladaelemek/torles',
    manageState: 'kommunikacio/postaladaelemek/olvasott',
    addresseeTypesList: 'kommunikacio/cimezhetotipusok',
    addresseeCategories: {
      teachers: 'kreta/alkalmazottak/tanar',
      headTeachers: 'kreta/alkalmazottak/oszalyfonok',
      directorate: 'kreta/alkalmazottak/igazgatosag',
      admins: 'kreta/alkalmazottak/adminisztrator',
      groups: 'kommunikacio/tanoraicsoportok/cimezheto',
      classes: 'kommunikacio/osztalyok/cimezheto',
      szmk: 'kommunikacio/szmkkepviselok/cimezheto',
      tutelaries: {
        byGroups: 'kreta/gondviselok/tanoraicsoport',
        byClasses: 'kreta/gondviselok/osztaly'
      },
      students: {
        byGroups: 'kreta/tanulok/tanoraicsoportok',
        byClasses: 'kreta/tanulok/osztalyok'
      }
    },
    newMessage: 'kommunikacio/uzenetek',
    temporaryAttachmentStorage: 'ideiglenesfajlok',
    finalAttachmentStorage: 'dokumentumok/uzenetek'
  }

  constructor(
    private _http: HTTP,
    private _prompt: PromptService,
    private _firebase: FirebaseX,
    private _transfer: FileTransfer,
    private _platform: Platform,
    private _file: File,
    private _androidPermissions: AndroidPermissions,
    private _camera: Camera,
    private _fileChooser: FileChooser,
    private _filePath: FilePath,
    private _iosFilePicker: IOSFilePicker,
  ) { }

  protected basicErrorHandler(queryName: string, error, customTitleTranslatorKey?: string, customTextTranslatorKey?: string) {
    if (error instanceof SyntaxError) throw new AdministrationInvalidResponseError(queryName);
    if (error.status && error.status < 0) throw new AdministrationNetworkError(queryName);

    throw new AdministrationHttpError(queryName, error, customTitleTranslatorKey, customTextTranslatorKey)
  }

  /**
   * Logs the user in with username and password.
   * @param username username used to log in
   * @param password password used to log in
   * @param institute the institute of the user
   * @returns A Promise that resolves to a `Token`
   */
  public async getToken(username: string, password: string, institute: Institute): Promise<Token | false> {
    try {
      const headers = {
        "User-Agent": this._userAgent,
        "Content-Type": "application/x-www-form-urlencoded"
      }
      const params = {
        'userName': username,
        'password': password,
        'institute_code': institute.InstituteCode,
        'grant_type': 'password',
        'client_id': 'kozelkep-js-web'
      }
      this._prompt.butteredToast("[WEB->getToken()]");

      let response = await this._http.post('https://idp.e-kreta.hu/connect/Token', params, headers);
      console.log('tokenResponse', response);
      let parsedResponse: Token;
      parsedResponse = <Token>JSON.parse(response.data);

      this._prompt.butteredToast("[WEB->getToken() result]" + parsedResponse);
      console.log("[WEB->getToken()] result: ", parsedResponse);
      this._errorStatus.next(0);
      return parsedResponse;
    } catch (error) {
      console.error("Hiba a 'Token' lekérése közben: ", error);

      if (error instanceof SyntaxError) throw new AdministrationInvalidResponseError('getToken');
      if (error.status && error.status == 400) throw new AdministrationInvalidGrantErorr('getToken', error);
      if (error.status && error.status < 0) throw new AdministrationNetworkError('getToken');
      throw new AdministrationTokenError(error, 'getToken.title', 'getToken.text');
    }
  }
  /**
   * Logs the user in with a previously acquired refresh token
   * @param refresh_token the refresh token to log the user in wit
   * @param institute the user's institute
   * @see `getAdministrationToken()` on how to get a refresh token
   */
  public async renewToken(refresh_token: string, institute: Institute): Promise<Token> {
    try {
      const headers = {
        "User-Agent": this._userAgent,
        "Content-Type": "application/x-www-form-urlencoded"
      }
      const params = {
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token',
        'institute_code': institute.InstituteCode,
        'client_id': 'kozelkep-js-web'
      }
      console.log(`[WEB->renewToken()] renewing tokens with refreshToken`, refresh_token)
      console.log(`params`, params);
      console.log(`headers`, headers);
      let response = await this._http.post("https://idp.e-kreta.hu/connect/Token", params, headers);

      let parsedResponse: Token;
      parsedResponse = <Token>JSON.parse(response.data);
      this._errorStatus.next(0);
      return parsedResponse;
    } catch (error) {
      console.error("Hiba a 'Token' lekérése közben: ", error);
      this._firebase.logError(`[WEB->renewToken()->HTTP]: ` + stringify(error));

      if (error instanceof SyntaxError) throw new AdministrationInvalidResponseError('renewToken');
      if (error.status && error.status < 0) throw new AdministrationNetworkError('renewToken');
      throw new AdministrationTokenError(error, 'renewToken.title', 'renewToken.text');
    }
  }
  /**
   * Gets the user's message list by a specified category (state)
   * @param state From which category to get the message list
   * @param tokens `Token` used for authentication
   */
  public async getMessageList(state: 'inbox' | 'outbox' | 'deleted', tokens: Token): Promise<MessageListItem[]> {
    const headers = {
      "User-Agent": this._userAgent,
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Bearer " + tokens.access_token,
    };
    const params = {};
    try {
      let response = await this._http.get(this._host + this._endpoints[`${state}List`], params, headers);
      return <MessageListItem[]>JSON.parse(response.data);
    } catch (error) {
      console.error('[WEB] Error trying to get message list', error);
      this.basicErrorHandler('getMessageList()', error, 'getMessageList.title', 'getMessageList.text')
    }
  }
  /**
   * Get data of one message (includes all data)
   * @param messageId The `azonosito` of the message from the message list
   * @param tokens `Token` used for authentication
   */
  public async getMessage(messageId: number, tokens: Token): Promise<AdministrationMessage> {
    const headers = {
      "User-Agent": this._userAgent,
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Bearer " + tokens.access_token,
    };
    const params = {};
    try {
      let response = await this._http.get(this._host + this._endpoints.message + `/${messageId}`, params, headers);
      return <AdministrationMessage>JSON.parse(response.data);
    } catch (error) {
      console.error('[WEB] Error trying to get a message', error);
      this.basicErrorHandler('getMessage()', error, 'getMessage.title', 'getMessage.text');
    }
  }
  /**
   * Put a message in the bin (it can be reverted)
   * @param action Choose put to put the message in the bin, remove to remove it.
   * @param messageIdList The `azonosito` fields of the messages to perform the operation on
   * @param tokens `Token` used for authentication
   */
  public async binMessages(action: 'put' | 'remove', messageIdList: number[], tokens: Token) {
    const headers = {
      "Authorization": "Bearer " + tokens.access_token,
      "User-Agent": this._userAgent,
      "Content-Type": "application/json",
    };
    const params = {
      isKuka: action == 'put' ? true : false,
      postaladaElemAzonositoLista: messageIdList,
    };
    this._http.setDataSerializer('json');

    try {
      await this._http.post(this._host + this._endpoints.manageBin, params, headers);
    } catch (error) {
      console.error('[WEB] Error trying to put/remove message from bin', error);
      this.basicErrorHandler('binMessages()', error, 'binMessages.title', 'binMessages.text');
    } finally {
      this._http.setDataSerializer('urlencoded');
    }
  }
  /**
   * Delete a message permanently (HOT!)
   * @param messageIdList The `uzenetAzonosito` fields of the messages to perform the operation on
   * @param tokens `Token` used for authentication
   */
  public async deleteMessages(messageIdList: number[], tokens: Token) {
    const headers = {
      "Authorization": "Bearer " + tokens.access_token,
      "User-Agent": this._userAgent,
      "Content-Type": "application/x-www-form-urlencoded"
    };
    const params = {};

    let quersStr: string = "";

    /** Listen closely... You can hear the ASP.NET framework on the server cry in the distance... */
    for (let i = 0; i < messageIdList.length; i++) {
      if (i == 0) {
        quersStr += `?postaladaElemAzonositok=${messageIdList[i]}`;
      } else {
        quersStr += `&postaladaElemAzonositok=${messageIdList[i]}`;
      }
    }

    try {
      await this._http.delete(this._host + this._endpoints.delete + quersStr, params, headers);
    } catch (error) {
      console.error('[WEB] Error trying to delete message', error);
      this.basicErrorHandler('deleteMessages()', error, 'deleteMessages.title', 'deleteMessages.text');
    }
  }
  /**
   * Set a message's state either read or to unread
   * @param newState Choose read to set the message as read, unread to set it as unread
   * @param messageIdList The `uzenetAzonosito` fields of the messages to perform the operation on
   * @param tokens `Token` used for authentication
   */
  public async changeMessageState(newState: 'read' | 'unread', messageIdList: number[], tokens: Token) {
    const headers = {
      "Authorization": "Bearer " + tokens.access_token,
      "User-Agent": this._userAgent,
      "Content-Type": "application/json"
    };
    const params = {
      isOlvasott: newState == 'read' ? true : false,
      postaladaElemAzonositoLista: messageIdList,
    };
    this._http.setDataSerializer('json');
    try {
      await this._http.post(this._host + this._endpoints.manageState, params, headers);
    } catch (error) {
      console.error('[WEB] Error trying to change message state', error);
      this.basicErrorHandler('changeMessageState()', error, 'changeMessageState.title', 'changeMessageState.text');
    } finally {
      this._http.setDataSerializer('urlencoded');
    }
  }
  public async getAddresseeGroups(
    addresseeType: 'tutelaries' | 'students',
    groupType: 'classes' | 'groups',
    tokens: Token
  ): Promise<AddresseeGroup[]> {
    const headers = {
      "Authorization": "Bearer " + tokens.access_token,
      "User-Agent": this._userAgent,
      "Content-Type": "application/x-www-form-urlencoded"
    };
    const params = {
      cimzettKod: addresseeType == 'tutelaries' ? 'GONDVISELOK' : 'TANULOK',
    };
    let endpoint = this._endpoints.addresseeCategories[groupType]
    try {
      let response = await this._http.get(this._host + endpoint, params, headers);
      return <AddresseeGroup[]>JSON.parse(response.data);
    } catch (error) {
      console.error('[WEB] Error trying to get Addressee groups', error);
      this.basicErrorHandler('getAddresseeGroups()', error, 'adresseeLoading.title', 'adresseeLoading.text');
    }
  }
  /**
   * Replies to an existing message
   * @param messageId The `uzenetAzonosito` field of the message to reply to
   * @param targy The subject of the new message
   * @param szoveg The text of the new message (Can include HTML tags)  
   * @param attachmentList The list of attachments to send with the message 
   * @param tokens `Token` used for authentication
   */
  public async replyToMessage(
    messageId: number,
    targy: string,
    szoveg: string,
    attachmentList: AttachmentToSend[],
    tokens: Token
  ) {
    const headers = {
      "Authorization": "Bearer " + tokens.access_token,
      "User-Agent": this._userAgent,
      "Content-Type": "application/json"
    };
    const params = {
      targy: targy,
      szoveg: szoveg,
      elozoUzenetAzonosito: messageId,
      cimzettLista: [],
      csatolmanyok: attachmentList,
    };
    this._http.setDataSerializer('json');
    try {
      await this._http.post(this._host + this._endpoints.newMessage, params, headers);
      return true;
    } catch (error) {
      console.error('[WEB] Error trying to reply to message', error);
      this.basicErrorHandler('replyToMessage()', error, 'replyToMessage.title', 'replyToMessage.text');
    } finally {
      this._http.setDataSerializer('urlencoded');
    }
  }
  /**
   * Sends a new message
   * @param addresseeList The list of addressees to send the message to
   * @param targy The subject of the new message
   * @param szoveg The text of the new message (Can include HTML tags)
   * @param attachmentList The list of attachments to send with the message
   * @param tokens `Token` used for authentication
   * @see The documentation for more info about addressees
   */
  public async sendNewMessage(
    addresseeList: Addressee[],
    targy: string,
    szoveg: string,
    attachmentList: AttachmentToSend[],
    tokens: Token,
  ) {
    const headers = {
      "Authorization": "Bearer " + tokens.access_token,
      "User-Agent": this._userAgent,
      "Content-Type": "application/json"
    };
    const params = {
      targy: targy,
      szoveg: szoveg,
      elozoUzenetAzonosito: null,
      cimzettLista: addresseeList,
      csatolmanyok: attachmentList,
    };
    console.log('params', params);
    this._http.setDataSerializer('json');
    try {
      await this._http.post(this._host + this._endpoints.newMessage, params, headers);
      return true;
    } catch (error) {
      console.error('[WEB] Error trying to send new message', error);
      this.basicErrorHandler('sendNewMessage()', error, 'sendNewMessage.title', 'sendNewMessage.text');
    } finally {
      this._http.setDataSerializer('urlencoded');
    }
  }
  /**
   * Gets the types of addressees the user can choose from. It is used to display category names descriptions etc.
   * @param tokens `Token` used for authentication
   * @see The documentation for more info about addressees
   */
  public async getAddresseeTypeList(tokens: Token): Promise<AddresseeType[]> {
    const headers = {
      "Authorization": "Bearer " + tokens.access_token,
      "User-Agent": this._userAgent,
      "Content-Type": "application/json"
    };
    const params = {};
    try {
      let response = await this._http.get(this._host + this._endpoints.addresseeTypesList, params, headers);
      return <AddresseeType[]>JSON.parse(response.data);
    } catch (error) {
      console.error('Error trying to get addressee list', error);
      this.basicErrorHandler('getAddresseeTypeList()', error, 'adresseeLoading.title', 'adresseeLoading.text');
    }
  }
  /**
   * Gets the list of possible addressees to send a message to, from a specified category.
   * @param category The category from which to get the list of possible addressees
   * @param tokens `Token` used for authentication
   */
  public async getAddresseeListByCategory(
    category: 'teachers' | 'headTeachers' | 'directorate' | 'tutelaries' | 'students' | 'admins' | 'szmk',
    tokens: Token,
  ): Promise<AddresseeListItem[]> {
    const headers = {
      "Authorization": "Bearer " + tokens.access_token,
      "User-Agent": this._userAgent,
      "Content-Type": "application/json"
    };
    const params = {};
    try {
      let response = await this._http.get(this._host + this._endpoints.addresseeCategories[category], params, headers);
      return <AddresseeListItem[]>JSON.parse(response.data);
    } catch (error) {
      console.error(`Error trying to get addressee list by category: ${category}`, error);
      this.basicErrorHandler('getAddresseeListByCategory()', error, 'adresseeLoadingError.title', 'adresseeLoadingError.text');
    }
  }
  public async getStudentsOrParents(category: 'students' | 'tutelaries', by: 'byGroups' | 'byClasses', groupOrClassId: number, tokens: Token) {
    const headers = {
      "Authorization": "Bearer " + tokens.access_token,
      "User-Agent": this._userAgent,
      "Content-Type": "application/json"
    };
    const params = {};
    try {
      let response = await this._http.get(this._host + this._endpoints.addresseeCategories[category][by] + `/${groupOrClassId}`, params, headers);
      if (category == 'tutelaries') {
        return <ParentAddresseeListItem[]>JSON.parse(response.data);
      } else {
        return <StudentAddresseeListItem[]>JSON.parse(response.data);
      }
    } catch (error) {
      console.error(`Error trying to get ${category} list by ${by}, with id: ${groupOrClassId}`, error);
      this.basicErrorHandler('getStudentsOrParents()', error, 'adresseeLoadingError.title', 'adresseeLoadingError.text');
    }
  }
  /**
   * Add an attachment to the temporary attachment storage. Used to draft messages WIP
   * @param tokens `Token` used for authentication
   * @returns Promise that resolves to a string, that is the id of the file in the temporary storage
   */
  public async addAttachment(using: 'camera' | 'gallery' | 'file', tokens: Token): Promise<AttachmentToSend> {
    let isFileSelected = true;
    let uri = this._host + this._endpoints.temporaryAttachmentStorage;
    let filePath, fileName;
    const headers = {
      "Authorization": "Bearer " + tokens.access_token,
      "User-Agent": this._userAgent,
    }
    const params = {}
    try {
      if (this._platform.is('ios')) {
        if (using == 'file') {
          //Yeah, don't ask me why this works
          filePath = "file://" + await this._iosFilePicker.pickFile();
          fileName = filePath.substr(filePath.lastIndexOf('/') + 1);
        } else if (using == 'camera') {
          let opts: CameraOptions = {
            quality: 100,
            destinationType: this._camera.DestinationType.FILE_URI,
            sourceType: this._camera.PictureSourceType.CAMERA,
            saveToPhotoAlbum: false,
          };
          filePath = await this._camera.getPicture(opts);
          fileName = filePath.split('/')[filePath.split('/').length - 1];
        } else {
          console.log('selecting with gallery');
          let opts: CameraOptions = {
            quality: 100,
            destinationType: this._camera.DestinationType.FILE_URI,
            sourceType: this._camera.PictureSourceType.PHOTOLIBRARY,
            encodingType: this._camera.EncodingType.JPEG,
            saveToPhotoAlbum: false,
            allowEdit: true,
          };
          filePath = await this._camera.getPicture(opts);
          fileName = filePath.split('/')[filePath.split('/').length - 1];
        }
      } else {
        if (using == 'file') {
          filePath = await this._filePath.resolveNativePath(await this._fileChooser.open());
          fileName = await this._filePath.resolveNativePath(filePath);
          fileName = fileName.split('/')[fileName.split('/').length - 1];
        } else if (using == 'camera') {
          let opts: CameraOptions = {
            quality: 100,
            destinationType: this._camera.DestinationType.NATIVE_URI,
            sourceType: this._camera.PictureSourceType.CAMERA,
            encodingType: this._camera.EncodingType.JPEG,
            saveToPhotoAlbum: true,
          };
          filePath = await this._camera.getPicture(opts);
          filePath = await this._filePath.resolveNativePath(filePath);
          fileName = filePath.split('/')[filePath.split('/').length - 1];
        } else {
          let opts: CameraOptions = {
            quality: 100,
            destinationType: this._camera.DestinationType.NATIVE_URI,
            sourceType: this._camera.PictureSourceType.PHOTOLIBRARY,
            encodingType: this._camera.EncodingType.JPEG,
            saveToPhotoAlbum: false,
            allowEdit: true,
          };
          filePath = await this._camera.getPicture(opts);
          filePath = await this._filePath.resolveNativePath(filePath);
          fileName = filePath.split('/')[filePath.split('/').length - 1];
        }
      }
    } catch (error) {
      if (error != 'User canceled.' && error != 'No Image Selected' && error != 'canceled') {
        throw new AdministrationFileError('addAttachment()', error, fileName, 'addAttachment.title', 'addAttachment.text');
      } else {
        console.log('Aborting upload, no file/image selected');
      }
      isFileSelected = false;
    }

    console.log('ENCODED PATH', encodeURI(filePath));
    console.log('PATH', filePath);

    if (isFileSelected) {
      try {
        //trying with the 
        this._http.setDataSerializer('multipart');
        let response = await this._http.uploadFile(
          uri,
          params,
          headers,
          //this._platform.is('ios') ? encodeURI(filePath) : filePath,
          encodeURI(filePath),
          'fajl'
        );
        let returnVal: AttachmentToSend = {
          fajlNev: fileName,
          fajl: {
            ideiglenesFajlAzonosito: response.data
          },
          iktatoszam: null,
        }
        return returnVal;
      } catch (error) {
        console.warn('Advanced http failed, attempting with the filetransfer plugin');
        try {
          let transfer = await this._transfer.create();
          let opts: FileUploadOptions = new Object();
          opts.fileKey = 'fajl';
          opts.headers = headers;
          try {
            let res = await transfer.upload(encodeURI(filePath), uri, opts);
            let returnVal: AttachmentToSend = {
              fajlNev: fileName,
              fajl: {
                ideiglenesFajlAzonosito: res.response,
              },
              iktatoszam: null,
            }
            return returnVal;
          } catch (error2) {
            this.basicErrorHandler('addAttachment()', error, 'addAttachment.title', 'addAttachment.text');
          }
        } finally {
          this._http.setDataSerializer('urlencoded');
        }
      } finally {
        this._http.setDataSerializer('urlencoded');
      }
    }
  }
  /**
   * Removes an attachment from the temporary attachment storage. Used for drafting messages.
   * @param attachmentId The id of the attachment to remove
   * @param tokens `Token` used for authentication
   */
  public async removeAttachment(attachmentId: string, tokens: Token) {
    const headers = {
      "User-Agent": this._userAgent,
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Bearer " + tokens.access_token,
    };
    const params = {};
    try {
      await this._http.delete(
        this._host + this._endpoints.temporaryAttachmentStorage + `/${attachmentId}`,
        params,
        headers
      );
      return true;
    } catch (error) {
      console.error('[WEB] Error trying to get message list', error);
      this.basicErrorHandler('removeAttachment()', error, 'removeAttachment.title', 'removeAttachment.text');
    }
  }
  /**
   * Gets an attachment from the final attachment storage. Use this for existing messages.
   * @param fileId The id of the file to get from the server
   * @param fileName The name of the file to get form the server (used to save the file)
   * @param fileExtension The extension of the file to get from the server
   * @param tokens `Token` used for authentication
   */
  public async getAttachment(fileId: number, fileName: string, fileExtension: string, tokens: Token): Promise<string> {
    let fileTransfer = this._transfer.create();
    let uri = `${this._host}${this._endpoints.finalAttachmentStorage}/${fileId}`;
    let fullFileName = fileName + '.' + fileExtension;
    try {
      let url;
      await this._platform.ready().then(async x => {
        let entry = await fileTransfer.download(
          uri,
          await this.getDownloadPath() + fullFileName,
          false,
          {
            headers: {
              "Authorization": `Bearer ${tokens.access_token}`,
              "User-Agent": this._userAgent,
            }
          }
        )
        url = entry.nativeURL;
      });
      return url;
    } catch (error) {
      console.error('Error trying to get file', error);
      this._firebase.logError(`[KRETA->getMessageFile()]: ` + stringify(error));
      if (error.status && error.status < 0) throw new AdministrationNetworkError('getAttachment()');
      throw new AdministrationFileError('getAttachment()', error, fileName, 'getAttachment.title', 'getAttachment.text');
    }
  }
  protected async getDownloadPath() {
    if (this._platform.is('ios')) {
      return this._file.documentsDirectory;
    }

    await this._androidPermissions.checkPermission(this._androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE).then(
      result => {
        if (!result.hasPermission) {
          this._androidPermissions.requestPermission(this._androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE);
        }
      }
    );

    return this._file.cacheDirectory;
  }
}
