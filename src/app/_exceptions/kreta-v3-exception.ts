import { GlobalError } from "./global-exception";
import { HTTPResponse } from "@ionic-native/http/ngx";

export class KretaV3Error extends GlobalError {
    constructor(
        queryName: string,
        customTitleTranslatorKey?: string,
        customTextTranslatorKey?: string
    ) {
        super(
            queryName,
            "errors.kreta." +
                (customTitleTranslatorKey ? customTitleTranslatorKey : "defaultTitle"),
            "errors.kreta." + (customTextTranslatorKey ? customTextTranslatorKey : "defaultText")
        );
    }
}
export class KretaV3HttpError extends KretaV3Error {
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

export class KretaV3FileError extends KretaV3HttpError {
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
export class KretaV3InvalidGrantError extends KretaV3HttpError {
    constructor(queryName: string, httpErrorObject: HTTPResponse) {
        super(queryName, httpErrorObject, "invalid-grant.title", "invalid-grant.text");
    }
}
export class KretaV3TokenError extends KretaV3HttpError {
    constructor(
        httpErrorObject: HTTPResponse,

        customTitleTranslatorKey?: string,
        customTextTranslatorKey?: string
    ) {
        super("Token", httpErrorObject, customTitleTranslatorKey, customTextTranslatorKey);
    }
}
export class KretaV3RenewTokenError extends KretaV3HttpError {
    constructor(
        httpErrorObject: HTTPResponse,

        customTitleTranslatorKey?: string,
        customTextTranslatorKey?: string
    ) {
        super("Token", httpErrorObject, customTitleTranslatorKey, customTextTranslatorKey);
    }
}

export class KretaV3InvalidResponseError extends KretaV3Error {
    constructor(queryName: string) {
        super(queryName, "invalid.title", "invalid.text");
    }
}
export class KretaV3NetworkError extends KretaV3Error {
    constructor(queryName: string) {
        super(queryName, "network.title", "network.text");
    }
}
export class KretaV3SchoolYearChangedError extends KretaV3Error {
    constructor(queryName: string) {
        super(queryName, "schoolYearChanged.title", "schoolYearChanged.text");
    }
}
