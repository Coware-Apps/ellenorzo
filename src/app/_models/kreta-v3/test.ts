export interface Test {
    BejelentesDatuma: string;
    Datum: string;
    Modja: Modja;
    OrarendiOraOraszama: number;
    RogzitoTanarNeve: string;
    TantargyNeve: string;
    Temaja: string;
    OsztalyCsoport: OsztalyCsoport;
    Uid: string;

    //not from the server;
}

export interface Modja {
    Uid: string;
    Leiras: string;
    Nev: string;
}

export interface OsztalyCsoport {
    Uid: string;
}
