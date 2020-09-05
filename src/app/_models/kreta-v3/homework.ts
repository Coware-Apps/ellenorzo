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
    Csatolmanyok: null;
    Uid: string;
}

export interface OsztalyCsoport {
    Uid: string;
}
