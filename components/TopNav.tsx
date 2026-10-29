"use client";
import AuthButton from "@/components/AuthButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import AISettingsDialog from "@/components/AISettingsDialog";
import Image from 'next/image';
import { ReactNode } from "react";
import Link from "next/link";

interface TopNavProps {
  right?: ReactNode;
  hideThemeToggle?: boolean;
}

export function TopNav({ right, hideThemeToggle = false }: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4 sm:px-6">
        <Link href={"/"} className="flex items-center gap-2 font-semibold text-sm select-none">
          <Image
            src="/logo.png"
            alt="Architect AI Logo"
            width={32}
            height={32}
            priority
            className="h-8 w-8 rounded-md object-contain dark:brightness-110"
          />
          <span className="hidden sm:inline tracking-tight text-base font-semibold">Architect AI</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {right}
          <AISettingsDialog />
          {!hideThemeToggle && <ThemeToggle />}
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
