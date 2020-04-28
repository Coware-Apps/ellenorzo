import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/_services/data.service';
import { AddresseeListItem } from 'src/app/_models/_administration/addresseeListItem';

@Component({
  selector: 'app-list-addressees',
  templateUrl: './list-addressees.page.html',
  styleUrls: ['./list-addressees.page.scss'],
})
export class ListAddresseesPage implements OnInit {
  public currentAddresseeList: AddresseeListItem[] = [];
  constructor(
    private dataService: DataService,
  ) { }

  ngOnInit() {
    this.currentAddresseeList = this.dataService.getData('currentAddresseeList');
  }
  removeAddressee(a: AddresseeListItem) {
    a.isAdded = false;
    for (let i = 0; i < this.currentAddresseeList.length; i++) {
      if (a.kretaAzonosito == this.currentAddresseeList[i].kretaAzonosito) {
        this.currentAddresseeList.splice(this.currentAddresseeList.indexOf(this.currentAddresseeList[i]), 1);
        this.currentAddresseeList = [...this.currentAddresseeList];
      }
    }
    this.dataService.setData('currentAddresseeList', this.currentAddresseeList);
  }
}
