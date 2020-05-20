import { GlobalError } from './global-exception';
import { HTTPResponse } from '@ionic-native/http/ngx';
import { HttpResponse } from '@angular/common/http';

export class KretaError extends GlobalError {
    constructor(
        queryName: string,
        customTitleTranslatorKey?: string,
        customTextTranslatorKey?: string
    ) {
        super(
            queryName,
            'errors.kreta.' + (customTitleTranslatorKey ? customTitleTranslatorKey : 'defaultTitle'),
            'errors.kreta.' + (customTextTranslatorKey ? customTextTranslatorKey : 'defaultText'),
        );
    }
}
export class KretaHttpError extends KretaError {
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
export class KretaInvalidGrantError extends KretaHttpError {
    constructor(queryName: string, httpErrorObject: HTTPResponse) {
        super(queryName, httpErrorObject, 'invalid-grant.title', 'invalid-grant.text');
    }
}
export class KretaTokenError extends KretaHttpError {
    constructor(
        httpErrorObject: HTTPResponse,

        customTitleTranslatorKey?: string,
        customTextTranslatorKey?: string
    ) {
        super("Token", httpErrorObject, customTitleTranslatorKey, customTextTranslatorKey)
    }
}
export class KretaRenewTokenError extends KretaHttpError {
    constructor(
        httpErrorObject: HTTPResponse,

        customTitleTranslatorKey?: string,
        customTextTranslatorKey?: string
    ) {
        super("Token", httpErrorObject, customTitleTranslatorKey, customTextTranslatorKey)
    }
}


export class KretaInvalidResponseError extends KretaError {
    constructor(
        queryName: string,
    ) {
        super(queryName, "invalid.title", "invalid.text")
    }
}
export class KretaNetworkError extends KretaError {
    constructor(queryName: string) {
        super(queryName, 'network.title', 'network.text');
    }
}