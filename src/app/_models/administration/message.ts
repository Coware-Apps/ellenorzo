interface Statusz {
    azonosito: number;
    kod: string;
    rovidNev: string;
    nev: string;
    leiras: string;
}

interface Tipus {
    azonosito: number;
    kod: string;
    rovidNev: string;
    nev: string;
    leiras: string;
}

interface Csatolmanyok {
    azonosito: number;
    fajlNev: string;
    //not from the server
    loading?: boolean;
}

interface Uzenet {
    azonosito: number;
    kuldesDatum: string;
    feladoNev: string;
    feladoTitulus: string;
    szoveg: string;
    targy: string;
    statusz: Statusz;
    cimzettLista: Addressee[];
    csatolmanyok: Csatolmanyok[];
    hibaCorrellationId?: string;
}

/**
 * The messages contain an array of this
 */
export interface Addressee {
    azonosito: number;
    kretaAzonosito: number;
    nev: string;
    tipus: Tipus;
}

/**
 * You get this, if you open a message from the messages list. It includes all data
 */
export interface AdministrationMessage {
    azonosito: number;
    isElolvasva: boolean;
    isToroltElem: boolean;
    tipus: Tipus;
    uzenet: Uzenet;
}
/**
 * You get an array of this, when you make any message list request (inbox, outbox, deleted)
 */
export interface MessageListItem {
    azonosito: number;
    uzenetAzonosito: number;
    uzenetKuldesDatum: Date;
    uzenetFeladoNev: string;
    uzenetFeladoTitulus: string;
    uzenetTargy: string;
    hasCsatolmany: boolean;
    isElolvasva: boolean;
    uzenetCimzettLista?: Addressee[];
    /**
     * If it's successfully sent, uzenetStatusz.azonosito is 2
     */
    uzenetStatusz: Statusz;
    //Not from the server
    selected?: boolean;
}
export interface AttachmentToSend {
    fajlNev: string;
    fajl: {
        ideiglenesFajlAzonosito: string;
        /** set to '' */
        utvonal?: string;
        /** set to 'Local' */
        fileHandler?: string;
        /** set to null */
        azonosito?: any;
    };
    iktatoszam?: any;
    /**
     * Only used when forwarding a message (prevMsg.uzenet.csatolmanyok[0].azonosito)
     */
    azonosito?: number;
}
