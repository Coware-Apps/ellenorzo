export interface DirtyPage {
    isDirty(): boolean;
    allowNavigationTo?: string[];
}
