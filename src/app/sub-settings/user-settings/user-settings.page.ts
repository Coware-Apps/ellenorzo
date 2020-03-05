import { Component, OnInit } from '@angular/core';
import { UserManagerService } from 'src/app/_services/user-manager.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.page.html',
  styleUrls: ['./user-settings.page.scss'],
})
export class UserSettingsPage implements OnInit {

  constructor(
    public userManager: UserManagerService,
    
    private router: Router,
  ) { }

  ngOnInit() {
  }

  public addUser() {
    this.router.navigateByUrl("/login");
  }

}
