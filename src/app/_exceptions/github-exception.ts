import { HTTPResponse } from "@ionic-native/http/ngx";
import { GlobalError } from "./global-exception";

export class GithubError extends GlobalError {
    constructor(
        queryName: string,
        customTitleTranslatorKey?: string,
        customTextTranslatorKey?: string
    ) {
        super(
            queryName,
            "errors.github." +
                (customTitleTranslatorKey ? customTitleTranslatorKey : "defaultTitle"),
            "errors.github." +
                (customTextTranslatorKey ? customTextTranslatorKey : "defaultText")
        );
    }
}