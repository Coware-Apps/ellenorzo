export interface Evaluation {
    ErtekeloTanarNeve: string;
    ErtekFajta: ErtekFajta;
    Jelleg: string;
    KeszitesDatuma: string;
    LattamozasDatuma: null;
    Mod: ErtekFajta | null;
    RogzitesDatuma: string;
    SulySzazalekErteke: number | null;
    SzamErtek: number | null;
    SzovegesErtek: string;
    SzovegesErtekelesRovidNev: null | string;
    Tantargy: Tantargy;
    Tema: null | string;
    Tipus: ErtekFajta;
    OsztalyCsoport: OsztalyCsoport;
    Uid: string;

    //not from the server
    extraId?: number;
    isEvaluation: true;
}

export interface ErtekFajta {
    Uid: string;
    Leiras: string;
    Nev: string;
}

export interface OsztalyCsoport {
    Uid: string;
}

export interface Tantargy {
    Uid: string;
    Kategoria: ErtekFajta;
    Nev: string;
}
