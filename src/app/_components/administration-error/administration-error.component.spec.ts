import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";

import { AdministrationErrorComponent } from "./administration-error.component";

describe("AdministrationErrorComponent", () => {
    let component: AdministrationErrorComponent;
    let fixture: ComponentFixture<AdministrationErrorComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AdministrationErrorComponent],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(AdministrationErrorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
