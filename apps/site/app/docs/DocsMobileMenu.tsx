'use client';

import { MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface DocsMobileMenuProps {
  items: Array<{
    href: string;
    label: string;
  }>;
}

export function DocsMobileMenu({ items }: DocsMobileMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11 border border-gold-rune/20 px-3 font-mono text-xs tracking-normal text-parchment hover:bg-mist-green/60 hover:text-gold-rune focus-visible:ring-gold-rune/55 md:hidden"
        >
          <MenuIcon data-icon="inline-start" />
          Docs
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[19rem] border-gold-rune/20 bg-deep-forest p-0 text-parchment sm:max-w-[19rem]"
      >
        <SheetHeader className="border-b border-gold-rune/20 p-5 text-left">
          <SheetTitle className="font-display text-lg font-bold text-gold-rune">Yggdrasil Worktree</SheetTitle>
          <SheetDescription className="font-mono text-xs tracking-normal text-parchment/50">Documentation</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3">
          {items.map((item) => (
            <SheetClose key={item.href} asChild>
              <a
                href={item.href}
                className="flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-parchment/75 transition-colors hover:bg-gold-rune/15 hover:text-frost-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-rune/55"
              >
                {item.label}
              </a>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
