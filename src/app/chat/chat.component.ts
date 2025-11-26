import { Component } from '@angular/core';
import { ApiService } from '../api.service';
// import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent {
  messages: any[] = [];
  query: string = '';
  session_id: string | null = null;
  uploading = false;

  constructor(private api: ApiService) {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.uploading = true;

    this.api.uploadPdf(file).subscribe({
      next: (res) => {
        this.session_id = res.session_id;
        this.messages.push({ role: 'system', text: 'PDF uploaded. Session ready.' });
        this.uploading = false;
      },
      error: () => {
        this.messages.push({ role: 'system', text: 'Upload failed.' });
        this.uploading = false;
      }
    });
  }

  sendMessage() {
    if (!this.query.trim()) return;

    this.messages.push({ role: 'user', text: this.query });

    this.api.chat(this.query, this.session_id).subscribe({
      next: (res) => {
        this.messages.push({
          role: 'assistant',
          text: res.answer || 'No response'
        });
      },
      error: () => {
        this.messages.push({ role: 'assistant', text: 'Error occurred.' });
      }
    });

    this.query = '';
  }
}
