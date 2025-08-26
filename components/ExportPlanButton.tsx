"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2, FileJson, FileUp } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useRef } from 'react';

interface Props { planId: string; }

export default function ExportPlanButton({ planId }: Props) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportPlan = async (format: 'pdf' | 'json') => {
    if (loading) return;
    setLoading(true);
    setProgress(0);
    try {
      const url = `/api/plans/${planId}/export?raw=1&format=${format}&ts=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Export failed');
      if (format === 'json') {
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `plan-${planId}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        setProgress(null);
      } else {
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
          const buf = new Uint8Array(await res.arrayBuffer());
          chunks.push(buf);
          received = buf.length;
          if (total) setProgress(100); else setProgress(null);
        }
        const merged = new Uint8Array(received);
        const blob = new Blob([merged], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `plan-${planId}.pdf`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to export plan');
    } finally {
      setTimeout(() => { setLoading(false); setProgress(null); }, 300);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setLoading(true);
          try {
            const form = new FormData();
            form.append('file', file);
            const res = await fetch('/api/plans/import', { method: 'POST', body: form });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            if (data._id && typeof window !== 'undefined') {
              window.location.href = `/plans/${data._id}`;
            }
          } catch (err: any) {
            console.error('Import failed', err);
            alert('Import failed: ' + (err.message || 'Unknown error'));
          } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={loading} variant="outline" className="gap-2" aria-label="File menu">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {loading ? (progress !== null ? `File ${progress}%` : 'Working…') : 'File'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => exportPlan('pdf')} disabled={loading} className="gap-2">
            <FileDown className="w-4 h-4" /> Export PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportPlan('json')} disabled={loading} className="gap-2">
            <FileJson className="w-4 h-4" /> Export JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={loading} className="gap-2" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="w-4 h-4" /> Import
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
