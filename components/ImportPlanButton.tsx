"use client";

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp, Loader2 } from 'lucide-react';

interface Props { onImported?: (newPlanId: string) => void; }

export default function ImportPlanButton({ onImported }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const handleClick = () => {
    if (loading) return;
    inputRef.current?.click();
  };
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/plans/import', { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data._id) {
        // Navigate to new plan
        onImported?.(data._id);
        window.dispatchEvent(new CustomEvent('plan-imported', { detail: { id: data._id } }));
        // Replace URL
        if (typeof window !== 'undefined') {
          window.location.href = `/plans/${data._id}`;
        }
      }
    } catch (err: any) {
      console.error('Import failed', err);
      alert('Import failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };
  return (
    <>
      <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />
      <Button onClick={handleClick} variant="outline" size="sm" className="gap-2" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
        {loading ? 'Importing...' : 'Import Plan'}
      </Button>
    </>
  );
}
