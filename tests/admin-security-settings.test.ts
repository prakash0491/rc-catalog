import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TOTP } from 'otpauth';

const db = vi.hoisted(() => ({findUnique:vi.fn(),updateMany:vi.fn(),findFirst:vi.fn()}));
vi.mock('@/lib/prisma', () => ({prisma:{admin:db,businessSettings:db}}));
vi.mock('@/lib/auth/session', () => ({getAdminSessionFromCookieStore:vi.fn().mockResolvedValue({id:'admin'})}));
vi.mock('@/lib/auth/password', () => ({verifyAdminPassword:vi.fn().mockResolvedValue(true),hashAdminPassword:vi.fn().mockResolvedValue('updated-hash')}));
vi.mock('next/navigation', () => ({redirect:(path:string) => {throw new Error(path)}}));
import {submitSecurity} from '@/lib/auth/admin-security-actions';
import {configuredDeliveryFee} from '@/lib/configured-delivery';

describe('admin settings and recovery', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('uses configured fees including free delivery and disables omitted PINs',async()=>{
    db.findFirst.mockResolvedValue({deliveryRates:'560001 0\n560002 49.50'});
    expect(await configuredDeliveryFee('560001')).toBe(0);
    expect(await configuredDeliveryFee('560002')).toBe(4950);
    expect(await configuredDeliveryFee('560003')).toBeNull();
  });
  it('requires enrollment, verifies the recovery code and consumes its time step atomically',async()=>{
    vi.stubEnv('ADMIN_OTP_ENCRYPTION_KEY','unit-test-only');
    try {
      const secret='JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
      const account={id:'admin',passwordHash:'original',otpSecret:null};
      db.findUnique.mockResolvedValue(account);
      db.updateMany.mockResolvedValue({count:1});
      const form=new FormData();
      Object.entries({mode:'enroll',secret,current:'current',code:new TOTP({secret}).generate()}).forEach(([key,value])=>form.set(key,value));
      await expect(submitSecurity(form)).rejects.toThrow('/admin/security?saved=1');
      const encrypted=db.updateMany.mock.calls[1][0].data.otpSecret;
      expect(encrypted).not.toContain(secret);
      db.findUnique.mockResolvedValue({...account,otpSecret:encrypted});
      form.set('mode','recover');form.set('email','admin@example.test');form.set('password','replacement-password');
      db.updateMany.mockResolvedValueOnce({count:1}).mockResolvedValueOnce({count:0});
      await expect(submitSecurity(form)).rejects.toThrow('/admin/recover?error=1');
      expect(db.updateMany.mock.lastCall?.[0].where.otpStep.lt).toBeTypeOf('number');
    } finally {vi.unstubAllEnvs();}
  });
});
