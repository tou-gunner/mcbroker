'use client';

import { useMemo, useState } from 'react';
import { MdCleaningServices, MdRefresh, MdDelete, MdWarning } from 'react-icons/md';
import { toast } from 'sonner';
import { useConfirm } from '../components/DialogProvider';

type Orphan = {
  key: string;
  url: string;
  size: number;
  lastModified: string;
};

type ScanResponse = {
  success: boolean;
  minAgeHours: number;
  scannedPrefixes: string[];
  count: number;
  totalBytes: number;
  orphans: Orphan[];
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function CleanupPage() {
  const confirm = useConfirm();
  const [minAgeHours, setMinAgeHours] = useState<number>(24);
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const allSelected = useMemo(() => {
    return !!result && result.orphans.length > 0 && selected.size === result.orphans.length;
  }, [result, selected]);

  const selectedBytes = useMemo(() => {
    if (!result) return 0;
    return result.orphans.filter((o) => selected.has(o.key)).reduce((s, o) => s + o.size, 0);
  }, [result, selected]);

  const scan = async () => {
    setScanning(true);
    setError(null);
    setSelected(new Set());
    try {
      const res = await fetch(`/api/admin/cleanup/orphans?minAgeHours=${minAgeHours}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'scan failed');
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    } finally {
      setScanning(false);
    }
  };

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (!result) return;
    setSelected(allSelected ? new Set() : new Set(result.orphans.map((o) => o.key)));
  };

  const remove = async () => {
    if (selected.size === 0) return;
    const count = selected.size;
    const ok = await confirm({
      title: `Permanently delete ${count} object${count === 1 ? '' : 's'}?`,
      description: `${formatBytes(selectedBytes)} will be removed from MinIO. This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/cleanup/orphans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: Array.from(selected) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'delete failed');
      toast.success(
        `Deleted ${json.deleted} object${json.deleted === 1 ? '' : 's'}` +
          (json.skippedNowReferenced?.length
            ? `; skipped ${json.skippedNowReferenced.length} now-referenced`
            : ''),
      );
      setSelected(new Set());
      await scan();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-3 mb-4">
        <MdCleaningServices className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-gray-800">Storage cleanup</h1>
      </div>

      <p className="text-gray-600 mb-6">
        Scans <code className="bg-gray-100 px-1 rounded">insurances/</code> in MinIO and lists objects
        that are <b>not referenced</b> by any insurance content, company logo, or setting. Only objects
        older than the minimum age will appear, so in-flight edits are safe.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum age (hours)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={minAgeHours}
              onChange={(e) => setMinAgeHours(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">Skip objects uploaded within this window.</p>
          </div>
          <button
            onClick={scan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdRefresh className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning…' : 'Scan'}
          </button>
          {[1, 24, 168].map((h) => (
            <button
              key={h}
              onClick={() => setMinAgeHours(h)}
              className={`text-xs px-2 py-1 rounded border ${
                minAgeHours === h
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {h === 1 ? '1h' : h === 24 ? '24h' : '7d'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4">
          <MdWarning className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {result && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200">
            <div className="text-sm text-gray-700">
              <b>{result.count}</b> orphan{result.count === 1 ? '' : 's'} found ·{' '}
              <b>{formatBytes(result.totalBytes)}</b> total
              {selected.size > 0 && (
                <>
                  {' · '}
                  <span className="text-primary">
                    {selected.size} selected ({formatBytes(selectedBytes)})
                  </span>
                </>
              )}
            </div>
            <button
              onClick={remove}
              disabled={deleting || selected.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdDelete className="w-5 h-5" />
              {deleting ? 'Deleting…' : `Delete selected (${selected.size})`}
            </button>
          </div>

          {result.orphans.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No orphans found. Bucket is clean.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-4 py-2 w-20">Preview</th>
                  <th className="px-4 py-2">Key</th>
                  <th className="px-4 py-2 w-24 text-right">Size</th>
                  <th className="px-4 py-2 w-48">Last modified</th>
                </tr>
              </thead>
              <tbody>
                {result.orphans.map((o) => (
                  <tr
                    key={o.key}
                    className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      selected.has(o.key) ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => toggle(o.key)}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(o.key)}
                        onChange={() => toggle(o.key)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={o.url}
                        alt=""
                        className="w-12 h-12 object-cover rounded border border-gray-200 bg-gray-50"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.visibility = 'hidden';
                        }}
                      />
                    </td>
                    <td className="px-4 py-2 font-mono text-xs break-all">
                      <a
                        href={o.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:underline"
                      >
                        {o.key}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">{formatBytes(o.size)}</td>
                    <td className="px-4 py-2 text-gray-600">{formatDate(o.lastModified)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!result && !scanning && (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
          Click <b>Scan</b> to find orphaned objects.
        </div>
      )}
    </div>
  );
}
