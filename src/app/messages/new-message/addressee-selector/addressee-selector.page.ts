import { Component, OnInit } from "@angular/core";
import { AddresseeType } from "src/app/_models/_administration/addresseeType";
import { UserManagerService } from "src/app/_services/user-manager.service";
import { PromptService } from "src/app/_services/prompt.service";
import { DataService } from "src/app/_services/data.service";
import { Router } from "@angular/router";
import {
  AddresseeListItem,
  StudentAddresseeListItem,
  ParentAddresseeListItem,
  UniversalAddresseeListItem,
  instanceOfAddresseeListItem,
  instanceOfStudentAddresseeListItem,
  instanceOfParentAddresseeListItem,
} from "src/app/_models/_administration/addresseeListItem";
import { ThemeService } from "src/app/_services/theme.service";
import { AddresseeGroup } from "src/app/_models/_administration/adresseeGroup";
import { TranslateService } from "@ngx-translate/core";
import { DiacriticsHelper } from "src/app/_helpers/diacritics-helper";

@Component({
  selector: "app-addressee-selector",
  templateUrl: "./addressee-selector.page.html",
  styleUrls: ["./addressee-selector.page.scss"],
})
export class AddresseeSelectorPage implements OnInit {
  public sans: boolean = true;
  public addresseeTypes: AddresseeType[];
  public displayAddresseeList: UniversalAddresseeListItem[] = [];
  public finalAddresseeList: UniversalAddresseeListItem[] = [];
  public filteredAddresseeList: UniversalAddresseeListItem[] = [];
  public classes: AddresseeGroup[] = [];
  public groups: AddresseeGroup[] = [];
  public displayGroups: AddresseeGroup[];
  public showSearchbar = false;
  public currentCategory: string;
  public currentClassId: number;
  public currentGroupId: number;
  public filter: string;
  public addresseeTypesToSend: AddresseeType[] = [
    {
      azonosito: 1,
      kod: "GONDVISELO",
      rovidNev: "Gondviselő",
      nev: "Gondviselő",
      leiras: "Gondviselő",
    },
    {
      azonosito: 2,
      kod: "TANULO",
      rovidNev: "Tanuló",
      nev: "Tanuló",
      leiras: "Tanuló",
    },
    {
      azonosito: 3,
      kod: "OSZTALY_SZULO",
      rovidNev: "Osztály - Szülő",
      nev: "Osztály - Szülő",
      leiras: "Osztály - Szülő",
    },
    {
      azonosito: 4,
      kod: "OSZTALY_TANULO",
      rovidNev: "Osztály - Tanuló",
      nev: "Osztály - Tanuló",
      leiras: "Osztály - Tanuló",
    },
    {
      azonosito: 5,
      kod: "TANORAICSOPORT_SZULO",
      rovidNev: "Tanórai csoport - Szülő",
      nev: "Tanórai csoport - Szülő",
      leiras: "Tanórai csoport - Szülő",
    },
    {
      azonosito: 6,
      kod: "TANORAICSOPORT_TANULO",
      rovidNev: "Tanórai csoport - Tanuló",
      nev: "Tanórai csoport - Tanuló",
      leiras: "Tanórai csoport - Tanuló",
    },
    {
      azonosito: 7,
      kod: "IGAZGATOSAG",
      rovidNev: "Igazgatóság",
      nev: "Igazgatóság",
      leiras: "Igazgatóság",
    },
    {
      azonosito: 8,
      kod: "OSZTALYFONOK",
      rovidNev: "Osztályfőnök",
      nev: "Osztályfőnök",
      leiras: "Osztályfőnök",
    },
    {
      azonosito: 9,
      kod: "TANAR",
      rovidNev: "Tanár",
      nev: "Tanár",
      leiras: "Tanár",
    },
    {
      azonosito: 10,
      kod: "ADMIN",
      rovidNev: "Adminisztrátor",
      nev: "Adminisztrátor",
      leiras: "Adminisztrátor",
    },
    {
      azonosito: 11,
      kod: "SZMK_KEPVISELO",
      rovidNev: "SZMK képviselő",
      nev: "SZMK képviselő",
      leiras: "SZMK képviselő",
    },
  ];
  //Let's just shoot the person who invented this
  /** Connects the addressee types */
  public addresseeTypeBridge = {
    //TANAROK -> TANAR
    1: 9,
    //OSZTALYFONOKOK -> OSZTALYFONOK
    2: 8,
    //IGAZGATOSAG -> IGAZGATOSAG
    3: 7,
    //GONDVISELOK -> GONDVISELO
    4: 1,
    //TANULOK -> TANULO
    5: 2,
    //ADMINISZTRATOROK -> ADMIN
    6: 10,
    //SZMK_KEPVISELOK -> SZMK_KEPVISELO
    7: 11,
  };
  public codeRequestDict = {
    TANAROK: "teachers",
    OSZTALYFONOKOK: "headTeachers",
    IGAZGATOSAG: "directorate",
    GONDVISELOK: "tutelaries",
    TANULOK: "students",
    ADMINISZTRATOROK: "admins",
    SZMK_KEPVISELOK: "szmk",
  };
  constructor(
    private usermanager: UserManagerService,
    private prompt: PromptService,
    private dataService: DataService,
    private router: Router,
    private theme: ThemeService,
    private translator: TranslateService,
    private diacriticsHelper: DiacriticsHelper
  ) { }

