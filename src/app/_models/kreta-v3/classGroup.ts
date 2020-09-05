export interface ClassGroup {
    OktatasNevelesiFeladat: OktatasiNevelesiTipus;
    OktatasNevelesiKategoria: OktatasiNevelesiTipus;
    OktatasNevelesiFeladatSortIndex: number;
    Nev: string;
    IsAktiv: boolean;
    Uid: string;
    OsztalyFonok: OsztalyFonok;
    OsztalyFonokHelyettes: null;
    Tipus: string;
    Tagsagok: Tagsagok[];
}

export interface OktatasiNevelesiTipus {
    Uid: string;
    Leiras: string;
    Nev: string;
}

export interface OsztalyFonok {
    Uid: string;
}

export interface Tagsagok {
    BesorolasDatuma: string;
    KisorolasDatuma: string;
}
