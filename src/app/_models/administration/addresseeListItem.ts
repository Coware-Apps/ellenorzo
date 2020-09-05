export interface AddresseeListItem extends UniversalAddresseeListItem {
    isAlairo: boolean;
    kretaAzonosito: number;
    nev: string;
    oktatasiAzonosito?: string;
    titulus: string;
    //not from the server
    isAdded?: boolean;
    tipus?: {
        azonosito: number;
        kod: string;
        rovidNev: string;
        nev: string;
        leiras: string;
    };
}
export function instanceOfAddresseeListItem(object: any): object is AddresseeListItem {
    return "nev" in object;
}
export interface ParentAddresseeListItem extends UniversalAddresseeListItem {
    gondviseloNev: string;
    tanuloNev: string;
    tanuloOktatasiAzonosito: string;
    rokonsagiFok: string;
    isTorvenyesKepviselo: boolean;
    sZMKOsztalyKretaAzonosito: number;
    sZMKOsztalyHelyettesKretaAzonosito: number;
}
export function instanceOfParentAddresseeListItem(object: any): object is ParentAddresseeListItem {
    return "gondviseloNev" in object;
}
export interface StudentAddresseeListItem extends UniversalAddresseeListItem {
    vezetekNev: string;
    keresztNev: string;
    oktatasiAzonosito: string;
    szuletesiIdo: string;
    osztalyKretaAzonosito: number;
    osztaly: string;
    elotag: string;
}
export function instanceOfStudentAddresseeListItem(
    object: any
): object is StudentAddresseeListItem {
    return "vezetekNev" in object;
}
export interface UniversalAddresseeListItem {
    kretaAzonosito: number;

    //not from the server
    isAdded?: boolean;
    tipus?: {
        azonosito: number;
        kod: string;
        rovidNev: string;
        nev: string;
        leiras: string;
    };
}
