'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="text-xs text-muted">Last updated: June 21, 2026</p>
        <div className="h-px bg-border w-full" />
        <div className="flex flex-col gap-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Welcome to FilterCoffee. By using our application, websites, or voice broadcasts, you agree to comply with the following Terms of Service.
          </p>
          <h2 className="text-lg font-bold text-foreground mt-4">1. License and Usage</h2>
          <p>
            We grant users a limited, non-transferable license to access AI-curated summaries (Brews) for personal research purposes. You may not scrape, replicate, or resell this content without explicit written consent.
          </p>
          <h2 className="text-lg font-bold text-foreground mt-4">2. Account Responsibility</h2>
          <p>
            You are responsible for keeping your login credentials secure. Any database actions performed under your logged-in profile are assumed to be authorized by you.
          </p>
          <h2 className="text-lg font-bold text-foreground mt-4">3. Premium Subscriptions</h2>
          <p>
            Our PRO plan is billed on a monthly recurring basis of ₹599. Subscriptions can be canceled at any time in your profile portal, locking further voice broadcast functions.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
