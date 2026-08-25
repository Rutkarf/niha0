import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { onboardingGuard } from './onboarding.guard';
import { ProfessionalWorkspaceService } from '../workspace/professional-workspace.service';

describe('onboardingGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('redirects incomplete onboarding away from AI Office', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ProfessionalWorkspaceService,
          useValue: {
            hydrate: async () => undefined,
            profile: () => ({ onboardingStatus: 'IN_PROGRESS' }),
          },
        },
      ],
    });

    const result = await TestBed.runInInjectionContext(() =>
      onboardingGuard({} as never, { url: '/app/ai-office' } as never),
    );

    expect(String(result)).toContain('onboarding');
  });

  it('allows completed onboarding', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ProfessionalWorkspaceService,
          useValue: {
            hydrate: async () => undefined,
            profile: () => ({ onboardingStatus: 'COMPLETED' }),
          },
        },
      ],
    });

    const result = await TestBed.runInInjectionContext(() =>
      onboardingGuard({} as never, { url: '/app/ai-office' } as never),
    );

    expect(result).toBe(true);
  });
});
