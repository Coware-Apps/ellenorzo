export interface Note {
    Cim: string;
    Datum: string;
    KeszitesDatuma: string;
    KeszitoTanarNeve: string;
    LattamozasDatuma: string;
    OsztalyCsoport: OsztalyCsoport;
    Tartalom: string;
    Tipus: Tipus;
    Uid: string;

    //not from the API
    Teaser?: string;
    opened?: boolean;
}

export interface OsztalyCsoport {
    Uid: string;
}

export interface Tipus {
    Uid: string;
    Leiras: string;
    Nev: string;
}
