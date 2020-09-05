export interface Student {
    AnyjaNeve: string;
    Cimek: string[];
    Gondviselok: Gondviselo[];
    IntezmenyAzonosito: string;
    IntezmenyNev: string;
    Nev: string;
    SzuletesiDatum: string;
    SzuletesiHely: string;
    SzuletesiNev: string;
    TanevUid: string;
    Uid: string;
}

export interface Gondviselo {
    EmailCim: string;
    Nev: string;
    Telefonszam: string;
    Uid: string;
}
