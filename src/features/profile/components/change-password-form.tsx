'use client';

import { FormEvent, useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';

type ChangePasswordFormProps = {
  onChanged: () => void;
};

const isStrongPassword = (password: string) =>
  password.length >= 8
  && /[A-Z]/.test(password)
  && /[a-z]/.test(password)
  && /[0-9]/.test(password)
  && new TextEncoder().encode(password).byteLength <= 72;

export function ChangePasswordForm({ onChanged }: ChangePasswordFormProps) {
  const t = useTranslations('profileSecurity');
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!currentPassword) return setError(t('currentPasswordRequired'));
    if (!isStrongPassword(newPassword)) return setError(t('passwordRequirements'));
    if (newPassword !== confirmPassword) return setError(t('passwordsMismatch'));
    if (currentPassword === newPassword) return setError(t('passwordSame'));

    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { message?: string } | null;
        setError(data?.message === 'Current password is incorrect'
          ? t('currentPasswordIncorrect')
          : data?.message === 'New password must be different'
            ? t('passwordSame')
            : t('passwordChangeFailed'));
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(t('passwordUpdated'), 'success');
      onChanged();
    } catch {
      setError(t('passwordChangeFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100';

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-primary-50 p-2 text-primary-600"><KeyRound size={20} /></span>
        <div>
          <h3 className="font-semibold text-neutral-900">{t('passwordTitle')}</h3>
          <p className="mt-1 text-sm text-neutral-600">{t('passwordDescription')}</p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <label className="block text-sm font-medium text-neutral-700">
          {t('currentPassword')}
          <input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} disabled={isSaving} />
        </label>
        <label className="block text-sm font-medium text-neutral-700">
          {t('newPassword')}
          <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} disabled={isSaving} />
        </label>
        <label className="block text-sm font-medium text-neutral-700">
          {t('confirmPassword')}
          <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} disabled={isSaving} />
        </label>
        <p className="text-xs leading-5 text-neutral-500">{t('passwordRequirements')}</p>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          {isSaving ? t('updatingPassword') : t('updatePassword')}
        </button>
      </form>
    </section>
  );
}
