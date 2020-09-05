export interface Absence {
    IgazolasAllapota: string;
    IgazolasTipusa: IgazolasTipusa;
    KesesPercben: number;
    KeszitesDatuma: string;
    Mod: IgazolasTipusa;
    Datum: string;
    Ora: Ora;
    RogzitoTanarNeve: string;
    Tantargy: Tantargy;
    Tipus: IgazolasTipusa;
    OsztalyCsoport: OsztalyCsoport;
    Uid: string;

    //not from the server
}

export interface IgazolasTipusa {
    Uid: string;
    Leiras: string;
    Nev: string;
}

export interface Ora {
    KezdoDatum: string;
    VegDatum: string;
    Oraszam: number;
}

export interface OsztalyCsoport {
    Uid: string;
}

export interface Tantargy {
    Uid: string;
    Kategoria: IgazolasTipusa;
    Nev: string;
}
