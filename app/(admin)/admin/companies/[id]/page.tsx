'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import {
  MdSave,
  MdArrowBack,
  MdDelete,
  MdDeleteForever,
  MdEdit,
} from 'react-icons/md';
import { toast } from 'sonner';
import ImageUpload from '../../components/ImageUpload';
import { useConfirm } from '../../components/DialogProvider';
import DataTable, { DataColumn } from '../../components/DataTable';
import { formatDateTime } from '@/app/utils';

interface CompanyForm {
  slug: string;
  logo: string | null;
  isActive: boolean;
  metadata: {
    locale: string;
    name: string;
    description: string;
  }[];
}

interface CompanyData {
  id: string;
  slug: string;
  logo: string | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, Record<string, string>>;
  insuranceCount: number;
}

interface InsuranceRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  featured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function CompanyEditorPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const confirm = useConfirm();
  const isEdit = !!params?.id;
  const companyId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<'en' | 'lo'>('en');
  const [company, setCompany] = useState<CompanyData | null>(null);

  const [formData, setFormData] = useState<CompanyForm>({
    slug: '',
    logo: null,
    isActive: true,
    metadata: [
      { locale: 'en', name: '', description: '' },
      { locale: 'lo', name: '', description: '' },
    ],
  });

  const fetchCompany = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`);
      const result = await res.json();
      if (result.success && result.data) {
        const c: CompanyData = result.data;
        setCompany(c);
        setFormData({
          slug: c.slug ?? '',
          logo: c.logo,
          isActive: c.isActive,
          metadata: [
            {
              locale: 'en',
              name: c.metadata?.en?.name ?? '',
              description: c.metadata?.en?.description ?? '',
            },
            {
              locale: 'lo',
              name: c.metadata?.lo?.name ?? '',
              description: c.metadata?.lo?.description ?? '',
            },
          ],
        });
      } else {
        toast.error(t('companies.editor.loadFailed'));
        router.push('/admin/companies');
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error(t('companies.editor.loadError'));
      router.push('/admin/companies');
    } finally {
      setLoading(false);
    }
  }, [isEdit, companyId, router, t]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const getCurrentMetadata = () =>
    formData.metadata.find((m) => m.locale === currentLocale) ?? {
      locale: currentLocale,
      name: '',
      description: '',
    };

  const updateMetadata = (
    locale: string,
    field: 'name' | 'description',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      metadata: prev.metadata.map((m) =>
        m.locale === locale ? { ...m, [field]: value } : m
      ),
      // Auto-fill slug on create from English name
      slug:
        !isEdit && locale === 'en' && field === 'name' && !prev.slug
          ? value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
          : prev.slug,
    }));
  };

  const handleSave = async () => {
    const enName = formData.metadata.find((m) => m.locale === 'en')?.name?.trim();
    if (!enName) {
      toast.error(t('companies.editor.englishNameRequired'));
      return;
    }
    if (!formData.slug.trim()) {
      toast.error(t('companies.editor.slugRequired'));
      return;
    }

    setSaving(true);
    try {
      if (!isEdit) {
        const res = await fetch('/api/admin/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: formData.slug,
            logo: null,
            metadata: formData.metadata.flatMap((m) => [
              { locale: m.locale, key: 'name', value: m.name },
              { locale: m.locale, key: 'description', value: m.description },
            ]),
          }),
        });
        const result = await res.json();
        if (result.success) {
          toast.success(t('companies.editor.createdSuccess'));
          router.push(`/admin/companies/${result.data.id}`);
        } else if (res.status === 409) {
          toast.error(t('companies.editor.slugInUse'));
        } else {
          toast.error(t('companies.editor.createFailed', { error: result.error || 'Unknown error' }));
        }
      } else {
        const res = await fetch(`/api/admin/companies/${companyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: formData.slug,
            metadata: formData.metadata.flatMap((m) => [
              { locale: m.locale, key: 'name', value: m.name },
              { locale: m.locale, key: 'description', value: m.description },
            ]),
          }),
        });
        const result = await res.json();
        if (result.success) {
          toast.success(t('companies.editor.updatedSuccess'));
          fetchCompany();
        } else if (res.status === 409) {
          toast.error(t('companies.editor.slugInUse'));
        } else {
          toast.error(t('companies.editor.updateFailed', { error: result.error || 'Unknown error' }));
        }
      }
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error(t('companies.editor.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUploaded = async (url: string) => {
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: url }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t('companies.editor.logoUploaded'));
        fetchCompany();
      } else {
        toast.error(t('companies.editor.logoUploadDbFailed'));
      }
    } catch (error) {
      console.error('Error updating logo:', error);
      toast.error(t('companies.editor.logoAttachError'));
    }
  };

  const handleLogoDelete = async () => {
    const ok = await confirm({
      title: t('companies.editor.removeLogoTitle'),
      description: t('companies.editor.removeLogoDescription'),
      variant: 'danger',
      confirmLabel: t('companies.editor.removeLogoConfirm'),
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/companies/${companyId}/logo`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t('companies.editor.logoRemoved'));
        fetchCompany();
      } else {
        toast.error(t('companies.deleteFailed', { error: result.error }));
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error(t('companies.editor.logoRemoveError'));
    }
  };

  const handleHardDelete = async () => {
    if (!company) return;
    if (company.insuranceCount > 0) {
      toast.error(
        t('companies.editor.cannotDeleteWithLinks', { count: company.insuranceCount })
      );
      return;
    }

    const ok = await confirm({
      title: t('companies.editor.deleteConfirmTitle'),
      description: t('companies.editor.deleteConfirmDescription'),
      variant: 'danger',
      confirmLabel: t('companies.deleteConfirmLabel'),
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t('companies.deleteSuccess'));
        router.push('/admin/companies');
      } else {
        toast.error(t('companies.deleteFailed', { error: result.error }));
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error(t('companies.deleteError'));
    }
  };

  const handleToggleActive = async () => {
    const nextState = !formData.isActive;
    const ok = await confirm({
      title: nextState
        ? t('companies.activateConfirmTitle')
        : t('companies.archiveConfirmTitle'),
      description: nextState
        ? t('companies.activateDescription')
        : t('companies.archiveDescription'),
      variant: nextState ? 'default' : 'danger',
      confirmLabel: nextState ? t('companies.activate') : t('companies.archive'),
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextState }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(nextState ? t('companies.activated') : t('companies.archived'));
        setFormData((prev) => ({ ...prev, isActive: nextState }));
      } else {
        toast.error(t('companies.deleteFailed', { error: result.error }));
      }
    } catch (error) {
      console.error('Error toggling active:', error);
      toast.error(t('companies.statusUpdateError'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 mt-4">{t('companies.editor.loading')}</p>
        </div>
      </div>
    );
  }

  const currentMetadata = getCurrentMetadata();

  const insuranceColumns: DataColumn<InsuranceRow>[] = useMemo(
    () => [
      { key: 'name', label: t('insurances.columns.name') },
      { key: 'slug', label: t('insurances.columns.slug'), sortable: true },
      {
        key: 'status',
        label: t('insurances.columns.status'),
        sortable: true,
        render: (i) => (
          <span
            className={`text-sm font-medium ${
              i.status === 'PUBLISHED' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {i.status}
          </span>
        ),
      },
      { key: 'featured', label: t('insurances.columns.featured'), sortable: true },
      { key: 'category', label: t('insurances.columns.category') },
      { key: 'updatedAt', label: t('companies.columns.updated'), sortable: true },
    ],
    [t]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/companies')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MdArrowBack className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? t('companies.editor.editTitle') : t('companies.editor.createTitle')}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit
                ? t('companies.editor.editSubtitle')
                : t('companies.editor.createSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isEdit && company && company.insuranceCount === 0 && (
            <button
              onClick={handleHardDelete}
              className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              title={t('companies.deletePermanently')}
            >
              <MdDeleteForever className="w-5 h-5" />
              <span>{t('common.delete')}</span>
            </button>
          )}
          {isEdit && (
            <button
              onClick={handleToggleActive}
              className={`px-4 py-2 border rounded-lg transition-colors ${
                formData.isActive
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'border-green-600 text-green-700 hover:bg-green-50'
              }`}
            >
              {formData.isActive ? t('companies.archive') : t('companies.activate')}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <MdSave className="w-5 h-5" />
            <span>
              {saving
                ? t('common.saving')
                : isEdit
                ? t('companies.editor.saveChanges')
                : t('companies.editor.create')}
            </span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {isEdit && !formData.isActive && (
        <div
          className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm"
          dangerouslySetInnerHTML={{ __html: t('companies.editor.archivedBanner') }}
        />
      )}

      {/* Locale tabs + fields */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {(['en', 'lo'] as const).map((locale) => (
            <button
              key={locale}
              onClick={() => setCurrentLocale(locale)}
              className={`px-6 py-3 font-medium transition-colors ${
                currentLocale === locale
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {locale === 'en' ? t('companies.editor.english') : t('companies.editor.lao')}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('companies.editor.companyName', {
                locale: currentLocale.toUpperCase(),
                required: currentLocale === 'en' ? ' *' : '',
              })}
            </label>
            <input
              type="text"
              value={currentMetadata.name}
              onChange={(e) =>
                updateMetadata(currentLocale, 'name', e.target.value)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('companies.editor.companyNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('companies.editor.description', { locale: currentLocale.toUpperCase() })}
            </label>
            <textarea
              value={currentMetadata.description}
              onChange={(e) =>
                updateMetadata(currentLocale, 'description', e.target.value)
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('companies.editor.descriptionPlaceholder')}
            />
          </div>

          {currentLocale === 'en' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('companies.editor.urlSlug')}
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, ''),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                placeholder={t('companies.editor.urlSlugPlaceholder')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Logo section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('companies.editor.logo')}</h2>

        {!isEdit ? (
          <p className="text-sm text-gray-500">
            {t('companies.editor.logoSaveFirst')}
          </p>
        ) : formData.logo ? (
          <div className="flex items-start gap-6">
            <div className="relative w-40 h-40 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <Image
                src={formData.logo}
                alt="Company logo"
                fill
                className="object-contain p-2"
                sizes="160px"
              />
            </div>
            <div className="flex flex-col gap-3">
              <ImageUpload
                scope="company-logo"
                entityId={companyId}
                onUploaded={(url) => handleLogoUploaded(url)}
              />
              <button
                onClick={handleLogoDelete}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 w-max"
              >
                <MdDelete className="w-4 h-4" />
                {t('companies.editor.removeLogo')}
              </button>
              <p className="text-xs text-gray-500">
                {t('companies.editor.logoReplaceHint')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <ImageUpload
              scope="company-logo"
              entityId={companyId}
              onUploaded={(url) => handleLogoUploaded(url)}
            />
            <p className="text-xs text-gray-500">
              {t('companies.editor.logoSizeHint')}
            </p>
          </div>
        )}
      </div>

      {/* Linked insurances */}
      {isEdit && company && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {t('companies.editor.insurancesTitle')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('companies.editor.insurancesSubtitle')}
            </p>
          </div>

          <DataTable<InsuranceRow>
            fetchUrl="/api/admin/insurances"
            staticParams={{ locale: i18n.language, companyId }}
            keyColumn="id"
            columns={insuranceColumns}
            search={{ placeholder: t('companies.editor.insurancesSearchPlaceholder') }}
            pagination={{ perPage: 10 }}
            urlSync={false}
            emptyMessage={t('companies.editor.insurancesEmpty')}
            actions={(i) => (
              <button
                onClick={() => router.push(`/admin/insurances/${i.id}`)}
                className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                title={t('common.edit')}
              >
                <MdEdit className="w-4 h-4" />
              </button>
            )}
          />
        </div>
      )}

      {/* Audit footer */}
      {isEdit && company && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
          <span>
            {t('companies.editor.auditInsurancesLinked')}: <strong>{company.insuranceCount}</strong>
          </span>
          <span>
            {t('companies.editor.auditCreated')}: {formatDateTime(company.createdAt)}
            {company.createdBy ? ` ${t('companies.editor.auditBy')} ${company.createdBy}` : ''}
          </span>
          <span>
            {t('companies.editor.auditUpdated')}: {formatDateTime(company.updatedAt)}
            {company.updatedBy ? ` ${t('companies.editor.auditBy')} ${company.updatedBy}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
