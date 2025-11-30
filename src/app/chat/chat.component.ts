import { Component, ElementRef, ViewChild } from '@angular/core';
import { marked } from 'marked';
import { ApiService } from '../api.service';

type Role = 'user' | 'assistant' | 'system';

interface ChatMessage {
  role: Role;
  text: string;
  html?: string;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent {
  @ViewChild('chatBody') chatBody?: ElementRef<HTMLDivElement>;

  messages: ChatMessage[] = [];
  query = '';
  session_id: string | null = null;
  uploading = false;
  loading = false;

  constructor(private api: ApiService) {}

  private scrollToBottom() {
    setTimeout(() => {
      if (this.chatBody) {
        const el = this.chatBody.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 10);
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;
    this.uploading = true;

    this.api.uploadPdf(file).subscribe({
      next: (res) => {
        this.session_id = res.session_id;
        this.messages.push({ role: 'system', text: '📄 PDF uploaded. You can start asking questions about it.' });
        this.uploading = false;
        this.scrollToBottom();
      },
      error: () => {
        this.messages.push({ role: 'system', text: ' Upload failed' });
        this.uploading = false;
        this.scrollToBottom();
      }
    });
  }

  sendMessage() {
    if (!this.query.trim()) return;

    const question = this.query;
    this.messages.push({ role: 'user', text: question });
    this.query = '';
    this.scrollToBottom();
    this.loading = true;

    const sidForThisQuestion = this.session_id;

    this.api.chat(question, sidForThisQuestion).subscribe({
      next: (res) => {
        const full = res.answer || 'No response';
        const assistantMsg: ChatMessage = { role: 'assistant', text: '' };
        this.messages.push(assistantMsg);
        this.scrollToBottom();
        this.loading = false;
        this.typeText(assistantMsg, full);

        // Clear PDF session for next independent questions
        this.session_id = null;
      },
      error: () => {
        this.loading = false;
        this.messages.push({ role: 'assistant', text: 'Server error' });
        this.scrollToBottom();
      }
    });
  }

  private typeText(msg: ChatMessage, full: string) {
    let idx = 0;
    const chunk = 3;
    const delay = 12;

    const step = () => {
      if (idx < full.length) {
        msg.text += full.slice(idx, idx + chunk);
        idx += chunk;
        this.scrollToBottom();
        setTimeout(step, delay);
      } else {
        const parsed = marked.parse(full) as string | Promise<string>;
        if (parsed instanceof Promise) {
          parsed.then(html => {
            msg.html = html;
            this.scrollToBottom();
          });
        } else {
          msg.html = parsed;
          this.scrollToBottom();
        }
      }
    };

    step();
  }
}
