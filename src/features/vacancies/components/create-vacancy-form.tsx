'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  createVacancySchema,
  VACANCY_LIMITS,
} from '@/server/validators/vacancy-validator';

type VacancyFormData = {
  title: string;
  company: string;
  location: string;
  position: string;
  description: string;
  requirements: string;
  salaryMin: string;
  salaryMax: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
};

type VacancyField = keyof VacancyFormData;
type FieldErrors = Partial<Record<VacancyField, string>>;
type ValidationResponse = {
  errors?: {
    fieldErrors?: Record<string, string[] | undefined>;
  };
};

const emptyFormData: VacancyFormData = {
  title: '',
  company: '',
  location: '',
  position: '',
  description: '',
  requirements: '',
  salaryMin: '',
  salaryMax: '',
  currency: 'USD',
};

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:ring-red-200'
      : 'border-neutral-200 focus:ring-primary-500'
  }`;

export function CreateVacancyForm({ vacancyId }: { vacancyId?: string }) {
  const t = useTranslations('vacancyUi');
  const common = useTranslations('common');
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(Boolean(vacancyId));
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<VacancyField, boolean>>>({});
  const [formData, setFormData] = useState<VacancyFormData>(emptyFormData);

  const validationMessage = (code: string) => {
    switch (code) {
      case 'vacancy.title.min': return t('titleMin');
      case 'vacancy.title.max': return t('titleMax');
      case 'vacancy.company.min': return t('companyMin');
      case 'vacancy.company.max': return t('companyMax');
      case 'vacancy.location.min': return t('locationMin');
      case 'vacancy.location.max': return t('locationMax');
      case 'vacancy.position.min': return t('positionMin');
      case 'vacancy.position.max': return t('positionMax');
      case 'vacancy.description.min': return t('descriptionMin');
      case 'vacancy.description.max': return t('descriptionMax');
      case 'vacancy.requirements.min': return t('requirementsMin');
      case 'vacancy.requirements.max': return t('requirementsMax');
      case 'vacancy.salary.positive': return t('salaryPositive');
      case 'vacancy.salary.pair': return t('salaryPair');
      case 'vacancy.salary.range': return t('salaryRange');
      case 'vacancy.currency.invalid': return t('currencyInvalid');
      default: return t('invalidField');
    }
  };

  const toPayload = (data: VacancyFormData) => ({
    ...data,
    salaryMin: data.salaryMin === '' ? undefined : Number(data.salaryMin),
    salaryMax: data.salaryMax === '' ? undefined : Number(data.salaryMax),
  });

  const validate = (data: VacancyFormData) => {
    const result = createVacancySchema.safeParse(toPayload(data));
    const nextErrors: FieldErrors = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && field in data && !nextErrors[field as VacancyField]) {
          nextErrors[field as VacancyField] = validationMessage(issue.message);
        }
      }
    }
    return { result, errors: nextErrors };
  };

  useEffect(() => {
    if (!vacancyId) return;
    const loadVacancy = async () => {
      try {
        const response = await fetch(`/api/vacancies/${vacancyId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(t('loadFailed'));
        const vacancy = data.vacancy;
        setFormData({
          title: vacancy.title,
          company: vacancy.company ?? '',
          location: vacancy.location ?? '',
          position: vacancy.position ?? '',
          description: vacancy.description,
          requirements: vacancy.requirements ?? '',
          salaryMin: vacancy.salaryMin?.toString() ?? '',
          salaryMax: vacancy.salaryMax?.toString() ?? '',
          currency: vacancy.currency,
        });
      } catch (loadError) {
        console.error('Failed to load vacancy:', loadError);
        setError(t('loadFailed'));
      } finally {
        setIsInitialLoading(false);
      }
    };
    void loadVacancy();
  }, [vacancyId, t]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const field = event.target.name as VacancyField;
    const value = event.target.value;
    const nextData = { ...formData, [field]: value };
    setFormData(nextData);
    setError('');
    if (touched[field]) {
      setFieldErrors(validate(nextData).errors);
    }
  };

  const handleBlur = (field: VacancyField) => {
    setTouched((current) => ({ ...current, [field]: true }));
    setFieldErrors(validate(formData).errors);
  };

  const applyServerErrors = (response: ValidationResponse) => {
    const nextErrors: FieldErrors = {};
    for (const [field, messages] of Object.entries(response.errors?.fieldErrors ?? {})) {
      if (field in formData && messages?.[0]) {
        nextErrors[field as VacancyField] = validationMessage(messages[0]);
      }
    }
    setFieldErrors(nextErrors);
    return nextErrors;
  };

  const focusFirstError = (errors: FieldErrors) => {
    const firstField = Object.keys(errors)[0];
    if (!firstField) return;
    formRef.current?.querySelector<HTMLElement>(`[name="${firstField}"]`)?.focus();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const validation = validate(formData);
    setTouched(Object.fromEntries(Object.keys(formData).map((field) => [field, true])));
    setFieldErrors(validation.errors);
    if (!validation.result.success) {
      focusFirstError(validation.errors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(vacancyId ? `/api/vacancies/${vacancyId}` : '/api/vacancies', {
        method: vacancyId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.result.data),
      });
      const data: ValidationResponse = await response.json();
      if (!response.ok) {
        const serverErrors = applyServerErrors(data);
        if (Object.keys(serverErrors).length > 0) {
          focusFirstError(serverErrors);
        } else {
          setError(vacancyId ? t('updateFailed') : t('createFailed'));
        }
        return;
      }
      router.push('/vacancies');
    } catch (saveError) {
      console.error('Failed to save vacancy:', saveError);
      setError(t('unexpected'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return <div className="flex justify-center py-12"><Loader className="animate-spin text-primary-600" size={24} /></div>;
  }

  const fieldError = (field: VacancyField) => fieldErrors[field];

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('jobTitle')} error={fieldError('title')} errorId="title-error">
          <input name="title" value={formData.title} onChange={handleChange} onBlur={() => handleBlur('title')} placeholder={t('titlePlaceholder')} aria-invalid={Boolean(fieldError('title'))} aria-describedby="title-error" className={inputClass(Boolean(fieldError('title')))} />
        </FormField>
        <FormField label={t('company')} error={fieldError('company')} errorId="company-error">
          <input name="company" value={formData.company} onChange={handleChange} onBlur={() => handleBlur('company')} placeholder={t('companyPlaceholder')} aria-invalid={Boolean(fieldError('company'))} aria-describedby="company-error" className={inputClass(Boolean(fieldError('company')))} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('location')} error={fieldError('location')} errorId="location-error">
          <input name="location" value={formData.location} onChange={handleChange} onBlur={() => handleBlur('location')} placeholder={t('locationPlaceholder')} aria-invalid={Boolean(fieldError('location'))} aria-describedby="location-error" className={inputClass(Boolean(fieldError('location')))} />
        </FormField>
        <FormField label={t('positionType')} error={fieldError('position')} errorId="position-error">
          <input name="position" value={formData.position} onChange={handleChange} onBlur={() => handleBlur('position')} placeholder={t('positionPlaceholder')} aria-invalid={Boolean(fieldError('position'))} aria-describedby="position-error" className={inputClass(Boolean(fieldError('position')))} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t('salaryMin')} error={fieldError('salaryMin')} errorId="salaryMin-error" required={false}>
          <input type="number" min="1" step="1" name="salaryMin" value={formData.salaryMin} onChange={handleChange} onBlur={() => handleBlur('salaryMin')} placeholder="50000" aria-invalid={Boolean(fieldError('salaryMin'))} aria-describedby="salaryMin-error" className={inputClass(Boolean(fieldError('salaryMin')))} />
        </FormField>
        <FormField label={t('salaryMax')} error={fieldError('salaryMax')} errorId="salaryMax-error" required={false}>
          <input type="number" min="1" step="1" name="salaryMax" value={formData.salaryMax} onChange={handleChange} onBlur={() => handleBlur('salaryMax')} placeholder="100000" aria-invalid={Boolean(fieldError('salaryMax'))} aria-describedby="salaryMax-error" className={inputClass(Boolean(fieldError('salaryMax')))} />
        </FormField>
        <FormField label={t('currency')} error={fieldError('currency')} errorId="currency-error">
          <select name="currency" value={formData.currency} onChange={handleChange} onBlur={() => handleBlur('currency')} aria-invalid={Boolean(fieldError('currency'))} aria-describedby="currency-error" className={inputClass(Boolean(fieldError('currency')))}>
            {(['USD', 'EUR', 'GBP', 'CAD'] as const).map((currency) => <option key={currency} value={currency}>{currency}</option>)}
          </select>
        </FormField>
      </div>

      <FormField label={t('description')} error={fieldError('description')} errorId="description-error" hint={t('characterCount', { count: formData.description.length, max: VACANCY_LIMITS.description.max })}>
        <textarea name="description" value={formData.description} onChange={handleChange} onBlur={() => handleBlur('description')} placeholder={t('descriptionPlaceholder')} rows={6} maxLength={VACANCY_LIMITS.description.max} aria-invalid={Boolean(fieldError('description'))} aria-describedby="description-error" className={inputClass(Boolean(fieldError('description')))} />
      </FormField>

      <FormField label={t('requirements')} error={fieldError('requirements')} errorId="requirements-error" hint={t('characterCount', { count: formData.requirements.length, max: VACANCY_LIMITS.requirements.max })}>
        <textarea name="requirements" value={formData.requirements} onChange={handleChange} onBlur={() => handleBlur('requirements')} placeholder={t('requirementsPlaceholder')} rows={4} maxLength={VACANCY_LIMITS.requirements.max} aria-invalid={Boolean(fieldError('requirements'))} aria-describedby="requirements-error" className={inputClass(Boolean(fieldError('requirements')))} />
      </FormField>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={isLoading} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50">
          {isLoading && <Loader size={18} className="animate-spin" />}
          {isLoading ? (vacancyId ? t('saving') : t('creating')) : (vacancyId ? t('saveChanges') : t('createVacancy'))}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-neutral-200 px-6 py-2 font-medium text-neutral-700 transition-colors hover:bg-neutral-50">{common('cancel')}</button>
      </div>
    </form>
  );
}

function FormField({ label, error, errorId, hint, required = true, children }: { label: string; error?: string; errorId: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-700">{label}{required ? ' *' : ''}</span>
      {children}
      <span className="mt-1 flex min-h-5 justify-between gap-3 text-xs">
        <span id={errorId} role={error ? 'alert' : undefined} className="text-red-600">{error}</span>
        {hint && <span className="ml-auto text-neutral-500">{hint}</span>}
      </span>
    </label>
  );
}
