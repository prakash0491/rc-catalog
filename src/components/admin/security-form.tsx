import { Secret } from 'otpauth';
import { submitSecurity } from '@/lib/auth/admin-security-actions';
export function SecurityForm({mode,error}:{mode:'enroll'|'change'|'recover';error:boolean}) {
  const secret = mode === 'enroll' ? new Secret({size:20}).base32 : '';
  return <form action={submitSecurity} className="mx-auto my-12 grid max-w-md gap-5 rounded-2xl bg-white p-8 text-slate-900 shadow">
    <h1 className="text-2xl font-bold">{secret ? 'Connect authenticator' : mode === 'recover' ? 'Reset admin password' : 'Change admin password'}</h1>
    {error && <p role="alert">Unable to verify. Wait 30 seconds and try a fresh code.</p>}
    <input type="hidden" name="mode" value={mode}/>
    {secret && <label>Add this time-based setup key to your authenticator under VISH GARAGE<input className="block w-full font-mono" readOnly name="secret" value={secret}/></label>}
    {mode === 'recover' ? <label>Admin email<input className="block border" required type="email" name="email"/></label> : <label>Current password<input className="block border" required type="password" name="current" autoComplete="current-password"/></label>}
    <label>Authenticator code<input className="block border" required name="code" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code"/></label>
    {!secret && <label>New password (12 characters minimum)<input className="block border" required type="password" name="password" autoComplete="new-password" minLength={12}/></label>}
    <button className="rounded-lg bg-slate-950 p-3 text-white">Verify and save</button></form>;
}
