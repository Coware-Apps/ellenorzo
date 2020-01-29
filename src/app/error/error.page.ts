import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthenticationService } from '../_services/authentication.service';
import { Storage } from '@ionic/storage';


@Component({
  selector: 'app-error',
  templateUrl: './error.page.html',
  styleUrls: ['./error.page.scss'],
})
export class ErrorPage implements OnInit {

  public messageText: string;
  public disabled: boolean;

  constructor(
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private router: Router,
    private authService: AuthenticationService,
    private storage: Storage,
  ) { }

  async ngOnInit() {
    this.disabled = true;
    await this.delay(5000);
    this.disabled = false;
  }


  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  } 

  async refresh() {
    this.disabled = true;
    this.authService.authenticationState.subscribe(async state => {
      if(state) {
        //authenticated (from memory)
        let x = await this.storage.get('defaultPage')

        if (x != null) {
          this.router.navigate([x]);
        }
        else {
          this.router.navigate(['']);
        }

      } else {
        //not authenticated
        if (await this.storage.get("password") != null) {
          this.authService.login();
        }
        else {
        this.router.navigate(['login']);
        }
      }
    });

    await this.delay(20000);
    this.disabled = false;
  }

}
