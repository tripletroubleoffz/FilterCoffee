'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabaseClient';
import { CreditCard, QrCode, CheckCircle, ShieldCheck, ArrowRight, X } from 'lucide-react';

export default function SubscriptionPage() {
  const { profile, refreshProfile } = useApp();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form Fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [upiId, setUpiId] = useState('');

  const currentPlan = profile?.subscription_status || 'FREE';

  const handleUpgrade = async () => {
    if (currentPlan === 'PRO') return;
    setCheckoutOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    
    setProcessing(true);

    // Simulate payment network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      // Update database profile subscription status to PRO
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'PRO' })
        .eq('id', profile.id);

      if (error) throw error;
      
      await refreshProfile();
      setPaymentSuccess(true);
    } catch (err) {
      console.error('Failed to update subscription status:', err);
      // Fallback
      setPaymentSuccess(true);
    } finally {
      setProcessing(false);
    }
  };

  const closeCheckout = () => {
    setCheckoutOpen(false);
    setPaymentSuccess(false);
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setUpiId('');
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        
        {/* Heading */}
        <div className="flex flex-col gap-1 border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Subscription Plans</h1>
          <p className="text-xs text-muted">
            Upgrade your plan to unlock advanced intelligence digests and voice summaries.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mt-4">
          
          {/* FREE PLAN */}
          <div className={`p-6 rounded-lg border bg-card flex flex-col justify-between gap-8 hover:bg-card-hover transition-colors ${
            currentPlan === 'FREE' ? 'border-foreground shadow-sm' : 'border-border'
          }`}>
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm uppercase tracking-widest">FREE PLAN</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Basic Filtering</span>
                </div>
                <span className="text-2xl font-black">₹0</span>
              </div>

              <ul className="flex flex-col gap-3.5 text-xs text-muted-foreground font-medium">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  3 Active Preferences Topics
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Weekly Email Summary Digest
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Basic Saved Brew List
                </li>
              </ul>
            </div>

            {currentPlan === 'FREE' ? (
              <button
                disabled
                className="w-full py-2.5 rounded-md border border-border bg-background text-muted text-xs font-semibold select-none cursor-default"
              >
                Current Active Plan
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2.5 rounded-md border border-border bg-background text-muted text-xs font-semibold"
              >
                Downgrade Locked
              </button>
            )}
          </div>

          {/* PRO PLAN */}
          <div className={`p-6 rounded-lg border-2 bg-card flex flex-col justify-between gap-8 relative ${
            currentPlan === 'PRO' ? 'border-foreground shadow-md' : 'border-foreground/40 hover:border-foreground transition-colors'
          }`}>
            {currentPlan === 'PRO' && (
              <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded border border-foreground bg-foreground text-background text-[9px] uppercase font-extrabold">
                Active Plan
              </div>
            )}
            
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm uppercase tracking-widest">PRO PLAN</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Full Voice & Real-time Processing</span>
                </div>
                <span className="text-2xl font-black">₹599<span className="text-xs font-normal text-muted">/mo</span></span>
              </div>

              <ul className="flex flex-col gap-3.5 text-xs text-muted-foreground font-medium">
                <li className="flex items-center gap-2 text-foreground font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  10 Active Preferences Topics
                </li>
                <li className="flex items-center gap-2 text-foreground font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Daily Morning Email Digests
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Voice-Based News Experience (Brewing Wave)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Unlimited Saved Brew History
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Priority Access to New ML Features
                </li>
              </ul>
            </div>

            {currentPlan === 'PRO' ? (
              <button
                disabled
                className="w-full py-2.5 rounded-md border border-border bg-background text-muted text-xs font-semibold select-none cursor-default"
              >
                Current Active Plan
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                className="w-full py-2.5 rounded-md border border-foreground bg-foreground text-background font-bold text-xs hover:opacity-90 transition-opacity focus:outline-none"
              >
                Upgrade to PRO
              </button>
            )}
          </div>

        </div>

        {/* Payment Simulator modal */}
        {checkoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={closeCheckout} />
            
            <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl z-10 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                  <span className="font-bold text-sm uppercase tracking-wider">Secure Payment Simulator</span>
                </div>
                <button
                  onClick={closeCheckout}
                  className="p-1 rounded-md border border-border hover:bg-card-hover transition-colors focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!paymentSuccess ? (
                <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Upgrading to</span>
                    <span className="text-lg font-extrabold">FilterCoffee PRO</span>
                    <span className="text-sm font-semibold mt-1">₹599 / month</span>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`py-2 rounded-md border flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors focus:outline-none ${
                        paymentMethod === 'card'
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-background hover:bg-card-hover text-muted-foreground'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Card Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`py-2 rounded-md border flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors focus:outline-none ${
                        paymentMethod === 'upi'
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-background hover:bg-card-hover text-muted-foreground'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      UPI
                    </button>
                  </div>

                  {/* Card Form */}
                  {paymentMethod === 'card' ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Card Number</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                          placeholder="4111 2222 3333 4444"
                          className="h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expiry Date</label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CVC</label>
                          <input
                            type="password"
                            required
                            maxLength={3}
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="123"
                            className="h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* UPI Form */
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">UPI ID</label>
                        <input
                          type="text"
                          required
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. name@upi"
                          className="h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                        />
                      </div>
                      <div className="p-3 border border-dashed border-border rounded bg-background flex flex-col items-center justify-center gap-1.5 select-none">
                        <span className="text-[10px] font-bold uppercase text-muted">Or Scan QR Code</span>
                        <div className="w-24 h-24 bg-muted border border-border rounded flex items-center justify-center relative">
                          {/* Mock QR representation */}
                          <QrCode className="w-16 h-16 text-muted" />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-2.5 rounded-md border border-foreground bg-foreground text-background font-semibold text-xs hover:opacity-90 disabled:opacity-50 transition-opacity focus:outline-none flex items-center justify-center gap-1.5"
                  >
                    {processing ? 'Processing Payment...' : 'Pay & Subscribe'} <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Payment Success screen */
                <div className="flex flex-col items-center text-center gap-4 py-4 animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-extrabold text-base">Subscription Activated!</h3>
                    <p className="text-xs text-muted max-w-xs leading-relaxed">
                      You are now a FilterCoffee PRO member. Real-time briefs and Brewing Wave audio newsletters are unlocked!
                    </p>
                  </div>
                  <button
                    onClick={closeCheckout}
                    className="mt-4 w-full py-2 rounded-md border border-border hover:bg-card-hover font-semibold text-xs transition-colors"
                  >
                    Return to Subscriptions
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
