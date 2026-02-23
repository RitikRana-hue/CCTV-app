'use client';

import { Menu, Bell, Settings, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  onSidebarToggle: () => void;
}

export function Header({ title, onSidebarToggle }: HeaderProps) {
  return (
    <header className="header">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={onSidebarToggle}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-md hover:bg-accent transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>
          
          <button
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="User menu"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
