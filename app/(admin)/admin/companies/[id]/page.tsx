'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { MdSave, MdArrowBack, MdDelete, MdDeleteForever } from 'react-icons/md';
import { toast } from 'sonner';
import ImageUpload from '../../components/ImageUpload';
import { useConfirm } from '../../components/DialogProvider';

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

export default function CompanyEditorPage() {
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
        toast.error('Failed to load company');
        router.push('/admin/companies');
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Error loading company');
      router.push('/admin/companies');
    } finally {
      setLoading(false);
    }
  }, [isEdit, companyId, router]);

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
      toast.error('English name is required');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('Slug is required');
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
          toast.success('Company created. Upload a logo next.');
          router.push(`/admin/companies/${result.data.id}`);
        } else if (res.status === 409) {
          toast.error('Slug already in use');
        } else {
          toast.error(`Failed to create: ${result.error || 'Unknown error'}`);
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
          toast.success('Company updated');
          fetchCompany();
        } else if (res.status === 409) {
          toast.error('Slug already in use');
        } else {
          toast.error(`Failed to update: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Failed to save');
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
        toast.success('Logo uploaded');
        fetchCompany();
      } else {
        toast.error('Logo upload succeeded but DB update failed');
      }
    } catch (error) {
      console.error('Error updating logo:', error);
      toast.error('Error attaching logo');
    }
  };

  const handleLogoDelete = async () => {
    const ok = await confirm({
      title: 'Remove logo?',
      description: 'The logo file will be deleted from storage.',
      variant: 'danger',
      confirmLabel: 'Remove',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/companies/${companyId}/logo`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Logo removed');
        fetchCompany();
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error('Error removing logo');
    }
  };

  const handleHardDelete = async () => {
    if (!company) return;
    if (company.insuranceCount > 0) {
      toast.error(
        `Cannot delete: ${company.insuranceCount} linked insurance${
          company.insuranceCount === 1 ? '' : 's'
        }. Remove them first.`
      );
      return;
    }

    const ok = await confirm({
      title: 'Delete this company permanently?',
      description:
        'This cannot be undone. The company, its metadata, and its logo file will be removed. Prefer Archive if you want to hide it temporarily.',
      variant: 'danger',
      confirmLabel: 'Delete permanently',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Company deleted');
        router.push('/admin/companies');
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Error deleting company');
    }
  };

  const handleToggleActive = async () => {
    const nextState = !formData.isActive;
    const ok = await confirm({
      title: nextState ? 'Activate company?' : 'Archive company?',
      description: nextState
        ? 'Company will become visible on the public site.'
        : 'Company will be hidden from the public site. You can restore it later.',
      variant: nextState ? 'default' : 'danger',
      confirmLabel: nextState ? 'Activate' : 'Archive',
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
        toast.success(nextState ? 'Activated' : 'Archived');
        setFormData((prev) => ({ ...prev, isActive: nextState }));
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error toggling active:', error);
      toast.error('Error updating status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading company...</p>
        </div>
      </div>
    );
  }

  const currentMetadata = getCurrentMetadata();

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
              {isEdit ? 'Edit Company' : 'Create Company'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit
                ? 'Update company details and logo'
                : 'Add a new insurance provider'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isEdit && company && company.insuranceCount === 0 && (
            <button
              onClick={handleHardDelete}
              className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete permanently"
            >
              <MdDeleteForever className="w-5 h-5" />
              <span>Delete</span>
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
              {formData.isActive ? 'Archive' : 'Activate'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <MdSave className="w-5 h-5" />
            <span>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create'}</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {isEdit && !formData.isActive && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm">
          This company is currently <strong>archived</strong>. It is hidden from
          the public site until you activate it.
        </div>
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
              {locale === 'en' ? 'English' : 'ລາວ (Lao)'}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name ({currentLocale.toUpperCase()}) {currentLocale === 'en' && '*'}
            </label>
            <input
              type="text"
              value={currentMetadata.name}
              onChange={(e) =>
                updateMetadata(currentLocale, 'name', e.target.value)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g., Allianz Insurance"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description ({currentLocale.toUpperCase()})
            </label>
            <textarea
              value={currentMetadata.description}
              onChange={(e) =>
                updateMetadata(currentLocale, 'description', e.target.value)
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Brief description shown on the company page"
            />
          </div>

          {currentLocale === 'en' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug *
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
                placeholder="company-slug"
              />
            </div>
          )}
        </div>
      </div>

      {/* Logo section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Logo</h2>

        {!isEdit ? (
          <p className="text-sm text-gray-500">
            Save the company first, then upload a logo.
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
                Remove logo
              </button>
              <p className="text-xs text-gray-500">
                Uploading replaces the current logo.
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
              Recommended square or landscape image, ≤10MB.
            </p>
          </div>
        )}
      </div>

      {/* Audit footer */}
      {isEdit && company && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
          <span>
            Insurances linked: <strong>{company.insuranceCount}</strong>
          </span>
          <span>
            Created: {new Date(company.createdAt).toLocaleString()}
            {company.createdBy ? ` by ${company.createdBy}` : ''}
          </span>
          <span>
            Last updated: {new Date(company.updatedAt).toLocaleString()}
            {company.updatedBy ? ` by ${company.updatedBy}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
