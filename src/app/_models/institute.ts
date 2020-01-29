export interface Institute {
    InstituteId: number;
    InstituteCode: string;
    Name: string;
    Url: string;
    City: string;
    AdvertisingUrl: string;
    FeatureToggleSet: {
        JustificationFeatureEnabled: string;
    };
}