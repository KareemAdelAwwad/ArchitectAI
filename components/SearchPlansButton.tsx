'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';

interface SearchPlansButtonProps {
  onOpen: () => void;
  className?: string;
}

export const SearchPlansButton: React.FC<SearchPlansButtonProps> = ({ onOpen, className }) => (
  <Button
    variant="outline"
    onClick={onOpen}
    className={`w-full justify-between text-sm group relative overflow-hidden hover:border-primary/40 ${className || ''}`.trim()}
    aria-label="Search plans"
  >
    <span className="flex items-center gap-2">
      <Search className="w-4 h-4 opacity-80 group-hover:opacity-100 transition" />
      Search Plans
    </span>
    <span className="flex items-center gap-1 text-[10px] font-mono rounded border px-1.5 py-0.5 bg-muted/60 text-muted-foreground">
      <span className="hidden sm:inline">Ctrl</span>
      <span className="hidden sm:inline">+</span>
      K
    </span>
  </Button>
);

export default SearchPlansButton;
