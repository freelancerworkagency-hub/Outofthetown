import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Cake,
  Upload,
  Image as ImageIcon,
  Check,
  ChevronRight,
  MessageCircle,
  Clock,
  ShieldCheck,
  Flame,
  Utensils,
  Calendar,
  Layers,
  Heart,
  X,
  Terminal,
} from 'lucide-react';

interface ServiceCommandSectionProps {
  onOpenCustomCake: (initialImage?: string, initialFlavor?: string) => void;
  onOpenReservation: () => void;
  onSelectFoodService: () => void;
  className?: string;
}

type ServiceTab = 'book_table' | 'order_food' | 'custom_cake';

// Reference Cake Inspiration Presets
const QUICK_INSPIRATION_PRESETS = [
  {
    id: 'vintage_lambeth',
    title: 'Vintage Lambeth & Cherries',
    flavor: 'Belgian Dark Chocolate Truffle',
    command: '!cake --style=lambeth --flavor=belgian-truffle',
    tag: 'Trending',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'pastel_floral',
    title: 'Pastel Floral Watercolor',
    flavor: 'Red Velvet with Cream Cheese',
    command: '!cake --style=floral --flavor=red-velvet',
    tag: 'Birthday Favorite',
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'chocolate_drip',
    title: 'Royal Ganache Drip',
    flavor: 'Ferrero Rocher & Roasted Hazelnut',
    command: '!cake --style=ganache-drip --flavor=ferrero',
    tag: 'Chocoholic',
    image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'korean_bento',
    title: 'Minimalist Bento Cake',
    flavor: 'Lotus Biscoff Caramel Crunch',
    command: '!cake --style=bento-palette --weight=0.5kg',
    tag: 'Aesthetic Bento',
    image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=400&q=80',
  },
];

// Twitch Commands list for custom cake
const TWITCH_COMMANDS = [
  { cmd: '!design', desc: 'Launch full 3D/AI custom cake studio & upload photo' },
  { cmd: '!flavor', desc: 'Belgian Truffle, Red Velvet, Rasmalai Saffron, Biscoff...' },
  { cmd: '!eggless', desc: '100% Pure Vegetarian certified gourmet sponge' },
  { cmd: '!weight', desc: '0.5kg (Bento), 1kg, 2kg, up to 5kg+ multi-tiered' },
  { cmd: '!message', desc: 'Custom piped message on chocolate greeting plaque' },
  { cmd: '!express', desc: 'Highway traveler rush baking within 3–4 hours' },
];

