import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";

import { WebLoginInfoComponent } from "./web-login-info.component";

describe("WebLoginInfoComponent", () => {
    let component: WebLoginInfoComponent;
    let fixture: ComponentFixture<WebLoginInfoComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [WebLoginInfoComponent],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(WebLoginInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
