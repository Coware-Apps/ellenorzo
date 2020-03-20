import { Component, OnInit } from '@angular/core';
import { AppService } from 'src/app/_services/app.service';
import { DataService } from 'src/app/_services/data.service';
import { UserManagerService } from 'src/app/_services/user-manager.service';

@Component({
  selector: 'app-home-settings',
  templateUrl: './home-settings.page.html',
  styleUrls: ['./home-settings.page.scss'],
})
export class HomeSettingsPage implements OnInit {

  constructor(
    public app: AppService,

    private dataService: DataService,
    private userManager: UserManagerService,
  ) { }

  ngOnInit() {
  }

  change(request) {
    let newHomeRequests = this.app.homeRequests;
    for (let i = 0; i < newHomeRequests.length; i++) {
      if (newHomeRequests[i].id == request.id) {
        newHomeRequests[i].show = !request.show;
      }
    }
    this.app.homeRequests = newHomeRequests;
    this.userManager.clearAllUserCacheByCategory('combined');
    this.dataService.setData('refreshHome', true);
  }

  getKeys(obj) {
    return Object.keys(obj);
  }

}
