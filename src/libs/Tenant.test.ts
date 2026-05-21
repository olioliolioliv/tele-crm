import { describe, expect, it, vi } from 'vitest';

import { requireTenant, tenantContext } from '@/libs/Tenant';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// eslint-disable-next-line import/first
import { auth } from '@clerk/nextjs/server';

describe('requireTenant', () => {
  it('returns tenantId and userId when both present', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      userId: 'user_1',
      orgId: 'org_1',
    } as Awaited<ReturnType<typeof auth>>);

    await expect(requireTenant()).resolves.toEqual({
      tenantId: 'org_1',
      userId: 'user_1',
    });
  });

  it('throws when no userId', async () => {
    vi.mocked(auth).mockResolvedValueOnce(
      {} as Awaited<ReturnType<typeof auth>>,
    );

    await expect(requireTenant()).rejects.toThrow('Not authenticated');
  });

  it('throws when userId present but no orgId', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      userId: 'user_1',
    } as Awaited<ReturnType<typeof auth>>);

    await expect(requireTenant()).rejects.toThrow('No active organization');
  });
});

describe('tenantContext', () => {
  it('returns tenantId when provided', () => {
    expect(tenantContext('org_xyz')).toEqual({ tenantId: 'org_xyz' });
  });

  it('throws on empty', () => {
    expect(() => tenantContext('')).toThrow('tenantId is required');
  });
});
