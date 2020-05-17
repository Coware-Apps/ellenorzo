import { Component, OnInit, Input } from '@angular/core';
import { Note } from 'src/app/_models/student';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';
import { TranslateService } from '@ngx-translate/core';
import { PromptService } from 'src/app/_services/prompt.service';

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss'],
})
export class NoteComponent implements OnInit {
  @Input() note: Note;

  constructor(
    public fDate: FormattedDateService,

    private translator: TranslateService,
    private prompt: PromptService,
  ) { }

  ngOnInit() { }

  getLongItemText(text: string) {
    if (text.length > 100) {
      return text.substring(0, 100) + '...';
    } else {
      return text;
    }
  }

  isOpenableNeeded(text: string) {
    if (text.length > 100) {
      return this.translator.instant('pages.home.readMoreText');
    } else {
      return '';
    }
  }

  getMoreData(note: Note) {
    this.prompt.noteAlert(note);
  }
}
