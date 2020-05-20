import { Component, OnInit } from '@angular/core';
import { KretaService } from 'src/app/_services/kreta.service';
import { ModalController } from '@ionic/angular';
import { Institute } from 'src/app/_models/institute';
import { DataService } from 'src/app/_services/data.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { DiacriticsHelper } from 'src/app/_helpers/diacritics-helper';
import { KretaError } from 'src/app/_exceptions/kreta-exception';

@Component({
  selector: 'app-institute-selector-modal',
  templateUrl: './institute-selector-modal.page.html',
  styleUrls: ['./institute-selector-modal.page.scss'],
})
export class InstituteSelectorModalPage implements OnInit {

  public componentState: "loaded" | "empty" | "error" | "loading" = "loading";
  public institutes: Institute[];
  public filteredInstitutes: Institute[];
  public error: KretaError;

  constructor(
    private kreta: KretaService,
    private modalController: ModalController,
    private data: DataService,
    private firebase: FirebaseX,
    private diacriticsHelper: DiacriticsHelper,
  ) { }

  async ngOnInit() {
    this.firebase.setScreenName('institute-selector-modal');
    this.loadData();
  }

  async loadData(forceRefresh: boolean = false, event?) {
    try {
      this.institutes = await this.kreta.getInstituteList();
      this.filteredInstitutes = this.institutes;
      this.componentState = 'loaded';
    } catch (error) {
      console.error(error);
      this.error = error;

      if (!this.institutes) {
        this.componentState = 'error';
        error.isHandled = true;
      } else {
        this.componentState = 'loaded'
      }
      throw error;
    } finally {
      if (event) event.target.complete();
    }
  }

  doRefresh(event?) {
    this.componentState = 'loading';
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
            .removeDiacritics(x.Name.toLocaleLowerCase())
            .includes(search) ||
          this.diacriticsHelper
            .removeDiacritics(x.City.toLocaleLowerCase())
            .includes(search) ||
          x.InstituteCode.includes(search)
      );

  }

  onSelectionChange(instituteCode: string) {
    const selected = this.institutes.find(x => x.InstituteCode == instituteCode);
    this.data.setData("institute", selected);
    this.modalController.dismiss({ selectedInstitute: selected });
  }
}
