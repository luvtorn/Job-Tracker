'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import { useTranslations } from 'next-intl';

type VacancyFormData = {
  title: string;
  company: string;
  location: string;
  position: string;
  description: string;
  requirements: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
};

const emptyFormData: VacancyFormData = {
  title: '', company: '', location: '', position: '', description: '',
  requirements: '', salaryMin: '', salaryMax: '', currency: 'USD',
};

export function CreateVacancyForm({ vacancyId }: { vacancyId?: string }) {
  const t = useTranslations('vacancyUi');
  const common = useTranslations('common');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(Boolean(vacancyId));
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<VacancyFormData>(emptyFormData);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
      };

      const response = await fetch(vacancyId ? `/api/vacancies/${vacancyId}` : '/api/vacancies', {
        method: vacancyId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError(vacancyId ? t('updateFailed') : t('createFailed'));
        return;
      }

      router.push('/vacancies');
    } catch (err) {
      console.error('Failed to save vacancy:', err);
      setError(t('unexpected'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return <div className="flex justify-center py-12"><Loader className="animate-spin text-primary-600" size={24} /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title and Company */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('jobTitle')} *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('titlePlaceholder')}
              required
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('company')} *
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder={t('companyPlaceholder')}
              required
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Location and Position */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('location')} *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder={t('locationPlaceholder')}
              required
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('positionType')}
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder={t('positionPlaceholder')}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Salary Range */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('salaryMin')}
            </label>
            <input
              type="number"
              name="salaryMin"
              value={formData.salaryMin}
              onChange={handleChange}
              placeholder="50000"
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('salaryMax')}
            </label>
            <input
              type="number"
              name="salaryMax"
              value={formData.salaryMax}
              onChange={handleChange}
              placeholder="100000"
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('currency')}
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('description')} *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('descriptionPlaceholder')}
            required
            rows={6}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('requirements')}
          </label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            placeholder={t('requirementsPlaceholder')}
            rows={4}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader size={18} className="animate-spin" />
                {vacancyId ? t('saving') : t('creating')}
              </>
            ) : (
              vacancyId ? t('saveChanges') : t('createVacancy')
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium transition-colors"
          >
            {common('cancel')}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
