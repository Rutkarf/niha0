import { defaultBillingPlan, type BillingPlan } from '../../core/api/api.models';

describe('BillingPlan Settings contract', () => {
  it('defaultBillingPlan matches backend BillingPlanResponse shape', () => {
    const plan: BillingPlan = defaultBillingPlan();
    expect(plan).toEqual({
      plan: 'FREE',
      seatsUsed: 1,
      seatsLimit: 3,
      storageNote: 'Plan local stub',
      storageUsedBytes: 0,
      storageLimitBytes: 100 * 1024 * 1024,
      aiActionsUsedToday: 0,
      aiActionsLimitDaily: 20,
    });
    expect(plan).not.toHaveProperty('agentQuota');
    expect(plan).not.toHaveProperty('seats');
    expect(plan).not.toHaveProperty('storageMb');
  });

  it('allows partial overrides without dropping required fields', () => {
    const plan = defaultBillingPlan({ seatsLimit: 10, storageNote: 'Custom' });
    expect(plan.plan).toBe('FREE');
    expect(plan.seatsUsed).toBe(1);
    expect(plan.seatsLimit).toBe(10);
    expect(plan.storageNote).toBe('Custom');
  });
});
