"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';

interface Props { planId: string; }

export default function ExportPlanButton({ planId }: Props) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const onExport = async () => {
    if (loading) return;
    setLoading(true);
    setProgress(0);
    try {
      // Use raw mode (no Content-Disposition) to avoid browser double handling; we'll create blob ourselves.
      const res = await fetch(`/api/plans/${planId}/export?raw=1&ts=${Date.now()}`);
      if (!res.ok) throw new Error('Export failed');
      const total = Number(res.headers.get('Content-Length')) || 0;
      const reader = res.body?.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            if (total) setProgress(Math.round((received / total) * 100));
          }
        }
      } else {
        // Fallback if stream not available
        const buf = new Uint8Array(await res.arrayBuffer());
        chunks.push(buf);
        received = buf.length;
        if (total) setProgress(100); else setProgress(null);
      }
      // Merge chunks
      const merged = new Uint8Array(received);
      let offset = 0;
      for (const c of chunks) { merged.set(c, offset); offset += c.length; }
      const blob = new Blob([merged], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plan-${planId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to export PDF');
    } finally {
      setTimeout(() => { setLoading(false); setProgress(null); }, 300); // quick reset
    }
  };

  return (
    <Button onClick={onExport} disabled={loading} variant="outline" className="gap-2">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {loading ? (progress !== null ? `Exporting ${progress}%` : 'Exporting…') : 'Export PDF'}
    </Button>
  );
}
