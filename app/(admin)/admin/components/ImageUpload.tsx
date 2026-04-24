'use client';

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdCloudUpload } from 'react-icons/md';

type Scope = 'insurance-content' | 'insurance-image' | 'insurance-thumbnail' | 'company-logo' | 'banner' | 'setting';

interface ImageUploadProps {
  scope: Scope;
  entityId?: string;
  entityKey?: string;
  onUploaded: (url: string, key: string) => void;
  accept?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function ImageUpload({
  scope,
  entityId,
  entityKey,
  onUploaded,
  accept = 'image/*',
  className = '',
  children,
}: ImageUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('scope', scope);
      if (entityId) form.append('entityId', entityId);
      if (entityKey) form.append('entityKey', entityKey);

      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('upload.failed'));
      onUploaded(json.url, json.key);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('upload.failed'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={`relative ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
        disabled={uploading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {children ?? (
          <>
            <MdCloudUpload className="w-8 h-8" />
            <span className="text-sm">{uploading ? t('upload.uploading') : t('upload.clickOrDrop')}</span>
          </>
        )}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
