'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { MdSave, MdArrowBack, MdPublish, MdDrafts, MdAdd, MdDelete } from 'react-icons/md';
import { toast } from 'sonner';
import ImageUpload from '../../components/ImageUpload';

// Import editor dynamically to avoid SSR issues
const RichTextEditor = dynamic(() => import('../../components/RichTextEditor'), {
  ssr: false,
  loading: () => <EditorLoading />,
});

function EditorLoading() {
  const { t } = useTranslation();
  return (
    <div className="animate-pulse bg-gray-100 h-96 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">{t('insurances.editor.loadingEditor')}</p>
    </div>
  );
}

interface InsuranceForm {
  categoryId: string;
  companyId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'UNDER_REVIEW';
  featured: boolean;
  priority: number;
  slug: string;
  thumbnail: string | null;
  metadata: {
    locale: string;
    name: string;
    description: string;
  }[];
  content: {
    locale: string;
    contentJson: any;
    contentHtml: string;
    contentText: string;
    images: string[];
  }[];
}

export default function InsuranceEditorPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const isEdit = !!params?.id;
  const insuranceId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('en');
  const [companies, setCompanies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanySlug, setNewCompanySlug] = useState('');

  const [formData, setFormData] = useState<InsuranceForm>({
    categoryId: '',
    companyId: '',
    status: 'DRAFT',
    featured: false,
    priority: 0,
    slug: '',
    thumbnail: null,
    metadata: [
      { locale: 'en', name: '', description: '' },
      { locale: 'lo', name: '', description: '' },
    ],
    content: [
      { locale: 'en', contentJson: '', contentHtml: '', contentText: '', images: [] },
      { locale: 'lo', contentJson: '', contentHtml: '', contentText: '', images: [] },
    ],
  });

  useEffect(() => {
    fetchData();
    if (isEdit) {
      fetchInsurance();
    }
  }, [isEdit, insuranceId]);

  const fetchData = async () => {
    try {
      const [companiesRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/companies?locale=en'),
        fetch('/api/admin/categories?locale=en'),
      ]);

      const companiesData = await companiesRes.json();
      const categoriesData = await categoriesRes.json();

      if (companiesData.success) {
        setCompanies(companiesData.data);
      }

      if (categoriesData.success) {
        setCategories(categoriesData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('insurances.editor.loadCompaniesFailed'));
    }
  };

  const fetchInsurance = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/insurances/${insuranceId}?locale=en`);
      const result = await response.json();

      if (result.success && result.data) {
        const insurance = result.data;

        // Map API data to form structure
        setFormData({
          categoryId: insurance.categoryId || '',
          companyId: insurance.companyId || '',
          status: insurance.status || 'DRAFT',
          featured: insurance.featured || false,
          priority: insurance.priority || 0,
          slug: insurance.slug || '',
          thumbnail: insurance.thumbnail ?? null,
          metadata: [
            {
              locale: 'en',
              name: insurance.metadata?.en?.name || '',
              description: insurance.metadata?.en?.description || ''
            },
            {
              locale: 'lo',
              name: insurance.metadata?.lo?.name || '',
              description: insurance.metadata?.lo?.description || ''
            }
          ],
          content: [
            {
              locale: 'en',
              contentJson: insurance.content?.en?.contentJson || '',
              contentHtml: insurance.content?.en?.contentHtml || '',
              contentText: insurance.content?.en?.contentText || '',
              images: insurance.content?.en?.images || []
            },
            {
              locale: 'lo',
              contentJson: insurance.content?.lo?.contentJson || '',
              contentHtml: insurance.content?.lo?.contentHtml || '',
              contentText: insurance.content?.lo?.contentText || '',
              images: insurance.content?.lo?.images || []
            }
          ]
        });
      } else {
        toast.error(t('insurances.editor.loadFailed'));
        router.push('/admin/insurances');
      }
    } catch (error) {
      console.error('Error fetching insurance:', error);
      toast.error(t('insurances.editor.loadError'));
      router.push('/admin/insurances');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (status?: 'DRAFT' | 'PUBLISHED') => {
    setSaving(true);
    try {
      const saveData = {
        ...formData,
        status: status || formData.status,
      };

      const response = await fetch(
        isEdit ? `/api/admin/insurances/${insuranceId}` : '/api/admin/insurances',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saveData),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success(
          isEdit
            ? t('insurances.editor.saveSuccessUpdated')
            : t('insurances.editor.saveSuccessCreated')
        );
        router.push('/admin/insurances');
      } else {
        toast.error(t('insurances.editor.saveFailed', { error: result.error || 'Unknown error' }));
      }
    } catch (error) {
      console.error('Error saving insurance:', error);
      toast.error(t('insurances.editor.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailUploaded = async (url: string) => {
    try {
      const res = await fetch(`/api/admin/insurances/${insuranceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thumbnail: url }),
      });
      const result = await res.json();
      if (result.success) {
        setFormData(prev => ({ ...prev, thumbnail: url }));
        toast.success(t('insurances.editor.thumbnailUploaded'));
      } else {
        toast.error(t('insurances.editor.thumbnailDbFailed'));
      }
    } catch (error) {
      console.error('Error attaching thumbnail:', error);
      toast.error(t('insurances.editor.thumbnailAttachError'));
    }
  };

  const handleThumbnailDelete = async () => {
    if (!window.confirm(t('insurances.editor.thumbnailRemoveConfirm'))) return;
    try {
      const res = await fetch(`/api/admin/insurances/${insuranceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thumbnail: null }),
      });
      const result = await res.json();
      if (result.success) {
        setFormData(prev => ({ ...prev, thumbnail: null }));
        toast.success(t('insurances.editor.thumbnailRemoved'));
      } else {
        toast.error(t('insurances.editor.thumbnailRemoveFailed'));
      }
    } catch (error) {
      console.error('Error removing thumbnail:', error);
      toast.error(t('insurances.editor.thumbnailRemoveError'));
    }
  };

  const updateMetadata = (locale: string, field: 'name' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: prev.metadata.map(meta =>
        meta.locale === locale ? { ...meta, [field]: value } : meta
      ),
    }));
  };

  const updateContent = (locale: string, content: any) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content.map(c =>
        c.locale === locale ? {
          ...c,
          contentJson: content.json,
          contentHtml: content.html,
          contentText: content.text,
        } : c
      ),
    }));
  };

  const getCurrentContent = () => {
    return formData.content.find(c => c.locale === currentLocale)?.contentJson || '';
  };

  const getCurrentMetadata = () => {
    return formData.metadata.find(m => m.locale === currentLocale) || { locale: currentLocale, name: '', description: '' };
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error(t('insurances.editor.categoryNameRequired'));
      return;
    }

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newCategorySlug || newCategoryName.toLowerCase().replace(/\s+/g, '-'),
          metadata: [
            { locale: 'en', key: 'name', value: newCategoryName },
            { locale: 'lo', key: 'name', value: newCategoryName }
          ]
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('insurances.editor.categoryCreated'));
        setShowNewCategoryModal(false);
        setNewCategoryName('');
        setNewCategorySlug('');
        fetchData();
      } else {
        toast.error(t('insurances.editor.categoryCreateFailed', { error: result.error }));
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error(t('insurances.editor.categoryCreateError'));
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      toast.error(t('insurances.editor.companyNameRequired'));
      return;
    }

    try {
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newCompanySlug || newCompanyName.toLowerCase().replace(/\s+/g, '-'),
          metadata: [
            { locale: 'en', key: 'name', value: newCompanyName },
            { locale: 'lo', key: 'name', value: newCompanyName }
          ]
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('insurances.editor.companyCreated'));
        setShowNewCompanyModal(false);
        setNewCompanyName('');
        setNewCompanySlug('');
        fetchData();
      } else {
        toast.error(t('insurances.editor.companyCreateFailed', { error: result.error }));
      }
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error(t('insurances.editor.companyCreateError'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 mt-4">{t('insurances.editor.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MdArrowBack className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? t('insurances.editor.editTitle') : t('insurances.editor.createTitle')}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? t('insurances.editor.editSubtitle') : t('insurances.editor.createSubtitle')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <MdDrafts className="w-5 h-5" />
            <span>{t('insurances.editor.saveDraft')}</span>
          </button>

          <button
            onClick={() => handleSave('PUBLISHED')}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <MdPublish className="w-5 h-5" />
            <span>{saving ? t('common.saving') : t('insurances.editor.publish')}</span>
          </button>
        </div>
      </div>

      {/* Locale Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setCurrentLocale('en')}
            className={`px-6 py-3 font-medium transition-colors ${
              currentLocale === 'en'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('insurances.editor.english')}
          </button>
          <button
            onClick={() => setCurrentLocale('lo')}
            className={`px-6 py-3 font-medium transition-colors ${
              currentLocale === 'lo'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('insurances.editor.lao')}
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('insurances.editor.basicInformation')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Insurance Name (per locale) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('insurances.editor.insuranceName', { locale: currentLocale.toUpperCase() })}
                </label>
                <input
                  type="text"
                  required
                  value={getCurrentMetadata().name}
                  onChange={(e) => updateMetadata(currentLocale, 'name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={t('insurances.editor.insuranceNamePlaceholder')}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('insurances.editor.category')}
                </label>
                <div className="flex gap-2">
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">{t('insurances.editor.selectCategory')}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name || cat.slug}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    title={t('insurances.editor.createNewCategory')}
                  >
                    <MdAdd className="w-5 h-5" />
                    <span className="hidden sm:inline">{t('insurances.editor.newShort')}</span>
                  </button>
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('insurances.editor.company')}
                </label>
                <div className="flex gap-2">
                  <select
                    required
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">{t('insurances.editor.selectCompany')}</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name || company.slug}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCompanyModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    title={t('insurances.editor.createNewCompany')}
                  >
                    <MdAdd className="w-5 h-5" />
                    <span className="hidden sm:inline">{t('insurances.editor.newShort')}</span>
                  </button>
                </div>
              </div>

              {/* Slug (only once, not per locale) */}
              {currentLocale === 'en' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('insurances.editor.urlSlug')}
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={t('insurances.editor.urlSlugPlaceholder')}
                  />
                </div>
              )}

              {/* Priority */}
              {currentLocale === 'en' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('insurances.editor.priority')}
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    min="0"
                  />
                  <p className="text-sm text-gray-500 mt-1">{t('insurances.editor.priorityHint')}</p>
                </div>
              )}

              {/* Featured */}
              {currentLocale === 'en' && (
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t('insurances.editor.featuredLabel')}
                    </span>
                  </label>
                </div>
              )}

              {/* Short Description (per locale) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('insurances.editor.shortDescription', { locale: currentLocale.toUpperCase() })}
                </label>
                <textarea
                  required
                  value={getCurrentMetadata().description}
                  onChange={(e) => updateMetadata(currentLocale, 'description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={t('insurances.editor.shortDescriptionPlaceholder')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail section — shown only in edit mode (upload key requires insuranceId) */}
      {currentLocale === 'en' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('insurances.editor.thumbnail')}</h2>
          {!isEdit ? (
            <p className="text-sm text-gray-500">
              {t('insurances.editor.thumbnailSaveFirst')}
            </p>
          ) : formData.thumbnail ? (
            <div className="flex items-start gap-6">
              <div className="relative w-80 h-50 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden" style={{ height: '200px' }}>
                <Image
                  src={formData.thumbnail}
                  alt="Insurance thumbnail"
                  fill
                  className="object-cover"
                  sizes="320px"
                />
              </div>
              <div className="flex flex-col gap-3">
                <ImageUpload
                  scope="insurance-thumbnail"
                  entityId={insuranceId}
                  onUploaded={(url) => handleThumbnailUploaded(url)}
                />
                <button
                  type="button"
                  onClick={handleThumbnailDelete}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 w-max"
                >
                  <MdDelete className="w-4 h-4" />
                  {t('insurances.editor.thumbnailRemove')}
                </button>
                <p className="text-xs text-gray-500">
                  {t('insurances.editor.thumbnailReplaceHint')}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <ImageUpload
                scope="insurance-thumbnail"
                entityId={insuranceId}
                onUploaded={(url) => handleThumbnailUploaded(url)}
              />
              <p className="text-xs text-gray-500">
                {t('insurances.editor.thumbnailSizeHint')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Rich Content Editor */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('insurances.editor.detailedContent', { locale: currentLocale.toUpperCase() })}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('insurances.editor.detailedContentHint')}
          </p>
        </div>

        <RichTextEditor
          content={getCurrentContent()}
          onChange={(content) => updateContent(currentLocale, content)}
        />
      </div>

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">{t('insurances.editor.createNewCategory')}</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('insurances.editor.categoryName')}
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value);
                  // Auto-generate slug
                  setNewCategorySlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={t('insurances.editor.categoryNamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('insurances.editor.companySlug')}
              </label>
              <input
                type="text"
                value={newCategorySlug}
                onChange={(e) => setNewCategorySlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={t('insurances.editor.categorySlugPlaceholder')}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowNewCategoryModal(false);
                  setNewCategoryName('');
                  setNewCategorySlug('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {t('insurances.editor.createCategory')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Company Modal */}
      {showNewCompanyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">{t('insurances.editor.createNewCompany')}</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('insurances.editor.companyName')}
              </label>
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => {
                  setNewCompanyName(e.target.value);
                  // Auto-generate slug
                  setNewCompanySlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={t('insurances.editor.companyNamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('insurances.editor.companySlug')}
              </label>
              <input
                type="text"
                value={newCompanySlug}
                onChange={(e) => setNewCompanySlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={t('insurances.editor.companySlugPlaceholder')}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowNewCompanyModal(false);
                  setNewCompanyName('');
                  setNewCompanySlug('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleCreateCompany}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {t('insurances.editor.createCompany')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pb-8">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t('common.cancel')}
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <MdDrafts className="w-5 h-5" />
            <span>{t('insurances.editor.saveDraft')}</span>
          </button>

          <button
            onClick={() => handleSave('PUBLISHED')}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <MdSave className="w-5 h-5" />
            <span>{saving ? t('common.saving') : t('insurances.editor.savePublish')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