  async ngOnInit() {
    this.addresseeTypes = await this.usermanager.currentUser.getAddresseeTypeList();
    if (this.addresseeTypes[0] != null) {
      this.currentCategory = this.addresseeTypes[0].kod;
      this.categoryChanged({ detail: { value: this.addresseeTypes[0].kod } });
    }
    this.sans = false;
  }
  ionViewDidEnter() {
    if (this.dataService.getData("currentAddresseeList") != null) {
      this.finalAddresseeList = this.dataService.getData(
        "currentAddresseeList"
      );
      this.finalAddresseeList.forEach((f) => {
        for (let i = 0; i < this.displayAddresseeList.length; i++) {
          if (this.displayAddresseeList[i].kretaAzonosito == f.kretaAzonosito) {
            this.displayAddresseeList[i].isAdded = f.isAdded;
          }
        }
      });
      if (this.filter != null) {
        this.filteredAddresseeList = this.displayAddresseeList.filter((x) =>
          this.diacriticsHelper
            .removeDiacritics(this.getName(x).toLowerCase())
            .includes(
              this.diacriticsHelper.removeDiacritics(this.filter.toLowerCase())
            )
        );
      } else {
        this.filteredAddresseeList = this.displayAddresseeList;
      }
    }
  }
  async categoryChanged(event) {
    let toCategory = event.detail.value;
    if (this.codeRequestDict[toCategory] != null) {
      this.sans = true;
      if (toCategory != "GONDVISELOK" && toCategory != "TANULOK") {
        try {
          let list = await this.usermanager.currentUser.getAddresseListByCategory(
            this.codeRequestDict[toCategory]
          );
          await this.loadAddressees(list);
        } catch (error) {
          throw error;
        } finally {
          this.sans = false;
        }
      } else {
        this.loadAddressees([]);
        this.filter = null;
        this.doFilter({ target: { value: null } });
        this.showSearchbar = false;
        try {
          this.classes = await this.usermanager.currentUser.getAddresseeGroups(
            toCategory,
            "classes"
          );
          this.groups = await this.usermanager.currentUser.getAddresseeGroups(
            toCategory,
            "groups"
          );
          this.displayGroups = this.groups.filter(
            (g) => !g.osztalyKretaAzonosito
          );
        } catch (error) {
          throw error;
        } finally {
          this.sans = false;
        }
      }
    } else {
      this.prompt.toast(
        this.translator.instant("pages.addressee-selector.categoryErrorText"),
        true
      );
    }
  }
  async subCategoryChanged(subCategoryName: "byClasses" | "byGroups", event) {
    let toSubCategory = event.detail.value;
    if (subCategoryName == "byClasses") {
      this.currentGroupId = null;
      this.displayGroups = this.groups.filter(
        (g) => g.osztalyKretaAzonosito == toSubCategory
      );
      let list = await this.usermanager.currentUser.getStudentsOrParents(
        this.codeRequestDict[this.currentCategory],
        "byClasses",
        toSubCategory
      );
      await this.loadAddressees(list);
    } else {
      this.sans = true;
      try {
        let list = await this.usermanager.currentUser.getStudentsOrParents(
          this.codeRequestDict[this.currentCategory],
          subCategoryName,
          toSubCategory
        );
        console.log(list);
        await this.loadAddressees(list);
      } catch (error) {
        throw error;
      } finally {
        this.sans = false;
      }
    }
  }
  private async loadAddressees(list: UniversalAddresseeListItem[]) {
    if (list != null) {
      for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < this.finalAddresseeList.length; j++) {
          if (
            list[i].kretaAzonosito == this.finalAddresseeList[j].kretaAzonosito
          ) {
            list[i].isAdded = true;
          }
        }
      }
      this.displayAddresseeList = list;
      if (this.filter != null) {
        this.filteredAddresseeList = this.displayAddresseeList.filter((x) =>
          this.diacriticsHelper
            .removeDiacritics(this.getName(x).toLowerCase())
            .includes(
              this.diacriticsHelper.removeDiacritics(this.filter.toLowerCase())
            )
        );
      } else {
        this.filteredAddresseeList = this.displayAddresseeList;
      }
    }
  }
  getName(a) {
    if (instanceOfAddresseeListItem(a)) {
      return a.nev;
    } else if (instanceOfParentAddresseeListItem(a)) {
      return a.gondviseloNev;
    } else if (instanceOfStudentAddresseeListItem(a)) {
      return a.vezetekNev + " " + a.keresztNev;
    }
  }
  addOrRemoveAddressee(a: AddresseeListItem) {
    a.isAdded = a.isAdded == true ? false : true;
    let typeId;
    this.addresseeTypes.forEach((at) => {
      if (at.kod == this.currentCategory) {
        typeId = at.azonosito;
      }
    });
    this.addresseeTypesToSend.forEach((atts) => {
      if (atts.azonosito == this.addresseeTypeBridge[typeId]) {
        a.tipus = {
          azonosito: atts.azonosito,
          kod: atts.kod,
          leiras: atts.leiras,
          nev: atts.nev,
          rovidNev: atts.rovidNev,
        };
      }
    });
    for (let i = 0; i < this.filteredAddresseeList.length; i++) {
      if (this.filteredAddresseeList[i].kretaAzonosito == a.kretaAzonosito) {
        this.filteredAddresseeList[i].isAdded = a.isAdded;
      }
    }
    if (a.isAdded) {
      this.finalAddresseeList.push(a);
    } else {
      for (let i = 0; i < this.finalAddresseeList.length; i++) {
        if (this.finalAddresseeList[i].kretaAzonosito == a.kretaAzonosito) {
          this.finalAddresseeList.splice(
            this.finalAddresseeList.indexOf(this.finalAddresseeList[i]),
            1
          );
        }
      }
    }
    this.dataService.setData("currentAddresseeList", this.finalAddresseeList);
  }
  selectOrRemoveAllFromCategory(categoryId: string) {
    for (let i = 0; i < this.addresseeTypes.length; i++) {
      if (categoryId == this.addresseeTypes[i].kod) {
        if (this.addresseeTypes[i].allSelected == true) {
          this.addresseeTypes[i].allSelected = false;
          let allIds = [];
          for (let j = 0; j < this.displayAddresseeList.length; j++) {
            allIds.push(this.displayAddresseeList[j].kretaAzonosito);
            this.displayAddresseeList[j].isAdded = false;
          }
          allIds.forEach((id) => {
            for (let k = 0; k < this.finalAddresseeList.length; k++) {
              if (this.finalAddresseeList[k].kretaAzonosito == id) {
                this.finalAddresseeList.splice(
                  this.finalAddresseeList.indexOf(this.finalAddresseeList[k])
                );
              }
            }
          });
          for (let k = 0; k < this.filteredAddresseeList.length; k++) {
            this.filteredAddresseeList[k].isAdded = false;
          }
        } else {
          this.addresseeTypes[i].allSelected = true;
          for (let j = 0; j < this.displayAddresseeList.length; j++) {
            let doesInclude = false;
            this.finalAddresseeList.forEach(a => {
              if (a.kretaAzonosito == this.displayAddresseeList[j].kretaAzonosito) {
                doesInclude = true;
              }
            });
            console.log(
              "does it include",
              doesInclude
            );
            if (
              !doesInclude
            ) {
              this.finalAddresseeList.push(this.displayAddresseeList[j]);
            }
            this.displayAddresseeList[i].isAdded = true;
          }
          for (let j = 0; j < this.filteredAddresseeList.length; j++) {
            this.filteredAddresseeList[j].isAdded = true;
          }
          this.addresseeTypes[i].allSelected = true;
        }
      }
    }
    this.dataService.setData("currentAddresseeList", this.finalAddresseeList);
  }
  isAllSelectedFromCategory(categoryId: string) {
    if (this.addresseeTypes) {
      for (let i = 0; i < this.addresseeTypes.length; i++) {
        if (categoryId == this.addresseeTypes[i].kod) {
          return this.addresseeTypes[i].allSelected == true ? true : false;
        }
      }
    }
  }
  getFinalAddresseeString() {
    let returnval = "";
    for (let i = 0; i < this.finalAddresseeList.length; i++) {
      let e = this.finalAddresseeList[i];

      if (i != this.finalAddresseeList.length - 1) {
        returnval += this.getName(e) + ", ";
      } else if (i == 10) {
        returnval += "...";
        break;
      } else {
        returnval += this.getName(e);
      }
    }
    if (returnval.length > 30) {
      return returnval.substring(0, 30) + "...";
    } else {
      return returnval;
    }
  }
  listAddressees() {
    this.router.navigateByUrl("messages/list-addressees");
  }
  doFilter($event) {
    this.filteredAddresseeList = this.displayAddresseeList.filter((x) => {
      if ($event.target.value) {
        return this.diacriticsHelper
          .removeDiacritics(this.getName(x).toLowerCase())
          .includes(
            this.diacriticsHelper.removeDiacritics(
              $event.target.value.toLowerCase()
            )
          );
      } else return true;
    });
  }
  goBack() {
    this.router.navigateByUrl("messages/new-message");
  }
}
