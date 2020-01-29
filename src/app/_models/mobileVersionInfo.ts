export class MobileVersionInfo {
    //currently: 0
    LatestVersion: string;
    MinimumSupportedVersion: string;
    //aaaaight
    BlacklistPlatformByMobileBuildVersion : [{
        //the official user agent (currently) is Kreta.Ellenorzo/<According MobileBuildVersions>
        MobileBuildVersions: string;
        Platform: string;
    }];
    //junk
}