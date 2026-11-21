import { redirect } from 'next/navigation';
import { SecurityForm } from '@/components/admin/security-form';
import { getAdminSessionFromCookieStore } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
export default async function Page({searchParams}:{searchParams:Promise<{error?:string;saved?:string}>}) {
  const session = await getAdminSessionFromCookieStore();
  if (!session) redirect('/admin/login');
  const account = await prisma.admin.findUnique({where:{id:session.id},select:{otpSecret:true}});
  if (!account) redirect('/admin/login');
  const params = await searchParams;
  return <>{params.saved && <p role="status">Security settings saved.</p>}<SecurityForm mode={account.otpSecret ? 'change' : 'enroll'} error={!!params.error}/></>;
}
