export interface SchoolYearPlan {
    Datum: string;
    ElteroOrarendSzerintiTanitasiNap: ElteroOrarendSzerintiTanitasiNap;
    Naptipus: ElteroOrarendSzerintiTanitasiNap;
    OrarendiNapHetirendje: ElteroOrarendSzerintiTanitasiNap;
    Uid: string;
    OsztalyCsoport: null;
}

export interface ElteroOrarendSzerintiTanitasiNap {
    Uid: string;
    Leiras: string;
    Nev: string;
}
