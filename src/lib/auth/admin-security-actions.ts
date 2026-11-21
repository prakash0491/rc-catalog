'use server';
import { createHash } from 'node:crypto';
import { CompactEncrypt, compactDecrypt } from 'jose';
import { TOTP } from 'otpauth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminSessionFromCookieStore } from '@/lib/auth/session';
import { hashAdminPassword, verifyAdminPassword } from '@/lib/auth/password';

function encryptionKey() {
  const secret = process.env.ADMIN_OTP_ENCRYPTION_KEY;
  if (!secret) throw new Error('Missing admin configuration');
  return createHash('sha256').update('authenticator-storage:' + secret).digest();
}
export async function submitSecurity(form: FormData) {
  const mode = String(form.get('mode'));
  const recovery = mode === 'recover';
  const failure = recovery ? '/admin/recover?error=1' : '/admin/security?error=1';
  const session = recovery ? null : await getAdminSessionFromCookieStore();
  if (!recovery && !session) redirect('/admin/login');
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const account = await prisma.admin.findUnique({ where: session ? { id: session.id } : { email } });
  const code = String(form.get('code'));
  if (!account || !/^\d{6}$/.test(code)) redirect(failure);
  const now = new Date();
  const attempt = await prisma.admin.updateMany({where:{id:account.id, OR:[{otpAttempt:null},{otpAttempt:{lt:new Date(+now-30000)}}]},data:{otpAttempt:now}});
  if (!attempt.count) redirect(failure);
  if (!recovery && !await verifyAdminPassword(String(form.get('current')), account.passwordHash)) redirect(failure);
  const enrollment = mode === 'enroll' && !!session && account.otpSecret === null;
  if (!enrollment && !account.otpSecret) redirect(failure);
  const key = encryptionKey();
  const secret = enrollment ? String(form.get('secret')) : new TextDecoder().decode((await compactDecrypt(account.otpSecret!, key)).plaintext);
  if (!/^[A-Z2-7]{32}$/.test(secret)) redirect(failure);
  const delta = new TOTP({secret}).validate({token:code,window:1,timestamp:+now});
  if (delta === null) redirect(failure);
  const step = Math.floor(+now/30000)+delta;
  const password = String(form.get('password') ?? '');
  if (!enrollment && (password.length < 12 || Buffer.byteLength(password)>72)) redirect(failure);
  const data = enrollment ? {otpSecret:await new CompactEncrypt(new TextEncoder().encode(secret)).setProtectedHeader({alg:'dir',enc:'A256GCM'}).encrypt(key)} : {passwordHash:await hashAdminPassword(password)};
  const saved = await prisma.admin.updateMany({where:{id:account.id,passwordHash:account.passwordHash,otpSecret:account.otpSecret,otpStep:{lt:step}},data:{...data,otpStep:step}});
  if (!saved.count) redirect(failure);
  redirect(recovery ? '/admin/login?reset=1' : '/admin/security?saved=1');
}
