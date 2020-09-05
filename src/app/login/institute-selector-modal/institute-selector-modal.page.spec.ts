import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";

import { InstituteSelectorModalPage } from "./institute-selector-modal.page";

describe("InstituteSelectorModalPage", () => {
    let component: InstituteSelectorModalPage;
    let fixture: ComponentFixture<InstituteSelectorModalPage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [InstituteSelectorModalPage],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(InstituteSelectorModalPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
