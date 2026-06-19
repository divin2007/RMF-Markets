'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Clock3, MapPin, PackageCheck, ShieldCheck, Star, Store, TrendingUp } from 'lucide-react';
import { getMarketUrl } from '@/lib/urls';
import { resolveUploadUrl } from '@/lib/uploadUrls';

interface MarketCardProps {
  market: {
    _id: string;
    name: string;
    slug: string;
    type?: string;
    imageUrl?: string;
    image?: string;
    description?: string;
    rating?: number;
    activeProducts?: number;
    location?: { address?: string };
    operatingHours?: { open?: string; close?: string; daysOpen?: string[] };
    totalSellers?: number;
    totalOrders?: number;
  };
  index?: number;
  variant?: 'standard' | 'featured';
  isCompact?: boolean;
  maxDiscount?: number;
}

const fallbackImage =
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=1200';

const isMarketOpen = (operatingHours?: MarketCardProps['market']['operatingHours']) => {
  if (!operatingHours?.open || !operatingHours?.close) return true;
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' });
  if (operatingHours.daysOpen?.length && !operatingHours.daysOpen.includes(currentDay)) return false;
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= toMinutes(operatingHours.open) && current <= toMinutes(operatingHours.close);
};

export const MarketCard = ({ market, isCompact = false, maxDiscount }: MarketCardProps) => {
  const marketTypeLabel = market.type === 'individual' ? 'Independent shop' : 'Public market';
  const sellers = Number(market.totalSellers || 0);
  const products = Number(market.activeProducts || 0);
  const rating = Number(market.rating || 0);
  const open = isMarketOpen(market.operatingHours);
  const rawImageUrl = market.imageUrl || market.image;
  const imageUrl = rawImageUrl ? resolveUploadUrl(rawImageUrl, 'market') : fallbackImage;

  return (
    <motion.div
      whileHover={{ y: -8, transition: { type: 'spring', stiffness: 380, damping: 28 } }}
      className="h-full"
    >
      <Link
        href={getMarketUrl(market.slug)}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e8d5c4] bg-white transition-all duration-300 hover:border-[#ff6b00]/40 hover:shadow-[0_24px_64px_-8px_rgba(255,107,0,0.20)]"
      >
        {/* ── Image ─────────────────────────────────────────── */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#f0e8e0]">
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.09]"
            style={{ backgroundImage: `url("${imageUrl}")` }}
            aria-label={market.name}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

          {/* Shimmer sweep on hover */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-[850ms] group-hover:translate-x-[220%]" />

          {/* Badges top-left */}
          <div className={`absolute ${isCompact ? 'left-2 top-2 gap-1' : 'left-3 top-3 gap-1.5'} flex`}>
            <span className={`inline-flex items-center gap-1 rounded-full bg-[#ff9f1c] font-mono font-bold uppercase tracking-wide shadow-sm text-[#221b00] ${isCompact ? 'px-2 py-0.5 text-[8px]' : 'px-2.5 py-1 text-[9px]'}`}>
              <BadgeCheck size={isCompact ? 9 : 10} />
              Verified
            </span>
            {maxDiscount && maxDiscount > 0 ? (
              <span className={`rounded-full bg-[#ba1a1a] font-mono font-bold uppercase tracking-wide text-white shadow-sm ${isCompact ? 'px-2 py-0.5 text-[8px]' : 'px-2.5 py-1 text-[9px]'}`}>
                {maxDiscount}% off
              </span>
            ) : null}
          </div>

          {/* Open/Closed top-right */}
          <div className={`absolute inline-flex items-center gap-1.5 rounded-full font-mono font-bold uppercase tracking-wide shadow-sm backdrop-blur-sm ${isCompact ? 'right-2 top-2 px-2 py-0.5 text-[8px]' : 'right-3 top-3 px-2.5 py-1 text-[9px]'} ${open ? 'bg-white/95 text-[#1b1c1c]' : 'bg-black/55 text-white'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${open ? 'animate-pulse bg-emerald-500' : 'bg-white/50'}`} />
            {open ? 'Open' : 'Closed'}
          </div>

          {/* Bottom overlay */}
          <div className={`${isCompact ? 'bottom-2 left-2 right-2' : 'bottom-3 left-3 right-3'} absolute`}>
            <p className={`font-mono font-bold uppercase tracking-[0.14em] text-[#ffb693] ${isCompact ? 'text-[7px]' : 'text-[9px]'}`}>
              {marketTypeLabel}
            </p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <h3 className={`${isCompact ? 'text-base' : 'text-2xl'} line-clamp-1 font-black leading-tight text-white`}>
                {market.name}
              </h3>
              {rating > 0 && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-bold text-[#1b1c1c] shadow-sm backdrop-blur-sm">
                  <Star size={11} className="fill-[#f59e0b] text-[#f59e0b]" />
                  {rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────── */}
        <div className={`flex flex-1 flex-col ${isCompact ? 'p-3' : 'p-4'}`}>
          <p className={`font-medium text-[#574e47] ${isCompact ? 'line-clamp-1 text-[11px] leading-4' : 'line-clamp-2 text-sm leading-relaxed'}`}>
            {market.description || 'Shop verified sellers, fresh products, and delivery-ready local goods.'}
          </p>

          {/* Stats */}
          <div className={`grid gap-2 ${market.totalOrders && market.totalOrders > 0 ? (isCompact ? 'grid-cols-2' : 'grid-cols-3') : 'grid-cols-2'} ${isCompact ? 'mt-3' : 'mt-4'}`}>
            <div className={`rounded-xl border border-[#ebdcd0] bg-[#fbf9f8] transition-all duration-200 group-hover:border-[#ff6b00]/20 group-hover:bg-[#fff8f5] ${isCompact ? 'p-2' : 'p-3'}`}>
              <div className="flex items-center gap-1.5 text-[#ff6b00]">
                <Store size={isCompact ? 11 : 14} />
                <span className={`${isCompact ? 'text-sm' : 'text-lg'} font-black text-[#1b1c1c]`}>
                  {market.type === 'individual' ? 1 : sellers}
                </span>
              </div>
              <p className={`mt-1 font-mono font-bold uppercase tracking-[0.1em] text-[#574e47] ${isCompact ? 'text-[7px]' : 'text-[8px]'}`}>
                {market.type === 'individual' ? 'Shop' : 'Sellers'}
              </p>
            </div>

            <div className={`rounded-xl border border-[#ebdcd0] bg-[#fbf9f8] transition-all duration-200 group-hover:border-[#ff6b00]/20 group-hover:bg-[#fff8f5] ${isCompact ? 'p-2' : 'p-3'}`}>
              <div className="flex items-center gap-1.5 text-[#ff6b00]">
                <PackageCheck size={isCompact ? 11 : 14} />
                <span className={`${isCompact ? 'text-sm' : 'text-lg'} font-black text-[#1b1c1c]`}>{products}</span>
              </div>
              <p className={`mt-1 font-mono font-bold uppercase tracking-[0.1em] text-[#574e47] ${isCompact ? 'text-[7px]' : 'text-[8px]'}`}>
                Products
              </p>
            </div>

            {market.totalOrders !== undefined && market.totalOrders > 0 && (
              <div className={`rounded-xl border border-[#ffe0cc] bg-[#fff3ec] transition-all duration-200 group-hover:bg-[#ffedd5] ${isCompact ? 'col-span-2 p-2' : 'p-3'}`}>
                <div className="flex items-center gap-1.5 text-[#ff6b00]">
                  <TrendingUp size={isCompact ? 11 : 14} />
                  <span className={`${isCompact ? 'text-sm' : 'text-lg'} font-black text-[#1b1c1c]`}>{market.totalOrders}</span>
                </div>
                <p className={`mt-1 font-mono font-bold uppercase tracking-[0.1em] text-[#7a3000] ${isCompact ? 'text-[7px]' : 'text-[8px]'}`}>
                  Orders
                </p>
              </div>
            )}
          </div>

          {/* Location */}
          <div className={`${isCompact ? 'mt-3 text-[11px]' : 'mt-4 text-sm'} flex items-center gap-1.5 font-medium text-[#574e47]`}>
            <MapPin size={isCompact ? 11 : 14} className="shrink-0 text-[#ff6b00]" />
            <span className="truncate">{market.location?.address || 'Rwanda'}</span>
          </div>

          {/* CTA */}
          <div className={`${isCompact ? 'pt-3' : 'pt-4'} mt-auto flex items-center justify-between border-t border-[#ebdcd0] transition-colors duration-200 group-hover:border-[#ff6b00]/20`}>
            <span className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-[0.1em] text-[#ff6b00] ${isCompact ? 'text-[8px]' : 'text-[10px]'}`}>
              <ShieldCheck size={isCompact ? 10 : 13} />
              Visit market
            </span>
            <ArrowRight
              className="text-[#ff6b00] transition-transform duration-300 group-hover:translate-x-1.5"
              size={isCompact ? 14 : 17}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
