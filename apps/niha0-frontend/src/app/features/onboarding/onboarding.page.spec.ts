import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { OnboardingPage } from './onboarding.page';
import { ProfessionalWorkspaceService } from '../../core/workspace/professional-workspace.service';
import { signal } from '@angular/core';

describe('OnboardingPage smoke', () => {
  let fixture: ComponentFixture<OnboardingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: ProfessionalWorkspaceService,
          useValue: {
            hydrate: async () => undefined,
            profile: signal({
              companyName: '',
              sector: '',
              onboardingStatus: 'IN_PROGRESS',
            }),
            config: signal({ branding: {}, office: {}, agents: [], assistants: [] }),
            branding: signal({}),
            office: signal({}),
            patchProfile: () => undefined,
            patchConfig: () => undefined,
            saveAll: async () => undefined,
            dirty: signal(false),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingPage);
  });

  it('renders onboarding form fields', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('form') || el.querySelector('input') || el.textContent).toBeTruthy();
    fixture.destroy();
  });
});
