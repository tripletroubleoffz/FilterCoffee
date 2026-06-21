'use client';

import React, { useState } from 'react';
import { Article } from '@/context/AppContext';
import { Heart, Bookmark, Eye, X } from 'lucide-react';

interface NewsCardProps {
  article: Article;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
}

export function NewsCard({ article, isLiked, isSaved, onLike, onSave }: NewsCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <>
      <article className="group flex flex-col justify-between p-5 rounded-lg border border-border bg-card hover:bg-card-hover transition-all duration-200 focus-within:ring-2 focus-within:ring-foreground">
        <div className="flex flex-col gap-3">
          {/* Top metadata badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border border-border px-2 py-0.5 rounded-full bg-background">
              {article.category}
            </span>
            <span className="text-xs text-muted">
              {new Date(article.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Title & description */}
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold group-hover:text-muted transition-colors leading-snug">
              {article.headline}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {article.summary}
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className={`flex items-center gap-1.5 text-xs font-medium p-1.5 rounded-md hover:bg-border transition-colors ${
                isLiked ? 'text-foreground font-semibold' : 'text-muted'
              }`}
              aria-label={isLiked ? 'Unlike article' : 'Like article'}
            >
              <Heart className={`w-4.5 h-4.5 ${isLiked ? 'fill-foreground stroke-foreground' : ''}`} />
              <span>{article.likes_count}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              className={`flex items-center gap-1.5 text-xs font-medium p-1.5 rounded-md hover:bg-border transition-colors ${
                isSaved ? 'text-foreground font-semibold' : 'text-muted'
              }`}
              aria-label={isSaved ? 'Remove from saved' : 'Save article'}
            >
              <Bookmark className={`w-4.5 h-4.5 ${isSaved ? 'fill-foreground stroke-foreground' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          <button
            onClick={() => setDetailsOpen(true)}
            className="flex items-center gap-1 text-xs font-semibold border border-foreground/20 bg-background text-foreground hover:bg-foreground hover:text-background px-3 py-1.5 rounded-md transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Read More
          </button>
        </div>
      </article>

      {/* Article Detail modal overlay */}
      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setDetailsOpen(false)}
          />
          
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-card p-6 md:p-8 shadow-2xl z-10 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Header info */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground border border-border px-2.5 py-0.5 rounded-full bg-background">
                {article.category}
              </span>
              <button
                onClick={() => setDetailsOpen(false)}
                className="p-1 rounded-md border border-border hover:bg-card-hover transition-colors focus:outline-none"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Headline */}
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-extrabold leading-tight">
                {article.headline}
              </h2>
              <span className="text-xs text-muted">
                Published {new Date(article.created_at).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div className="h-px bg-border w-full" />

            {/* Body Content */}
            <div className="flex flex-col gap-4 text-base leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">
                {article.summary}
              </p>
              <p className="whitespace-pre-line">
                {article.content}
              </p>
            </div>

            <div className="h-px bg-border w-full mt-2" />

            {/* Actions Footer */}
            <div className="flex items-center gap-4">
              <button
                onClick={onLike}
                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-md border border-border hover:bg-card-hover transition-colors ${
                  isLiked ? 'text-foreground' : 'text-muted'
                }`}
              >
                <Heart className={`w-4.5 h-4.5 ${isLiked ? 'fill-foreground stroke-foreground' : ''}`} />
                <span>Like ({article.likes_count})</span>
              </button>

              <button
                onClick={onSave}
                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-md border border-border hover:bg-card-hover transition-colors ${
                  isSaved ? 'text-foreground' : 'text-muted'
                }`}
              >
                <Bookmark className={`w-4.5 h-4.5 ${isSaved ? 'fill-foreground stroke-foreground' : ''}`} />
                <span>{isSaved ? 'Saved Brew' : 'Save Brew'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
