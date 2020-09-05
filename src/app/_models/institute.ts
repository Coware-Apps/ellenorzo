export interface Institute {
    instituteId: number;
    instituteCode: string;
    name: string;
    url: string;
    city: string;
    advertisingUrl: string;
    featureToggleSet: {
        justificationFeatureEnabled: string;
    };
}
