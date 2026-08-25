import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, switchMap, catchError, of, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Agent, AgentAction } from '../api/api.models';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class AgentStatusService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private sub: Subscription | null = null;

  readonly agents = signal<Agent[]>([]);
  readonly pendingCount = signal(0);
  readonly pendingActions = signal<AgentAction[]>([]);

  start(): void {
    this.stop();
    this.refresh();
    this.sub = interval(15000)
      .pipe(switchMap(() => this.fetch$()))
      .subscribe();
  }

  stop(): void {
    this.sub?.unsubscribe();
    this.sub = null;
  }

  refresh(): void {
    this.fetch$().subscribe();
  }

  private fetch$() {
    if (!this.auth.accessToken()) return of(null);
    return this.http.get<Agent[]>(`${environment.apiUrl}/agents`).pipe(
      switchMap((agents) => {
        this.agents.set(agents.filter((a) => a.code !== 'CEO_DIRECTION'));
        return this.http.get<AgentAction[]>(`${environment.apiUrl}/approvals/pending`);
      }),
      catchError(() => of([] as AgentAction[])),
      switchMap((pending) => {
        const list = Array.isArray(pending) ? pending : [];
        this.pendingActions.set(list);
        this.pendingCount.set(list.length);
        return of(null);
      }),
    );
  }
}
