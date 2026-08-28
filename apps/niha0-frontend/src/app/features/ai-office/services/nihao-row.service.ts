import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { NihaoOfficeLayout, RowLayoutConfig } from '../models/row-config.model';
import { buildNihaoOfficeLayout } from '../config/row-layout';

export interface ChiefConfigDto {
  chiefId: number;
  rowId: number;
  role: string;
  chiefTitle: string;
  color: string;
  x: number;
  y: number;
  z: number;
}

@Injectable({ providedIn: 'root' })
export class NihaoRowService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/nihao/office`;

  /** Layout local (fallback si API indisponible). */
  localLayout(): NihaoOfficeLayout {
    return buildNihaoOfficeLayout();
  }

  fetchLayout(): Observable<NihaoOfficeLayout> {
    return this.http.get<NihaoOfficeLayout>(`${this.base}/layout`);
  }

  fetchRows(): Observable<RowLayoutConfig[]> {
    return this.http.get<RowLayoutConfig[]>(`${this.base}/rows`);
  }

  fetchChiefs(): Observable<ChiefConfigDto[]> {
    return this.http.get<ChiefConfigDto[]>(`${this.base}/chiefs`);
  }
}
