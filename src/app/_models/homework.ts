export class StudentHomework {
    // https://github.com/boapps/e-kreta-api-docs#user-content-tanul%C3%B3i-h%C3%A1zi-feladat-lek%C3%A9r%C3%A9se

    FeladasDatuma: string;
    Id: number;

    Uid: number;
    TanuloNev: string;
    FeladatSzovege: string;
    RogzitoId: number;
    TanuloAltalTorolt: boolean;
    TanarAltalTorolt: boolean;
    Tantargy?: string;
}
export class TeacherHomework {
    FeladasDatuma: string;
    Uid: number;
    Id: number;

    Hatarido: string;
    IsTanarRogzitette: boolean;
    IsTanuloHazifeldatEnabled: boolean;
    Oraszam: number;
    //literally: "000000", as a string...
    OsztalyCsoportUid: string;
    Rogzito: string;
    Szoveg: string;
    TanitasiOraid: number;
    Tantargy: string;
    IsMegoldva?: boolean;
}
export class HomeworkResponse {
    //when a homework is posted, the server spits this back
    TanarHaziFeladatId: number;
    HozzaadottTanuloHaziFeladatId: number;
    HozzaadottTanuloHaziBejelentesDatuma: Date;
}