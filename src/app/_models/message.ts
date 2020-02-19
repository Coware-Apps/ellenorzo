export class Message {
    public azonosito: number;
    public isElolvasva: boolean;
    public isToroltElem: boolean;
    public tipus: {
        azonosito: number;
        kod: string;
        leiras: string;
        nev: string;
        rovidNev: string;
    }
    public uzenet: {
        azonosito: number;
        cimzettLista: {
            azonosito: number;
            kretaAzonosito: number;
            nev: string;
            tipus: {
                azonosito: number;
                kod: string;
                leiras: string;
                nev: string;
                rovidNev: string;
            };
        }[];
        csatolmanyok: any[];
        feladoNev: string;
        feladoTitulus: string;
        kuldesDatum: Date;
        szoveg: string;
        targy: string;
    }
}