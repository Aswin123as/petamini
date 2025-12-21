import { useEffect } from 'react';
import { ExternalLink, Sparkles, TrendingUp } from 'lucide-react';

interface NativeAdData {
  id: string;
  title: string;
  description: string;
  image: string;
  ctaText: string;
  ctaUrl: string;
  sponsorName: string;
  sponsorLogo?: string;
  category?: string;
}

interface NativeAdCardProps {
  ad: NativeAdData;
  onAdClick: (adId: string) => void;
  onAdImpression: (adId: string) => void;
}

export function NativeAdCard({
  ad,
  onAdClick,
  onAdImpression,
}: NativeAdCardProps) {
  // Track impression when component mounts
  useEffect(() => {
    onAdImpression(ad.id);
  }, [ad.id, onAdImpression]);

  const handleClick = () => {
    onAdClick(ad.id);
    window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border border-blue-100 rounded-lg p-3 transition-all hover:shadow-md">
      {/* Sponsored Label - Transparent like Zomato */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="font-medium text-xs text-gray-900">
            {ad.sponsorName}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Sponsored Badge */}
          <span className="px-2 py-0.5 bg-white/60 backdrop-blur-sm rounded-full text-[9px] font-medium text-gray-600 border border-white/40">
            Sponsored
          </span>

          {/* Fake promote button for visual consistency */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-white/60 backdrop-blur-sm border border-white/40">
            <TrendingUp className="w-3 h-3 text-gray-600" />
            <span className="text-gray-600">Ad</span>
          </div>
        </div>
      </div>

      {/* Ad Content */}
      <button
        onClick={handleClick}
        className="w-full text-left group cursor-pointer"
      >
        {/* Image Preview */}
        {ad.image && (
          <div className="relative mb-2 rounded-lg overflow-hidden">
            <img
              src={ad.image}
              alt={ad.title}
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {/* Category Badge on Image */}
            {ad.category && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md">
                <span className="text-[10px] font-medium text-white">
                  {ad.category}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {ad.title}
          </h3>
          <p className="text-xs text-gray-700 line-clamp-2">{ad.description}</p>
        </div>

        {/* CTA Button - Zomato Style */}
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">Tap to learn more</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg group-hover:shadow-lg transition-shadow">
            <span className="text-xs font-medium text-white">{ad.ctaText}</span>
            <ExternalLink className="w-3 h-3 text-white" />
          </div>
        </div>
      </button>
    </div>
  );
}

// Ad Configuration Hook
export function useNativeAds() {
  // Sample ad inventory - in production, fetch from API
  const adInventory: NativeAdData[] = [
    {
      id: 'ad-001',
      title: '🚀 Launch Your Telegram Bot in Minutes',
      description:
        'Build powerful bots with our no-code platform. 1000+ templates, AI integration, and analytics included.',
      image:
        'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format',
      ctaText: 'Get Started',
      ctaUrl: 'https://example.com/telegram-bot-builder',
      sponsorName: 'BotBuilder',
      category: '🤖 Tools',
    },
    {
      id: 'ad-002',
      title: '💎 Premium Link Shortener - 50% Off',
      description:
        'Custom domains, QR codes, analytics & retargeting. Trusted by 10,000+ marketers.',
      image:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format',
      ctaText: 'Claim Offer',
      ctaUrl: 'https://example.com/link-shortener',
      sponsorName: 'LinkPro',
      category: '🔗 Marketing',
    },
    {
      id: 'ad-003',
      title: '📚 Free eBook: Viral Content Strategies',
      description:
        'Learn how top creators get 10M+ views. 50 proven tactics for social media growth.',
      image:
        'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=800&auto=format',
      ctaText: 'Download Free',
      ctaUrl: 'https://example.com/viral-ebook',
      sponsorName: 'GrowthHacks',
      category: '📈 Growth',
    },
    {
      id: 'ad-004',
      title: '⚡ 10x Your Productivity with AI Tools',
      description:
        'Curated collection of 100+ AI tools for content, design, and automation.',
      image:
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format',
      ctaText: 'Explore Tools',
      ctaUrl: 'https://example.com/ai-tools',
      sponsorName: 'AI Directory',
      category: '🤖 AI',
    },
  ];

  const getRandomAd = (): NativeAdData => {
    return adInventory[Math.floor(Math.random() * adInventory.length)];
  };

  const getAdsForFeed = (
    postCount: number,
    adFrequency: number = 5
  ): Map<number, NativeAdData> => {
    // Insert ads every N posts
    const adPositions = new Map<number, NativeAdData>();

    for (let i = adFrequency; i < postCount; i += adFrequency) {
      adPositions.set(i, getRandomAd());
    }

    return adPositions;
  };

  return {
    adInventory,
    getRandomAd,
    getAdsForFeed,
  };
}
