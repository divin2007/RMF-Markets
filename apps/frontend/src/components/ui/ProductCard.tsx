'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BadgeCheck, Heart, MessageCircle, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/components/cart/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatCurrency } from '@/lib/format';
import { trackProductSignal } from '@/lib/recommendations';
import { getProductUrl } from '@/lib/urls';
import { resolveUploadUrl } from '@/lib/uploadUrls';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    price: number;
    unit: string;
    images: string[];
    inStock: boolean;
    marketId?: string | { _id?: string; slug?: string };
    promotion?: { type: 'percentage' | 'fixed_amount'; discount: number; promotedPrice: number };
    stockType?: 'finite' | 'infinite' | 'on_demand';
    isMadeInRwanda?: boolean;
    isNegotiable?: boolean;
    category?: string;
    sellerId?: string | {
      _id?: string;
      userId?: string;
      stallId?: string;
      stallName?: string;
      shopDetails?: { name?: string };
    };
  };
  isCompact?: boolean;
}

const normalizeImages = (rawImages: unknown) => {
  const list = typeof rawImages === 'string'
    ? rawImages.split(',')
    : Array.isArray(rawImages)
      ? rawImages.flatMap(item => (typeof item === 'string' ? item.split(',') : item))
      : [];
  return list
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .map(url => resolveUploadUrl(url, 'product'));
};

