import { Component, OnInit } from '@angular/core';
import { AppService } from './app.service';
import { Report, InputType } from './app.models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  report: Report;

  constructor(private appService: AppService) { }

  ngOnInit() {
    this.appService.getQuestionsData().subscribe(report => {
      this.report = report;
    });
  }
}
