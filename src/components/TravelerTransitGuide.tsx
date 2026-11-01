import React, { useState } from 'react';
import {
  CreditCard,
  MapPin,
  Train,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const TravelerTransitGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cards' | 'transfers' | 'trains' | 'etiquette'>('cards');

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              First-Time Traveler's Korean Transit Handbook
            </h3>
            <p className="text-xs text-slate-400">
              Essential tips, transfer tricks & etiquette for visiting South Korea
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Seoul Metro & KTX Verified</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('cards')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'cards'
              ? 'bg-slate-800 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Transit Cards (T-Money & Climate)</span>
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'transfers'
              ? 'bg-slate-800 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>The 30-Min Free Transfer Rule</span>
        </button>

        <button
          onClick={() => setActiveTab('trains')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'trains'
              ? 'bg-slate-800 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Train className="w-3.5 h-3.5" />
          <span>KTX & SRT High-Speed Rail</span>
        </button>

        <button
          onClick={() => setActiveTab('etiquette')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'etiquette'
              ? 'bg-slate-800 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Must-Know Etiquette</span>
        </button>
      </div>

      {/* TAB 1: Transit Cards */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                Most Versatile
              </div>
              <h4 className="text-sm font-bold text-white mt-1">T-Money Card (티머니)</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                The universal rechargeable card accepted on all subways, city buses, and taxis throughout South Korea. Buy at any convenience store (CU, GS25, 7-Eleven) or Incheon Airport for ₩4,000 (~$3) and top up with Korean Won cash.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              ✓ Works in Seoul, Busan, Jeju, Daegu
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Seoul Unlimited Passes
              </div>
              <h4 className="text-sm font-bold text-white mt-1">Climate Card (기후동행카드)</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Offers unlimited rides on Seoul subways, city buses, and the Ddareungi public bikes. Tourist short-term passes are available in 1-day (₩5,000), 2-day (₩8,000), 3-day (₩10,000), and 5-day (₩15,000) passes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              ✓ Best for high-frequency travel in Seoul
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                All-in-One Foreigner Card
              </div>
              <h4 className="text-sm font-bold text-white mt-1">WOWPASS / Namane Card</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Prepaid foreign-currency debit card + built-in T-money chip. You can exchange foreign currency directly at airport kiosks and pay like a local credit card while also tapping for buses and subways.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              ✓ Built-in currency exchange kiosk support
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: The 30-Min Transfer Rule */}
      {activeTab === 'transfers' && (
        <div className="flex flex-col gap-4">
          <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 shrink-0">
              <Clock className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <h4 className="text-sm font-bold text-white">
                How to Get ₩0 Free Transfers Between Bus and Subway
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                When you transfer between subway lines or between a bus and a subway within <strong>30 minutes</strong> of tapping out (60 minutes from 9 PM to 7 AM), you do not pay a base fare again! You can transfer up to <strong>4 times</strong> across 5 transit legs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                CRITICAL STEP: ALWAYS TAP OUT!
              </h5>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                On Korean buses, you <strong>must tap your card when exiting (하차태그)</strong> at the rear door. If you forget to tap out before getting off the bus, you will be charged the maximum distance penalty and lose your transfer discount!
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                NAVIGATION APP TIP FOR KOREA
              </h5>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Google Maps does not have full walking directions in Korea due to national mapping security laws. Download <strong>Naver Map (네이버 지도)</strong> or <strong>KakaoMap</strong>. Both have full English interfaces with live bus arrival times!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KTX & SRT High-Speed Rail */}
      {activeTab === 'trains' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase">
              Speed: 305 km/h
            </div>
            <h4 className="text-sm font-bold text-white mt-1">KTX (Korail Express)</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Departs from Seoul Station or Yongsan Station. Connects Seoul to Busan in 2 hours 15 minutes, or Gangneung on the East Coast in 1.5 hours. Book tickets on the official <strong>Korail Talk</strong> app or website up to 1 month in advance.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] font-mono text-blue-400 font-bold uppercase">
              Gangnam Terminal
            </div>
            <h4 className="text-sm font-bold text-white mt-1">SRT (Super Rapid Train)</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Departs from <strong>Suseo Station</strong> in southern Seoul (Gangnam area). Great if you are staying in Gangnam, Jamsil, or Pangyo. Rates are ~10% cheaper than KTX with comfortable legroom.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] font-mono text-amber-400 font-bold uppercase">
              Foreigner Rail Pass
            </div>
            <h4 className="text-sm font-bold text-white mt-1">Korail Pass (KORAIL PASS)</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Special multi-day rail pass exclusively for foreign tourists. Allows unlimited rides on almost all Korail trains including KTX for 2 to 5 consecutive or flexible select days.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: Must-Know Etiquette */}
      {activeTab === 'etiquette' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4" />
              Pink Pregnant Seats & Elderly Areas
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Leave the pink seats (reserved for expectant mothers) and the 3-seat benches at each end of the car (for the elderly and disabled) vacant, even on a completely crowded train.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
              <Smartphone className="w-4 h-4" />
              Silent Mode & Low Voice
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Always set your smartphone to vibration / silent mode (매너모드). Phone conversations are discouraged on trains and buses; if you must take an urgent call, whisper or speak quietly into the mic.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4" />
              Food & Drinks on Buses
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Seoul city bus drivers will not allow passengers to board with open takeout cups of coffee, boba, or uncovered food. Sealed water bottles or items inside backpacks are permitted.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
