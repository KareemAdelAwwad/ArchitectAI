"use client";
import AuthButton from "@/components/AuthButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Target, Sparkles } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface TopNavProps {
  right?: ReactNode;
  onNewProject?: () => void;
}

export function TopNav({ right, onNewProject }: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow">
            <Target className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline">ArchitectAI</span>
        </div>
        {onNewProject && (
          <Button variant="ghost" size="sm" onClick={onNewProject} className="text-xs hidden md:inline-flex">
            <Sparkles className="mr-1 h-3 w-3" />New Plan
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1">
          {right}
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
