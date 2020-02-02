import { Component, OnInit } from '@angular/core';
import { KretaService } from 'src/app/_services/kreta.service';
import { ModalController } from '@ionic/angular';
import { Institute } from 'src/app/_models/institute';
import { Storage } from '@ionic/storage';
import { DataService } from 'src/app/_services/data.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';

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
    private storage: Storage,
    private data: DataService,
    private firebase: FirebaseX,
  ) { }

  async ngOnInit() {
    this.institutes = await this.kreta.getInstituteList();
    this.filteredInstitutes = this.institutes;
    this.firebase.setScreenName('institute-selector-modal');
  }
  ngOnDestroy(): void { }

  doFilter($event) {
    if (this.institutes)
      this.filteredInstitutes = this.institutes
        .filter(x => x.Name.toLowerCase().includes($event.target.value.toLowerCase()));
  }

  onSelectionChange(instituteCode: string) {
    const selected = this.institutes.find(x => x.InstituteCode == instituteCode);
    this.kreta.institute = selected;
    this.data.setData("institute", selected);
    this.modalController.dismiss({ selectedInstitute: selected });
  }
}
