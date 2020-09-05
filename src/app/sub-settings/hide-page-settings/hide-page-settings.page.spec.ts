import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";

import { HidePageSettingsPage } from "./hide-page-settings.page";

describe("HidePageSettingsPage", () => {
    let component: HidePageSettingsPage;
    let fixture: ComponentFixture<HidePageSettingsPage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HidePageSettingsPage],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(HidePageSettingsPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
