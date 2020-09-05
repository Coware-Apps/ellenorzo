export interface AddresseeGroup {
    kretaAzonosito: number;
    nev: string;
    oktNevelesiKategoriaKretaAzonosito: number;
    /**
     * Only the group requests come with this, the class requests don't
     */
    osztalyKretaAzonosito?: number;
}
