import React, { useRef, useEffect, useState, useCallback } from 'react';

// Declare Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        openInvoice: (
          invoice: string,
          callback: (status: string) => void
        ) => void;
        initData: string;
        initDataUnsafe: any;
      };
    };
  }
}

interface Pokemon {
  name: string;
  image: string;
  types: string[];
  height: number;
  weight: number;
  rarity?: 'common' | 'rare' | 'legendary';
  // Add purchase-related properties
  totalUnits?: number;
  availableUnits?: number;
  pricePerUnit?: number; // Telegram Stars per unit
  id: string;
}

interface PokemonCardProps extends Pokemon {
  onPurchase?: (pokemonId: string, units: number) => void;
}

const typeColors: Record<string, string> = {
  grass: '#78C850',
  poison: '#A040A0',
  fire: '#F08030',
  water: '#6890F0',
  bug: '#A8B820',
  normal: '#A8A878',
  electric: '#F8D030',
  ground: '#E0C068',
  fairy: '#EE99AC',
  fighting: '#C03028',
  psychic: '#F85888',
  rock: '#B8A038',
  ghost: '#705898',
  ice: '#98D8D8',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  flying: '#A890F0',
};

const PokemonCard: React.FC<PokemonCardProps> = ({
  name,
  image,
  types = [],
  height,
  weight,
  rarity = 'common',
  totalUnits = 100,
  availableUnits = 100,
  pricePerUnit = 1,
  id,
  onPurchase,
}) => {
  // Input validation
  if (!name || !image || !id) {
    console.warn('PokemonCard: Missing required props (name, image, or id)');
    return null;
  }

  if (availableUnits < 0 || totalUnits < 0 || pricePerUnit < 0) {
    console.warn('PokemonCard: Invalid numeric values');
    return null;
  }
  const cardRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [gradientPos, setGradientPos] = useState(45);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    'success' | 'failed' | null
  >(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const primaryType = (
    types && types.length > 0 ? types[0] : 'normal'
  ).toLowerCase();
  const primaryColor = typeColors[primaryType] || '#A8A878';
  const secondaryColor =
    types && types.length > 1
      ? typeColors[types[1].toLowerCase()] || primaryColor
      : primaryColor;

  // Floating animation - Fixed memory leak
  useEffect(() => {
    const styleId = 'pokemon-float-animation';

    // Check if global style already exists
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes float-pokemon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-float-pokemon {
          animation: float-pokemon 3s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
      styleRef.current = style;
    } else {
      styleRef.current = document.getElementById(styleId) as HTMLStyleElement;
    }

    return () => {
      // Don't remove global styles - they might be used by other instances
      styleRef.current = null;
    };
  }, []);

  // Intersection Observer for visibility optimization
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Optimized gradient animation - only runs when visible
  useEffect(() => {
    if (!isVisible) return;

    const animate = () => {
      setGradientPos((prev) => (prev + 1) % 360);
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation with a slower rate (every ~100ms)
    const startAnimation = () => {
      if (animationRef.current) return;
      animate();
    };

    const intervalId = setInterval(startAnimation, 100);

    return () => {
      clearInterval(intervalId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isVisible]);

  // Focus management for modal
  useEffect(() => {
    if (showPurchaseModal && modalRef.current) {
      const modalElement = modalRef.current;
      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      const trapFocus = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      modalElement.addEventListener('keydown', trapFocus);
      return () => {
        modalElement.removeEventListener('keydown', trapFocus);
      };
    }
  }, [showPurchaseModal]);

  const rarityGlow = {
    common: 'drop-shadow-[0_0_6px_rgba(255,255,255,0.25)]',
    rare: 'drop-shadow-[0_0_12px_rgba(147,51,234,0.5)]',
    legendary: 'drop-shadow-[0_0_20px_rgba(234,179,8,0.7)]',
  };

  const rarityBorder = {
    common: 'border-white/20',
    rare: 'border-purple-400/40',
    legendary: 'border-yellow-400/50',
  };

  const openModal = () => {
    setShowPurchaseModal(true);
  };

  const closeModal = () => {
    setShowPurchaseModal(false);
    setSelectedUnits(1);
    setIsLoading(false);
  };

  const closeStatusModal = () => {
    setPaymentStatus(null);
  };

  const handlePurchase = () => {
    if (availableUnits > 0 && id) {
      openModal();
    }
  };

  const confirmPurchase = useCallback(async () => {
    if (!id || selectedUnits <= 0) return;

    // Close modal immediately when Buy Now is clicked
    closeModal();

    try {
      // Get Telegram user ID
      const tg = window.Telegram?.WebApp;
      const userId = tg?.initDataUnsafe?.user?.id;

      // Validate that we have a real Telegram user
      if (!userId) {
        throw new Error(
          'This feature only works in Telegram. Please open the app from Telegram.'
        );
      }

      // Create invoice record in backend
      console.log('Creating invoice record in backend...');
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

      const invoiceResponse = await fetch(
        `${backendUrl}/api/payments/create-invoice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pokemonId: id,
            units: selectedUnits,
            userId: userId,
          }),
        }
      );

      if (!invoiceResponse.ok) {
        throw new Error('Failed to create invoice');
      }

      const invoiceData = await invoiceResponse.json();
      console.log('✅ Invoice created:', invoiceData);

      // Check if Telegram WebApp is available
      if (typeof window !== 'undefined' && tg) {
        // Calculate total cost
        const totalCost = selectedUnits * pricePerUnit;

        // Create invoice for Telegram Stars
        const invoice = {
          title: `${name} Pokemon Cards`,
          description: `Purchase ${selectedUnits} units of ${name}`,
          payload: invoiceData.invoicePayload, // Use payload from backend
          provider_token: '', // Empty for Telegram Stars
          currency: 'XTR', // Telegram Stars currency
          prices: [
            {
              label: `${name} x${selectedUnits}`,
              amount: totalCost,
            },
          ],
        };

        // Request payment
        tg.openInvoice(JSON.stringify(invoice), async (status: string) => {
          if (status === 'paid') {
            console.log('Payment successful!');
            // Call the onPurchase callback if provided
            if (onPurchase) {
              onPurchase(id, selectedUnits);
            }
            // Show success status
            setPaymentStatus('success');
            // Auto-close after 3 seconds
            setTimeout(() => setPaymentStatus(null), 3000);
          } else if (status === 'failed') {
            console.log('Payment failed:', status);
            setPaymentStatus('failed');
            // Auto-close after 3 seconds
            setTimeout(() => setPaymentStatus(null), 3000);
          } else {
            console.log('Payment cancelled:', status);
            // Don't show modal for cancellation
          }
        });
      } else {
        // Fallback for testing outside Telegram
        console.log('✅ Testing mode: Invoice record created in database');
        console.log(`Invoice Payload: ${invoiceData.invoicePayload}`);
        console.log(`Total Stars: ${invoiceData.totalStars}`);
        console.log(
          `Purchasing ${selectedUnits} units of ${name} for ${
            selectedUnits * pricePerUnit
          } stars`
        );

        // Simulate async purchase
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (onPurchase) {
          await onPurchase(id, selectedUnits);
        }

        // Show success status for testing
        setPaymentStatus('success');
        setTimeout(() => setPaymentStatus(null), 3000);
      }
    } catch (error) {
      console.error('❌ Purchase failed:', error);
      setPaymentStatus('failed');
      setTimeout(() => setPaymentStatus(null), 3000);
    }
  }, [id, selectedUnits, name, pricePerUnit, onPurchase]);
  const unitProgress =
    totalUnits > 0 ? ((totalUnits - availableUnits) / totalUnits) * 100 : 0;

  return (
    <div
      ref={cardRef}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 select-none
        hover:scale-[1.03] active:scale-[0.98]
        ${rarityGlow[rarity]}`}
      style={{
        background: `linear-gradient(145deg, ${primaryColor}25, ${secondaryColor}15)`,
        width: '280px',
        height: '340px',
        minHeight: '340px',
        maxHeight: '340px',
      }}
    >
      {/* Animated overlay */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
        style={{
          background: `linear-gradient(${gradientPos}deg, ${primaryColor}40 0%, transparent 40%, ${secondaryColor}40 80%, transparent 100%)`,
        }}
      />

      {/* Border shimmer */}
      <div
        className={`absolute inset-0 rounded-2xl border-2 ${rarityBorder[rarity]} pointer-events-none`}
        style={{
          background: `linear-gradient(${
            gradientPos * 1.5
          }deg, rgba(255,255,255,0.1), transparent 40%, rgba(255,255,255,0.2) 80%, transparent)`,
        }}
      />

      {/* Glass layer */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/5" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between p-2">
        {/* Availability Badge */}
        <div className="absolute top-1 right-1 z-20">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-xs text-white font-medium">
            {availableUnits}/{totalUnits}
          </div>
        </div>

        {/* Image */}
        <div className="flex justify-center items-center flex-1">
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="w-24 h-24 object-contain animate-float-pokemon transition-transform duration-700 drop-shadow-2xl"
          />
        </div>

        {/* Info */}
        <div className="space-y-1 mt-1">
          {/* Name */}
          <h2 className="text-base font-bold text-center text-white leading-tight break-words px-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            {name}
          </h2>

          {/* Types */}
          <div className="flex justify-center gap-1 flex-wrap">
            {types.map((type) => {
              const color = typeColors[type.toLowerCase()] || '#A8A878';
              return (
                <span
                  key={type}
                  className="text-xs font-bold px-2 py-0.5 rounded-full capitalize text-white shadow-lg backdrop-blur-md"
                  style={{
                    background: `linear-gradient(135deg, ${color}95, ${color}70)`,
                  }}
                >
                  {type}
                </span>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
              style={{ width: `${unitProgress}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-2 text-white/90 pt-0.5">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold">
                {(height / 10).toFixed(1)}m
              </span>
              <p className="text-xs opacity-60 tracking-wider uppercase">
                Height
              </p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold">
                {(weight / 10).toFixed(1)}kg
              </span>
              <p className="text-xs opacity-60 tracking-wider uppercase">
                Weight
              </p>
            </div>
          </div>

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={availableUnits === 0}
            className={`w-full py-1.5 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 text-sm
                ${
                  availableUnits > 0
                    ? 'bg-yellow-500/90 hover:bg-yellow-400/90 text-black'
                    : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                }`}
          >
            <span className="text-xs">⭐</span>
            {availableUnits > 0 ? `${pricePerUnit} Stars/unit` : 'Sold Out'}
          </button>
        </div>
      </div>

      {/* Purchase Modal - Card Overlay */}
      {showPurchaseModal && (
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30 rounded-2xl"
          onClick={closeModal}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeModal();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <div
            ref={modalRef}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 w-full h-full border border-white/20 relative shadow-2xl flex flex-col justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
              }}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center text-white text-sm font-bold transition-all touch-manipulation focus:outline-none focus:ring-1 focus:ring-white/50"
              aria-label="Close modal"
              autoFocus
            >
              ×
            </button>
            <div className="text-center mb-3">
              <h3
                id="modal-title"
                className="text-sm font-bold text-white mb-1"
              >
                Purchase {name}
              </h3>
              <p id="modal-description" className="text-white/70 text-xs">
                Buy with Telegram Stars
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-center mb-2">
                  <span className="text-white/80 text-xs">
                    Available: {availableUnits}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedUnits(Math.max(1, selectedUnits - 1));
                    }}
                    disabled={selectedUnits <= 1}
                    className="bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-lg w-8 h-8 flex items-center justify-center text-white font-bold text-lg touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Decrease units"
                  >
                    −
                  </button>

                  <div className="flex-1 text-center">
                    <div className="text-white font-bold text-lg">
                      {selectedUnits}
                    </div>
                    <div className="text-yellow-400 font-bold text-sm">
                      ⭐ {selectedUnits * pricePerUnit}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedUnits(
                        Math.min(availableUnits || 1, selectedUnits + 1)
                      );
                    }}
                    disabled={selectedUnits >= (availableUnits || 1)}
                    className="bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-lg w-8 h-8 flex items-center justify-center text-white font-bold text-lg touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Increase units"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal();
                  }}
                  disabled={isLoading}
                  className="flex-1 py-2 px-2 rounded-lg bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-medium transition-all text-xs touch-manipulation focus:outline-none focus:ring-1 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Cancel purchase"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    confirmPurchase();
                  }}
                  disabled={isLoading || selectedUnits <= 0}
                  className="flex-1 py-2 px-2 rounded-lg bg-yellow-500/90 hover:bg-yellow-400/90 active:bg-yellow-600/90 text-black font-medium transition-all text-xs touch-manipulation focus:outline-none focus:ring-1 focus:ring-yellow-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Purchase ${selectedUnits} units for ${
                    selectedUnits * pricePerUnit
                  } stars`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Status Modal */}
      {paymentStatus && (
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40 rounded-2xl"
          onClick={closeStatusModal}
        >
          <div
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full h-full border border-white/20 relative shadow-2xl flex flex-col justify-center items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {paymentStatus === 'success' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <svg
                    className="w-10 h-10 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Payment Successful!
                </h3>
                <p className="text-white/70 text-sm text-center">
                  Your {name} cards have been added to your collection.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                  <svg
                    className="w-10 h-10 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Payment Failed
                </h3>
                <p className="text-white/70 text-sm text-center">
                  Something went wrong. Please try again.
                </p>
              </>
            )}
            <button
              onClick={closeStatusModal}
              className="mt-6 px-6 py-2 rounded-lg bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-medium transition-all text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokemonCard;
