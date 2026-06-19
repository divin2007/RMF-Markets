import React from 'react';
import Link from 'next/link';

const footerSections = [
  {
    title: 'Marketplace',
    items: [
      { name: 'Browse Markets', href: '/markets' },
      { name: 'Verified Sellers', href: '/markets' },
      { name: 'Made in Rwanda', href: '/markets?search=Made+In+Rwanda' },
      { name: 'Market Maps', href: '/markets' },
    ],
  },
  {
    title: 'Support',
    items: [
      { name: 'Help Center', href: '/contact' },
      { name: 'MoMo Payments', href: '/contact' },
      { name: 'Delivery Tracking', href: '/orders' },
      { name: 'Refund Policy', href: '/terms' },
    ],
  },
  {
    title: 'Sell With Us',
    items: [
      { name: 'Seller Portal', href: '/seller/onboarding' },
      { name: 'Market Logistics', href: '/markets' },
      { name: 'Success Stories', href: '/contact' },
      { name: 'Pricing', href: '/contact' },
    ],
  },
  {
    title: 'RMF',
    items: [
      { name: 'Privacy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Contact', href: '/contact' },
      { name: 'About', href: '/contact' },
    ],
  },
];

export const Footer = () => (
  <footer className="relative mt-auto w-full overflow-hidden bg-white/70 py-12 text-[#1b1c1c] backdrop-blur-xl md:py-16">
    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff6b00] to-transparent" />
    <div className="rmf-container relative">
      <div className="grid grid-cols-1 gap-10 text-sm sm:grid-cols-[1.2fr_repeat(4,1fr)]">
        <div>
          <h2 className="text-glow-orange bg-gradient-to-r from-[#a04100] via-[#ff6b00] to-[#ff9340] bg-clip-text text-3xl font-black tracking-tight text-transparent">
            RMF
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-6 text-[#574e47]">
            Connecting Rwandan producers to local and international buyers with efficiency and transparency.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ffedd5] px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#a04100]">
              Platform live
            </span>
          </div>
        </div>
        {footerSections.map((section) => (
          <div key={section.title}>
            <h3 className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#ff6b00]">
              {section.title}
            </h3>
            <div className="space-y-3">
              {section.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group relative inline-block font-medium text-[#574e47] transition-colors duration-300 hover:text-[#ff6b00]"
                >
                  {item.name}
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-[#ff6b00] to-[#ff9f1c] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#ebdcd0]/60 pt-7 text-[11px] font-medium text-[#574e47] md:flex-row">
        <p>© {new Date().getFullYear()} Rwanda Market Facilitator (RMF). All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/privacy" className="transition-colors hover:text-[#ff6b00]">Privacy Policy</Link>
          <Link href="/terms" className="transition-colors hover:text-[#ff6b00]">Terms of Service</Link>
        </div>
      </div>
    </div>
  </footer>
);
