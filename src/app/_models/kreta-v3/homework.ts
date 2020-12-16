export interface Homework {
    FeladasDatuma: string;
    HataridoDatuma: string;
    RogzitesIdopontja: string;
    IsTanarRogzitette: boolean;
    IsTanuloHaziFeladatEnabled: boolean;
    IsMegoldva: boolean;
    RogzitoTanarNeve: string;
    Szoveg: string;
    TantargyNeve: string;
    OsztalyCsoport: OsztalyCsoport;
    Csatolmanyok: Csatolmany[];
    Uid: string;
}

export interface OsztalyCsoport {
    Uid: string;
}
export interface Csatolmany {
            "Uid": number,
            "Nev": string;
            "Tipus": string,

            loading?: boolean,
}