export const ServiceCommandSection: React.FC<ServiceCommandSectionProps> = ({
  onOpenCustomCake,
  onOpenReservation,
  onSelectFoodService,
  className = '',
}) => {
  const [selectedService, setSelectedService] = useState<ServiceTab>('custom_cake');
  const [activeCommand, setActiveCommand] = useState<string>('!design');
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setUploadedPreview(reader.result);
          onOpenCustomCake(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setUploadedPreview(reader.result);
          onOpenCustomCake(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (preset: typeof QUICK_INSPIRATION_PRESETS[0]) => {
    onOpenCustomCake(preset.image, preset.flavor);
  };

  const handleCopyCommand = (cmd: string) => {
    setCopiedCommand(cmd);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <section
      id="service-selector-section"
      className={`w-full my-6 sm:my-8 transition-all ${className}`}
    >
      {/* 1. Header: SELECT YOUR SERVICE (matching image.png) */}
      <div className="text-center mb-3 sm:mb-4">
        <h2 className="text-sm sm:text-base md:text-lg font-bold tracking-[0.25em] uppercase text-stone-800 dark:text-stone-100 font-sans">
          SELECT YOUR SERVICE
        </h2>
      </div>

      {/* 2. Three-Option Segmented Pill Bar (matching image.png) */}
      <div className="max-w-3xl mx-auto px-2">
        <div
          id="service-pill-bar"
          className="rounded-3xl bg-[#e6eaee] dark:bg-stone-850 p-1.5 sm:p-2 border border-stone-300/80 dark:border-stone-700/80 shadow-xs grid grid-cols-3 gap-1 sm:gap-2"
        >
          {/* Option 1: Book a Table > */}
          <button
            id="btn-service-book-table"
            type="button"
            onClick={() => {
              setSelectedService('book_table');
            }}
            className={`flex flex-col items-center justify-center py-2.5 sm:py-3.5 px-1 sm:px-3 rounded-2xl transition-all cursor-pointer select-none group text-center ${
              selectedService === 'book_table'
                ? 'border-2 border-sky-400 bg-sky-100/80 dark:bg-sky-950/60 dark:border-sky-500 shadow-sm text-sky-950 dark:text-sky-100 font-bold scale-[1.01]'
                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            {/* Outline icon of table with 2 chairs */}
            <div className="h-10 sm:h-12 flex items-center justify-center mb-1">
              <svg
                viewBox="0 0 64 64"
                className="w-8 h-8 sm:w-10 sm:h-10 stroke-current fill-none transition-transform group-hover:scale-105"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Left Chair */}
                <path d="M14 22v16M10 32h8M12 38v14M16 38v14" />
                <path d="M12 22h4" />
                {/* Center Dining Table */}
                <path d="M22 26h20M24 26v4h16v-4" />
                <path d="M32 30v14M24 44h16" />
                {/* Right Chair */}
                <path d="M50 22v16M46 32h8M48 38v14M52 38v14" />
                <path d="M48 22h4" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-semibold tracking-tight inline-flex items-center gap-0.5">
              <span>Book a Table</span>
              <span className="text-stone-400 font-normal">&gt;</span>
            </span>
          </button>

          {/* Option 2: Order Food > (Selected highlight style in image.png) */}
          <button
            id="btn-service-order-food"
            type="button"
            onClick={() => {
              setSelectedService('order_food');
              onSelectFoodService();
            }}
            className={`flex flex-col items-center justify-center py-2.5 sm:py-3.5 px-1 sm:px-3 rounded-2xl transition-all cursor-pointer select-none group text-center ${
              selectedService === 'order_food'
                ? 'border-2 border-sky-400 bg-sky-100/80 dark:bg-sky-950/60 dark:border-sky-500 shadow-sm text-sky-950 dark:text-sky-100 font-bold scale-[1.01]'
                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            {/* Outline cloche / food dome platter icon */}
            <div className="h-10 sm:h-12 flex items-center justify-center mb-1">
              <svg
                viewBox="0 0 64 64"
                className="w-8 h-8 sm:w-10 sm:h-10 stroke-current fill-none transition-transform group-hover:scale-105"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Cloche Top Handle */}
                <circle cx="32" cy="18" r="2.5" />
                {/* Cloche Dome */}
                <path d="M16 36c0-8.837 7.163-14 16-14s16 5.163 16 14" />
                {/* Lower dome rim */}
                <path d="M14 36h36" />
                {/* Platter Base */}
                <path d="M18 41h28M14 41a2 2 0 0 0 2 2h32a2 2 0 0 0 2-2" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-semibold tracking-tight inline-flex items-center gap-0.5">
              <span>Order Food</span>
              <span className="text-stone-400 font-normal">&gt;</span>
            </span>
          </button>

          {/* Option 3: Design & Order a Cake > */}
          <button
            id="btn-service-custom-cake"
            type="button"
            onClick={() => {
              setSelectedService('custom_cake');
            }}
            className={`flex flex-col items-center justify-center py-2.5 sm:py-3.5 px-1 sm:px-3 rounded-2xl transition-all cursor-pointer select-none group text-center ${
              selectedService === 'custom_cake'
                ? 'border-2 border-sky-400 bg-sky-100/80 dark:bg-sky-950/60 dark:border-sky-500 shadow-sm text-sky-950 dark:text-sky-100 font-bold scale-[1.01]'
                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            {/* Outline tiered cake + artist brush, palette & blueprint scroll icon */}
            <div className="h-10 sm:h-12 flex items-center justify-center mb-1">
              <svg
                viewBox="0 0 64 64"
                className="w-8 h-8 sm:w-10 sm:h-10 stroke-current fill-none transition-transform group-hover:scale-105"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Artist Paint Brush on left */}
                <path d="M14 18l2-6 2 6v6h-4z" />
                <path d="M16 24v8" />

                {/* Tiered Cake in middle */}
                {/* Top tier */}
                <path d="M28 22h10v6H28z" />
                <path d="M30 18c0-1.5 3-1.5 3 0s3 0 3 0" />
                {/* Middle tier */}
                <path d="M25 28h16v7H25z" />
                {/* Bottom tier */}
                <path d="M22 35h22v8H22z" />
                {/* Cake base plate */}
                <path d="M19 43h28" />

                {/* Painter Palette with color blobs at bottom left */}
                <path d="M18 40a5 5 0 1 0-7 6c2 3 6 4 9 2" />
                <circle cx="15" cy="43" r="0.75" />
                <circle cx="18" cy="45" r="0.75" />

                {/* Blueprint scroll on right */}
                <path d="M47 24h6v20h-6z" />
                <path d="M49 28h2M49 32h2M49 36h2" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-semibold tracking-tight inline-flex items-center gap-0.5">
              <span>Design &amp; Order a Cake</span>
              <span className="text-stone-400 font-normal">&gt;</span>
            </span>
          </button>
        </div>
      </div>

      {/* 3. The Card Container Below with Sparkle Icon (matching image.png) */}
      <div className="max-w-4xl mx-auto px-2 mt-3 sm:mt-4">
        <div className="relative rounded-3xl bg-[#eceff3]/90 dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-6 md:p-7 shadow-sm overflow-hidden">
          {/* Top Right Sparkle Star Icon (matching image.png) */}
          <div className="absolute top-4 sm:top-5 right-4 sm:right-5 pointer-events-none text-stone-400 dark:text-stone-500">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500/80 dark:text-amber-400/80 animate-pulse" />
          </div>

          {/* VIEW A: Custom Cake Section with Twitch Panels Commands Design Idea */}
          {selectedService === 'custom_cake' && (
            <div className="space-y-5 sm:space-y-6">
              {/* Twitch Panel Ribbon Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-300/70 dark:border-stone-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-950 text-purple-200 border border-purple-800/80 font-mono text-[11px] font-bold tracking-wider shadow-xs">
                      <Terminal className="w-3 h-3 text-purple-400" />
                      <span>!BAKERY_STUDIO</span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      Made-To-Order Celebration Cakes
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-1">
                    Need a custom celebration cake with your own reference design?
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl mt-1">
                    Upload your photo, select customized flavors, eggless options, weight, and celebration message. Our master pastry chef bakes it fresh for your event!
                  </p>
                </div>

                {/* Direct Action Button */}
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    id="btn-twitch-launch-cake"
                    type="button"
                    onClick={() => onOpenCustomCake()}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-rose-400 to-amber-400 hover:from-amber-300 hover:to-rose-300 text-stone-950 font-bold text-xs sm:text-sm shadow-md shadow-rose-950/20 hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Cake className="w-4 h-4" />
                    <span>Design Custom Cake</span>
                  </button>
                </div>
              </div>

              {/* Twitch Commands Terminal Bar */}
              <div className="rounded-2xl bg-stone-950 text-stone-100 p-3 sm:p-4 border border-stone-800 shadow-inner space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-[11px] text-stone-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
                    <span className="font-bold uppercase tracking-wider text-purple-300">
                      Twitch Command Console (!commands)
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500">Click any command to execute</span>
                </div>

                {/* Command Pills List */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {TWITCH_COMMANDS.map((item) => (
                    <button
                      key={item.cmd}
                      type="button"
                      onClick={() => {
                        setActiveCommand(item.cmd);
                        handleCopyCommand(item.cmd);
                        if (item.cmd === '!design') {
                          onOpenCustomCake();
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer border text-xs flex flex-col justify-between ${
                        activeCommand === item.cmd
                          ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                          : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <span className="font-bold text-amber-400">{item.cmd}</span>
                      <span className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">
                        {copiedCommand === item.cmd ? 'Executed ✓' : item.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag-and-Drop Photo Reference Box & Quick Specs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Dropzone / Upload Box */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-400 p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-white/70 dark:bg-stone-850/70 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    Upload Cake Reference Photo
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Drag &amp; drop or click to browse (!photo-upload)
                  </span>
                </div>

                {/* Popular Artisanal Flavors */}
                <div className="rounded-2xl bg-white/70 dark:bg-stone-850/70 border border-stone-200 dark:border-stone-800 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Trending Flavors (!flavor)</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {['Belgian Truffle', 'Rasmalai Saffron', 'Red Velvet', 'Lotus Biscoff', 'Fresh Fruit'].map(
                      (fl) => (
                        <span
                          key={fl}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCustomCake(undefined, fl);
                          }}
                          className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-900/40 dark:hover:text-amber-200 cursor-pointer transition-colors"
                        >
                          {fl}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Guarantee & Highway Dispatch */}
                <div className="rounded-2xl bg-white/70 dark:bg-stone-850/70 border border-stone-200 dark:border-stone-800 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Bakery Standards (!specs)</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-stone-600 dark:text-stone-400">
                    <p className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>100% Pure Veg / Eggless Available</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Insulated Highway Temperature Carrier</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span>Express Highway Dispatch (!express)</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Inspiration Gallery Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Quick Reference Inspiration (Click to Load)
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenCustomCake()}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    View All in Studio &gt;
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {QUICK_INSPIRATION_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset)}
                      className="group relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 shadow-2xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
                    >
                      <div className="aspect-4/3 overflow-hidden bg-stone-100 dark:bg-stone-800">
                        <img
                          src={preset.image}
                          alt={preset.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-2 space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                            {preset.tag}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                          {preset.title}
                        </h4>
                        <p className="text-[10px] text-stone-500 line-clamp-1">
                          {preset.flavor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW B: Order Food (Active Cloche option) */}
          {selectedService === 'order_food' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-300/70 dark:border-stone-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-950 text-sky-200 border border-sky-800 font-mono text-[11px] font-bold tracking-wider">
                      <Terminal className="w-3 h-3 text-sky-400" />
                      <span>!ORDER_FOOD</span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      Highway Restaurant Menu
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-1">
                    Authentic Flavors, Wood-Fired Specialties &amp; Artisanal Bakery
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                    Browse our full restaurant menu below or filter by vegetarian, bestsellers, and quick prep.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const menuEl = document.getElementById('menu-heading');
                    menuEl?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-950/20 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Browse Full Menu</span>
                </button>
              </div>

              {/* Twitch Commands for Food */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {[
                  { cmd: '!bestsellers', label: 'Top-Rated Dishes' },
                  { cmd: '!pure-veg', label: '100% Vegetarian' },
                  { cmd: '!quick-prep', label: 'Fast 15-min Highway Prep' },
                  { cmd: '!express-delivery', label: 'NH-48 Doorstep Run' },
                ].map((item) => (
                  <div
                    key={item.cmd}
                    className="p-2.5 rounded-xl bg-white/80 dark:bg-stone-850/80 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200"
                  >
                    <span className="font-bold text-sky-600 dark:text-sky-400 block">{item.cmd}</span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 font-sans mt-0.5 block">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW C: Book a Table Option */}
          {selectedService === 'book_table' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-300/70 dark:border-stone-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-200 border border-emerald-800 font-mono text-[11px] font-bold tracking-wider">
                      <Terminal className="w-3 h-3 text-emerald-400" />
                      <span>!BOOK_TABLE</span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Dine-In Table Reservation
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-1">
                    Reserve Your Table at Out of the Town (Kukas, NH-48)
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                    Indoor AC seating, open-air garden lawn, or rooftop ambiance. Instant confirmation.
                  </p>
                </div>

                <button
                  id="btn-twitch-book-table"
                  type="button"
                  onClick={onOpenReservation}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/20 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Reserve a Table Now</span>
                </button>
              </div>

              {/* Twitch Commands for Booking */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {[
                  { cmd: '!indoor-ac', label: 'Cozy Family Seating' },
                  { cmd: '!garden-lawn', label: 'Open-Air Highway Lawn' },
                  { cmd: '!party-hall', label: 'Group & Birthday Events' },
                  { cmd: '!instant-hold', label: 'Zero Booking Fee' },
                ].map((item) => (
                  <div
                    key={item.cmd}
                    className="p-2.5 rounded-xl bg-white/80 dark:bg-stone-850/80 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200"
                  >
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">{item.cmd}</span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 font-sans mt-0.5 block">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
