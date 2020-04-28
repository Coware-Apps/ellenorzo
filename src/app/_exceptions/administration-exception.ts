import { HTTPResponse } from '@ionic-native/http/ngx';
import { GlobalError } from './global-exception';
import { HttpResponse } from '@angular/common/http';

export class AdministrationError extends GlobalError {
    constructor(
        queryName: string,
        customTitleTranslatorKey?: string,
        customTextTranslatorKey?: string
    ) {
        super(
            queryName,
            'errors.administration.' + (customTitleTranslatorKey ? customTitleTranslatorKey : 'defaultTitle'),
            'errors.administration.' + (customTextTranslatorKey ? customTextTranslatorKey : 'defaultText'),
        );
    }
}
export class AdministrationHttpError extends AdministrationError {
    queryName: string;
    httpErrorObject: HTTPResponse;
    constructor(
        queryName: string,
        httpErrorObject: HTTPResponse,

        customTitleTranslatorKey?: string,
        customTextTranslatorKey?: string
    ) {
        super(queryName, customTitleTranslatorKey, customTextTranslatorKey);
        this.queryName = queryName;
        this.httpErrorObject = httpErrorObject;
    }
}
export class AdministrationTokenError extends AdministrationHttpError {
    constructor(
        httpErrorObject: HTTPResponse,

        customTitleTranslatorKey?: string,
        customTextTranslatorKey?: string
    ) {
        super("Token", httpErrorObject, customTitleTranslatorKey, customTextTranslatorKey)
    }
}
export class AdministrationFileError extends AdministrationHttpError {
    fileName: string;

    constructor(
        queryName: string,
        httpErrorObject: HTTPResponse,
        fileName: string,

        customTitleTranslatorKey?: string,
        customTextTranslatorKey?: string
    ) {
        super(queryName, httpErrorObject, customTitleTranslatorKey, customTextTranslatorKey);
        this.fileName = fileName;
    }
}
export class AdministrationInvalidGrantErorr extends AdministrationHttpError {
    constructor(queryName: string, httpErrorObject: HTTPResponse) {
        super(queryName, httpErrorObject, 'invalid-grant.title', 'invalid-grant.text');
    }
}



export class AdministrationInvalidResponseError extends AdministrationError {
    constructor(
        queryName: string,
    ) {
        super(queryName, "invalid.title", "invalid.text")
    }
}
export class AdministrationNetworkError extends AdministrationError {
    constructor(queryName: string) {
        super(queryName, 'network.title', 'network.text');
    }
}