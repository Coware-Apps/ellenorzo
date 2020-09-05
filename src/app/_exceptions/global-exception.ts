export class GlobalError implements Error {
    queryName: string;
    customTitleTranslatorKey: string;
    customTextTranslatorKey: string;
    name: string;
    message: string;
    stack: string;
    isHandled: boolean = false;
    constructor(
        queryName: string,
        customTitleTranslatorKey?: string,
        customTextTranslatorKey?: string
    ) {
        this.queryName = queryName;
        this.customTitleTranslatorKey = customTitleTranslatorKey;
        this.customTextTranslatorKey = customTextTranslatorKey;
    }
}
