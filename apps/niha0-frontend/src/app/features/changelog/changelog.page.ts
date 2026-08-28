import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHANGELOG_ENTRIES } from './changelog.content';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';

@Component({
  selector: 'app-changelog-page',
  imports: [RouterLink, FeaturePageHeaderComponent],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Système"
        title="Journal des versions"
        backLabel="← AI Office"
      />

      @for (entry of entries; track entry.version) {
        <section class="feature-hub card changelog-entry">
          <header>
            <h2>v{{ entry.version }}</h2>
            <time>{{ entry.date }}</time>
          </header>
          @for (section of entry.sections; track section.title) {
            <div class="section">
              <h3>{{ section.title }}</h3>
              <ul>
                @for (item of section.items; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .changelog-entry { max-width: 640px; }
    .changelog-entry header { display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 0.75rem; }
    .changelog-entry h2 { margin: 0; font-size: 1.1rem; }
    time { font-size: 0.78rem; color: var(--text-muted); }
    .section h3 { margin: 0.75rem 0 0.35rem; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
    ul { margin: 0; padding-left: 1.2rem; }
    li { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.45; margin-bottom: 0.25rem; }
  `],
})
export class ChangelogPage {
  readonly entries = CHANGELOG_ENTRIES;
}
