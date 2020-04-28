import { Component, OnInit } from '@angular/core';
import { KretaService } from 'src/app/_services/kreta.service';
import { ModalController } from '@ionic/angular';
import { Institute } from 'src/app/_models/institute';
import { Storage } from '@ionic/storage';
import { DataService } from 'src/app/_services/data.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { ThemeService } from 'src/app/_services/theme.service';
import { DiacriticsHelper } from 'src/app/_helpers/diacritics-helper';

@Component({
  selector: 'app-institute-selector-modal',
  templateUrl: './institute-selector-modal.page.html',
  styleUrls: ['./institute-selector-modal.page.scss'],
})
export class InstituteSelectorModalPage implements OnInit {

  public institutes: Institute[];
  public filteredInstitutes: Institute[];

  constructor(
    private kreta: KretaService,
    private modalController: ModalController,
    private data: DataService,
    private firebase: FirebaseX,
    private statusBar: StatusBar,
    private theme: ThemeService,
    private diacriticsHelper: DiacriticsHelper,
  ) { }

  async ngOnInit() {
    this.statusBar.backgroundColorByHexString("#3880ff");
    this.institutes = await this.kreta.getInstituteList();
    this.filteredInstitutes = this.institutes;
    this.firebase.setScreenName('institute-selector-modal');
  }
  ngOnDestroy(): void { }

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
    this.theme.styleStatusBarToTheme();
    this.modalController.dismiss({ selectedInstitute: selected });
  }
}
