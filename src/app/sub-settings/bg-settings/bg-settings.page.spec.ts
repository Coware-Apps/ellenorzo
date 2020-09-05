import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";

import { BgSettingsPage } from "./bg-settings.page";

describe("BgSettingsPage", () => {
    let component: BgSettingsPage;
    let fixture: ComponentFixture<BgSettingsPage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [BgSettingsPage],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(BgSettingsPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
