export interface Lesson {
    Allapot: Allapot;
    BejelentettSzamonkeresUids: string[];
    BejelentettSzamonkeresUid: string;
    Datum: string;
    HelyettesTanarNeve: string;
    IsTanuloHaziFeladatEnabled: boolean;
    KezdetIdopont: string;
    Nev: string;
    Oraszam: number;
    OraEvesSorszama: number;
    OsztalyCsoport: OsztalyCsoport;
    HaziFeladatUid: string;
    IsHaziFeladatMegoldva: boolean;
    TanarNeve: string;
    Tantargy: Tantargy;
    TanuloJelenlet: Allapot;
    Tema: string;
    TeremNeve: string;
    Tipus: Allapot;
    Uid: string;
    VegIdopont: string;
}

export interface Allapot {
    Uid: string;
    Leiras: string;
    Nev: string;
}

export interface Tantargy {
    Uid: string;
    Kategoria: Allapot;
    Nev: string;
}

export interface OsztalyCsoport {
    Uid: string;
    Nev: string;
}