export const ProductCard = ({ product, isCompact = false }: ProductCardProps) => {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [heartPop, setHeartPop] = React.useState(false);

  const images = React.useMemo(() => normalizeImages(product.images), [product.images]);
  const sellerProfile = typeof product.sellerId === 'object' ? product.sellerId : null;
  const sellerId = sellerProfile?._id || product.sellerId;
  const sellerUserId = sellerProfile?.userId || null;
  const sellerName = sellerProfile?.shopDetails?.name || sellerProfile?.stallName || 'Verified seller';
  const productUrl = getProductUrl(product._id);
  const hasPromotion = product.promotion && product.promotion.promotedPrice > 0;
  const displayPrice = hasPromotion ? product.promotion!.promotedPrice : product.price;
  const isNegotiable =
    String(product.isNegotiable) === 'true' ||
    product.isNegotiable === true ||
    product.stockType === 'on_demand';
  const priceRangeLabel =
    (product as any).minPrice && (product as any).maxPrice
      ? `${Number((product as any).minPrice).toLocaleString()} - ${Number((product as any).maxPrice).toLocaleString()} RWF`
      : null;
  const available = Boolean(
    product.inStock || product.stockType === 'infinite' || product.stockType === 'on_demand'
  );

  const handleNegotiation = async (event: React.MouseEvent) => {
    event.preventDefault();
    if (!user) return toast.error('Please log in to negotiate with the seller');
    if (user.role !== 'BUYER') return toast.error('Negotiations must be started from a buyer account.');
    trackProductSignal(product, 'add_to_cart');
    try {
      const subtotal = product.price;
      const deliveryFee = 1000;
      const platformCommission = Math.max(subtotal * 0.015, 100);
      const gatewayFee = Math.ceil(subtotal * 0.02);
      const payload = {
        buyer: { userId: user.id, fullName: user.fullName || 'Buyer', phone: user.phone || 'N/A' },
        seller: {
          sellerId,
          userId: sellerUserId,
          fullName: sellerName,
          stallId: sellerProfile?.stallId || 'N/A',
          marketId: typeof product.marketId === 'object' ? product.marketId._id : product.marketId,
        },
        products: [{
          productId: product._id,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
          customization: priceRangeLabel
            ? `Buyer opened negotiation in listed price range: ${priceRangeLabel}`
            : undefined,
        }],
        financials: {
          subtotal,
          deliveryFee,
          platformCommission,
          gatewayFee,
          totalAmount: subtotal + deliveryFee + gatewayFee,
          sellerPayout: subtotal - platformCommission,
          riderPayout: 900,
        },
        payment: { method: 'MTN_MOMO' },
        attributes: { isQuoteRequest: 'true' },
        notes: `Negotiation started for ${product.name}`,
      };
      const { orderApi } = await import('@/lib/api');
      const response = await orderApi.post('/orders', payload);
      const order = response.data?.data || response.data;
      toast.success('Negotiation started. Redirecting...');
      router.push(`/orders?open=${order._id}`);
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Failed to start negotiation');
    }
  };

  const handleCart = (event: React.MouseEvent) => {
    event.preventDefault();
    trackProductSignal(product, 'add_to_cart');
    addToCart(product);
  };

  const handleWishlist = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!isInWishlist(product._id)) trackProductSignal(product, 'wishlist');
    toggleWishlist(product._id);
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 500);
  };

  return (
    <motion.div
      whileHover={{ y: -7, transition: { type: 'spring', stiffness: 380, damping: 26 } }}
      className="h-full"
    >
      <Link
        href={productUrl}
        onClick={() => trackProductSignal(product, 'product_view')}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e8d5c4] bg-white transition-all duration-300 hover:border-[#ff6b00]/40 hover:shadow-[0_20px_60px_-8px_rgba(255,107,0,0.18)]"
      >
        {/* ── Image ─────────────────────────────────────────── */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#f7f1ec]">
          {images[0] ? (
            <Image
              src={images[0]}
              alt={product.name}
              fill
              unoptimized
              sizes="(min-width: 1024px) 280px, 45vw"
              className={`object-cover transition-all duration-700 group-hover:scale-[1.09] group-hover:brightness-105 ${available ? '' : 'opacity-50 grayscale'}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e7164]">
              Image unavailable
            </div>
          )}

          {/* Shimmer sweep on hover */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-[750ms] group-hover:translate-x-[220%]" />

          {/* Bottom shadow reveal */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ff9f1c] px-2.5 py-1 shadow-sm font-mono text-[9px] font-bold uppercase tracking-wide text-[#221b00]">
              <BadgeCheck size={9} />
              Verified
            </span>
            {product.isMadeInRwanda && (
              <span className="rounded-full bg-white/92 px-2.5 py-1 shadow-sm font-mono text-[9px] font-bold uppercase tracking-wide text-[#ff6b00]">
                🇷🇼 Rwanda
              </span>
            )}
            {hasPromotion && (
              <span className="rounded-full bg-[#ba1a1a] px-2.5 py-1 shadow-sm font-mono text-[9px] font-bold uppercase tracking-wide text-white">
                SALE
              </span>
            )}
          </div>

          {/* Wishlist */}
          <motion.button
            type="button"
            onClick={handleWishlist}
            animate={heartPop ? { scale: [1, 1.45, 0.88, 1] } : { scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/92 shadow-md text-[#ff6b00] backdrop-blur-sm transition-all duration-200 hover:bg-[#ffedd5] hover:scale-110"
            aria-label="Toggle wishlist"
          >
            <Heart size={15} fill={isInWishlist(product._id) ? 'currentColor' : 'none'} />
          </motion.button>

          {/* Name peek on hover */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full transition-transform duration-[340ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0">
            <div className="bg-gradient-to-t from-black/60 via-black/25 to-transparent px-4 pb-3 pt-8">
              <p className="line-clamp-1 text-xs font-bold text-white/95">{product.name}</p>
            </div>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────── */}
        <div className={`flex flex-1 flex-col ${isCompact ? 'p-3' : 'p-4'}`}>
          {/* Category + Stock */}
          <div className="flex items-center justify-between gap-2">
            <span className="line-clamp-1 min-w-0 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#ff6b00]">
              {product.category || 'Product'}
            </span>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-bold ${available ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${available ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {available ? 'In stock' : 'Out'}
            </span>
          </div>

          {/* Name */}
          <h3 className={`${isCompact ? 'mt-2 text-sm' : 'mt-2.5 text-[15px]'} line-clamp-2 font-black leading-snug text-[#1b1c1c] transition-colors duration-200 group-hover:text-[#a04100]`}>
            {product.name}
          </h3>

          {/* Seller */}
          <p className="mt-1 line-clamp-1 text-[11px] font-medium text-[#8e7164]">
            by {sellerName}
          </p>

          <div className="flex-1" />

          {/* Price */}
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className={`${isCompact ? 'text-base' : 'text-xl'} font-black text-[#ff6b00]`}>
                {priceRangeLabel || formatCurrency(displayPrice)}
              </span>
              {hasPromotion && (
                <span className="text-xs font-semibold text-[#8e7164] line-through">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>
            <p className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#8e7164]">
              per {product.unit}
            </p>
          </div>

          {/* CTA */}
          <div className="mt-4">
            {isNegotiable ? (
              <motion.button
                type="button"
                onClick={handleNegotiation}
                whileTap={{ scale: 0.97 }}
                className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[#ff6b00] bg-white px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#ff6b00] transition-all duration-200 hover:bg-[#ffedd5] hover:shadow-md sm:text-[11px]"
              >
                <MessageCircle size={13} />
                Negotiate Price
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={handleCart}
                whileTap={{ scale: 0.97 }}
                className="group/btn inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b00] to-[#ff9340] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-md shadow-[#ff6b00]/25 transition-all duration-200 hover:from-[#e05300] hover:to-[#ff8000] hover:shadow-[0_8px_24px_rgba(255,107,0,0.38)] sm:text-[11px]"
              >
                <ShoppingCart size={13} className="transition-transform duration-300 group-hover/btn:scale-110" />
                {t('product_add_to_cart') || 'Add to cart'}
              </motion.button>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
