import { Component, OnInit } from "@angular/core";
import { KretaService } from "src/app/_services/kreta.service";
import { ModalController, Platform } from "@ionic/angular";
import { Institute } from "src/app/_models/institute";
import { DataService } from "src/app/_services/data.service";
import { DiacriticsHelper } from "src/app/_helpers/diacritics-helper";
import { KretaError } from "src/app/_exceptions/kreta-exception";
import { FirebaseService } from "src/app/_services/firebase.service";
import { KretaV3Service } from "src/app/_services";

@Component({
    selector: "app-institute-selector-modal",
    templateUrl: "./institute-selector-modal.page.html",
    styleUrls: ["./institute-selector-modal.page.scss"],
})
export class InstituteSelectorModalPage implements OnInit {
    public componentState: "loaded" | "empty" | "error" | "loading" = "loading";
    public institutes: Institute[];
    public filteredInstitutes: Institute[];
    public error: KretaError;

    constructor(
        private kretaV3: KretaV3Service,
        private modalController: ModalController,
        private data: DataService,
        private firebase: FirebaseService,
        private diacriticsHelper: DiacriticsHelper,
        public platform: Platform
    ) {}

    async ngOnInit() {
        this.firebase.setScreenName("institute-selector-modal");
        this.loadData();
    }

    async loadData(forceRefresh: boolean = false, event?) {
        try {
            this.institutes = await this.kretaV3.getInstituteList();
            this.filteredInstitutes = this.institutes;
            this.componentState = "loaded";
        } catch (error) {
            console.error(error);
            this.error = error;

            if (!this.institutes) {
                this.componentState = "error";
                error.isHandled = true;
            } else {
                this.componentState = "loaded";
            }
            throw error;
        } finally {
            if (event) event.target.complete();
        }
    }

    doRefresh(event?) {
        this.componentState = "loading";
        this.loadData(true, event);
    }

    doFilter($event) {
        const search = this.diacriticsHelper.removeDiacritics(
            $event.target.value.toLocaleLowerCase()
        );

        if (this.institutes)
            this.filteredInstitutes = this.institutes.filter(
                x =>
                    this.diacriticsHelper
                        .removeDiacritics(x.name.toLocaleLowerCase())
                        .includes(search) ||
                    this.diacriticsHelper
                        .removeDiacritics(x.city.toLocaleLowerCase())
                        .includes(search) ||
                    x.instituteCode.includes(search)
            );
    }

    onSelectionChange(instituteCode: string) {
        const selected = this.institutes.find(x => x.instituteCode == instituteCode);
        this.data.setData("institute", selected);
        this.modalController.dismiss({ selectedInstitute: selected });
    }

    dismiss() {
        this.modalController.dismiss();
    }
}
