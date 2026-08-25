import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { FeedbackCategory } from '../../core/api/api.models';
import { mapHttpError } from '../../core/api/http-error.util';

@Component({
  selector: 'app-feedback-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/settings" class="back-ao">← Paramètres</a>
          <h1>Feedback</h1>
          <p>Signalez un bug, proposez une fonctionnalité ou un commentaire billing.</p>
        </div>
      </header>

      <form class="card feedback-form" (ngSubmit)="submit()">
        <label class="label">
          Catégorie
          <select class="input" [(ngModel)]="category" name="category">
            <option value="BUG">Bug</option>
            <option value="FEATURE">Fonctionnalité</option>
            <option value="BILLING">Facturation</option>
            <option value="OTHER">Autre</option>
          </select>
        </label>
        <label class="label">
          Message
          <textarea class="input" rows="5" [(ngModel)]="message" name="message" required maxlength="4000"></textarea>
        </label>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        @if (ok()) {
          <p class="ok" role="status">{{ ok() }}</p>
        }
        <button type="submit" class="btn btn-primary" [disabled]="saving() || !message.trim()">
          {{ saving() ? 'Envoi…' : 'Envoyer' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .feedback-form { max-width: 520px; padding: 1.15rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; }
    .error { color: var(--accent-danger); margin: 0; }
    .ok { color: var(--accent-success); margin: 0; }
  `],
})
export class FeedbackPage {
  private readonly api = inject(ApiService);
  category: FeedbackCategory = 'OTHER';
  message = '';
  readonly saving = signal(false);
  readonly error = signal('');
  readonly ok = signal('');

  async submit(): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    this.ok.set('');
    try {
      await firstValueFrom(this.api.submitFeedback({ category: this.category, message: this.message.trim() }));
      this.ok.set('Merci — votre message a été enregistré.');
      this.message = '';
    } catch (err) {
      this.error.set(mapHttpError(err, 'Envoi impossible'));
    } finally {
      this.saving.set(false);
    }
  }
}
