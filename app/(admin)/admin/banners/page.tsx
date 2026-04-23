'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { MdDelete, MdSave } from 'react-icons/md';
import ImageUpload from '../components/ImageUpload';

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DraftFields {
  linkUrl: string;
  priority: number;
  isActive: boolean;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftFields>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners');
      const result = await res.json();
      if (result.success) {
        setBanners(result.data);
        const nextDrafts: Record<string, DraftFields> = {};
        for (const b of result.data as Banner[]) {
          nextDrafts[b.id] = {
            linkUrl: b.linkUrl ?? '',
            priority: b.priority,
            isActive: b.isActive,
          };
        }
        setDrafts(nextDrafts);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploaded = async (url: string) => {
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url, priority: 0, isActive: true }),
      });
      const result = await res.json();
      if (result.success) {
        fetchBanners();
      } else {
        alert(`Failed to create banner: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating banner:', error);
      alert('Error creating banner');
    }
  };

  const handleSave = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkUrl: draft.linkUrl.trim() || null,
          priority: draft.priority,
          isActive: draft.isActive,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setBanners((prev) => prev.map((b) => (b.id === id ? result.data : b)));
      } else {
        alert(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Error saving banner');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert(`Failed to delete: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Error deleting banner');
    }
  };

  const updateDraft = (id: string, patch: Partial<DraftFields>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const isDirty = (b: Banner) => {
    const d = drafts[b.id];
    if (!d) return false;
    return (
      d.linkUrl !== (b.linkUrl ?? '') ||
      d.priority !== b.priority ||
      d.isActive !== b.isActive
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banners</h1>
          <p className="text-gray-600 mt-1">
            Manage hero carousel banners. Higher priority shows first.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Upload new banner
        </h2>
        <ImageUpload scope="banner" onUploaded={(url) => handleUploaded(url)} />
        <p className="text-xs text-gray-500 mt-2">
          Recommended 1920×800, ≤10MB. Uploads are immediately created as active
          banners.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading banners...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          No banners yet. Upload one above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner) => {
            const draft = drafts[banner.id];
            if (!draft) return null;
            return (
              <div
                key={banner.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col"
              >
                <div className="relative w-full aspect-[16/9] bg-gray-100">
                  <Image
                    src={banner.imageUrl}
                    alt="Banner"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {!draft.isActive && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold">Inactive</span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3 flex-1">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Link URL (optional)
                    </label>
                    <input
                      type="url"
                      value={draft.linkUrl}
                      onChange={(e) =>
                        updateDraft(banner.id, { linkUrl: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Priority
                      </label>
                      <input
                        type="number"
                        value={draft.priority}
                        onChange={(e) =>
                          updateDraft(banner.id, {
                            priority: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700 pt-5">
                      <input
                        type="checkbox"
                        checked={draft.isActive}
                        onChange={(e) =>
                          updateDraft(banner.id, { isActive: e.target.checked })
                        }
                        className="w-4 h-4 text-primary rounded"
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                  >
                    <MdDelete className="w-4 h-4" />
                    Delete
                  </button>
                  <button
                    onClick={() => handleSave(banner.id)}
                    disabled={!isDirty(banner) || savingId === banner.id}
                    className="flex items-center gap-1 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MdSave className="w-4 h-4" />
                    {savingId === banner.id ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
