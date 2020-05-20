import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-empty',
  templateUrl: './empty.component.html',
  styleUrls: ['./empty.component.scss'],
})
export class EmptyComponent implements OnInit {
  @Input() icon: string = "filter-outline";
  @Input() iconSrc: string;
  @Input() translatorKey: string = "components.empty.text";

  constructor() { }

  ngOnInit() { }

}
