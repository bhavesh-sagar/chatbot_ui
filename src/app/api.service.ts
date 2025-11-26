import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  base = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  uploadPdf(file: File): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(`${this.base}/upload_pdf`, form);
  }

  chat(query: string, session_id?: string | null): Observable<any> {
    return this.http.post(`${this.base}/chat`, {
      query,
      session_id
    });
  }

}
