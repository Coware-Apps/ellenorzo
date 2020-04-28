import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root",
})
export class DiacriticsHelper {
    private diacriticsMap: Map<string, string> = new Map([
        ["Á", "A"],
        ["á", "a"],
        ["É", "E"],
        ["é", "e"],
        ["Í", "I"],
        ["í", "i"],
        ["Ó", "O"],
        ["ó", "o"],
        ["Ú", "U"],
        ["ú", "u"],
        ["Ü", "U"],
        ["ü", "u"],
        ["Ö", "O"],
        ["ö", "o"],
        ["Ő", "O"],
        ["ő", "o"],
        ["Ű", "U"],
        ["ű", "u"],
    ]);

    public removeDiacritics(str: string): string {
        return str.replace(/[^A-Za-z0-9\s]+/g, a => this.diacriticsMap.get(a) || a);
    }
}
