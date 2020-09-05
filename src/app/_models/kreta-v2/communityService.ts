export class CommunityService {
    public AggregateResults: null;
    public Data: CommunityServiceData[];
}
export interface CommunityServiceData {
    ID: number;
    IntervallumKezdete: string;
    IntervallumVege: string;
    KozossegiSzolgalatTipusa: number;
    KozossegiSzolgalatTipusa_DNAME: string;
    Megjegyzes: string;
    Modosithato: string;
    Modosithato_BNAME: string;
    Modosithato_BOOL: boolean;
    Oraszam: 0;
    OsztalyNev: string;
    RogzitesDatuma: string;
    TanuloId: number;
    TanuloNev: string;
    TeljesitesiHelye: string;
    //now this is either "False" or "True", not easily converible to bool. Why? Who knows
    Torolheto_BOOL: "False" | "True";
    Torolt: string;
    Torolt_BNAME: string;
    Torolt_BOOL: boolean;
    Ugyiratszam: null;
}
