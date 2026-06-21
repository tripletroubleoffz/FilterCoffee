'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="rounded-lg border border-border bg-card overflow-hidden transition-colors"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm hover:bg-card-hover transition-colors focus:outline-none"
              aria-expanded={isOpen}
            >
              <span>{item.question}</span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted flex-shrink-0" />
              )}
            </button>
            
            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-muted-foreground animate-in slide-in-from-top-1 duration-150">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
