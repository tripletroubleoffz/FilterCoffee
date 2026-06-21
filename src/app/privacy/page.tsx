'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-muted">Last updated: June 21, 2026</p>
        <div className="h-px bg-border w-full" />
        <div className="flex flex-col gap-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            At FilterCoffee, we take your privacy seriously. This document outlines the types of user data we collect, store, and utilize inside our intelligence classification platform.
          </p>
          <h2 className="text-lg font-bold text-foreground mt-4">1. Data Collection</h2>
          <p>
            We collect basic account metadata like your name, email, country, gender, and selected news topic preferences to roast and personalize your news brews.
          </p>
          <h2 className="text-lg font-bold text-foreground mt-4">2. Cookies and Storage</h2>
          <p>
            We use local browser storage and cookie structures to remember your preferred layout theme (dark/light) and active auth credentials.
          </p>
          <h2 className="text-lg font-bold text-foreground mt-4">3. Database Security</h2>
          <p>
            All account metadata is secured through Supabase database integrations, using strict Row Level Security (RLS) policies. Only you have the ability to read or update your private profile settings.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
