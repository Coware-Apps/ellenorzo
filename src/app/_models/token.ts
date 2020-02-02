export class Token {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    token_type: string;
}

export class DecodedUser {
    aud: string;
    exp: number;
    "idp:hashofroles": string;
    "idp:user_id": string;
    iss: string;
    "kreta:institute_code": string;
    "kreta:institute_user_id": number;
    "kreta:school_year_id": number;
    "kreta:tutelary_id": number;
    role: string;
}
