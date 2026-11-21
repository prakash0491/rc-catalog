import { SecurityForm } from '@/components/admin/security-form';
export default async function Page({searchParams}:{searchParams:Promise<{error?:string}>}) {
  return <SecurityForm mode="recover" error={!!(await searchParams).error}/>;
}
