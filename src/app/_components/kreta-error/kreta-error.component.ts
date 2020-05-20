import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { KretaError, KretaNetworkError } from 'src/app/_exceptions/kreta-exception';

@Component({
  selector: 'app-kreta-error',
  templateUrl: './kreta-error.component.html',
  styleUrls: ['./kreta-error.component.scss'],
})
export class KretaErrorComponent implements OnInit {
  @Input() public error: KretaError;
  @Input() public iconName: string = "bug-outline";
  @Input() public buttonText: string = "Újra";

  @Output() retry: EventEmitter<void> = new EventEmitter<void>();

  constructor() { }

  ngOnInit() {
    this.iconName = this.error instanceof KretaNetworkError ? "wifi-outline" : "bug-outline";
  }
}
