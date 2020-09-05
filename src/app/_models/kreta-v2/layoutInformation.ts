export class LayoutInformation {
    public UserMenuItem: UserMenuItem;
    public UserMenu: UserMenu;
    public MessageGadget: MessageGadget;
    public FavoriteGadget: FavoriteGadget;
    public RSSGadget: RSSGadget;
    public CalendarGadget: CalendarGadget;
    public RootObject: RootObject;
}
export interface UserMenuItem {
    Name: string;
    Url: string;
    CssClass: string;
    ClientAction: string;
}

export interface UserMenu {
    UserName: string;
    MessageCount: string;
    InboxUrl?: any;
    EventUrl?: any;
    AdminHomePageUrl: string;
    EventCount: string;
    NemNaplozottTanorakCount?: any;
    NemNaplozottTanorakUrl?: any;
    ProfilImgSrc: string;
    UserMenuItems: UserMenuItem[];
    NeedPopupId: number;
    NeedPopupAzonosito?: any;
}

export interface MessageGadget {
    Id: string;
    Title: string;
    Subtitle: any;
    ContentViewName: string;
    ContentModel: any[];
    Footer?: any;
}

export interface FavoriteGadget {
    Id: string;
    Title: string;
    Subtitle: any;
    ContentViewName: string;
    ContentModel: any[];
    Footer?: any;
}

export interface RSSGadget {
    Id: string;
    Title: string;
    Subtitle: any;
    FontentViewName: string;
    FontentModel: any[];
    Footer?: any;
}

export interface CalendarGadget {
    Id: string;
    Title: string;
    Subtitle: any;
    ContentViewName: string;
    ContentModel?: any;
    Footer?: any;
}

export interface RootObject {
    OrganizationName: string;
    IsFavoriteController: boolean;
    HomePageUrl: string;
    UserMenu: UserMenu;
    MessageGadget: MessageGadget;
    FavoriteGadget: FavoriteGadget;
    RSSGadget: RSSGadget;
    CalendarGadget: CalendarGadget;
}
