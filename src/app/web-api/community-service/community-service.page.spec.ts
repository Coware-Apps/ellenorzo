import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";

import { CommunityServicePage } from "./community-service.page";

describe("CommunityServicePage", () => {
    let component: CommunityServicePage;
    let fixture: ComponentFixture<CommunityServicePage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CommunityServicePage],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(CommunityServicePage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
