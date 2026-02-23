'use client';

import React, { ReactNode } from 'react';
import styles from '@/styles/dashboard.module.css';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title = 'CCTV Dashboard' }: DashboardLayoutProps) {
  return (
    <div className={styles.dashboardContainer}>
      <nav className={styles.navigationBar}>
        <h1 className={styles.systemTitle}>{title}</h1>
        <div className={styles.userSection}>
          <div className={styles.userAvatar}>U</div>
          {/* Future: User dropdown, notifications, settings */}
        </div>
      </nav>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
