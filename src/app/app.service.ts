import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Report } from './app.models';

@Injectable({providedIn: 'root'})
export class AppService {
  constructor(private httpClient: HttpClient) { }

  getQuestionsData() {
    return this.httpClient.get<Report>('/assets/data.json');
  }

}
