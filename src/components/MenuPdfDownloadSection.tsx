import React, { useState } from 'react';
import { FileDown, Check, Loader2 } from 'lucide-react';
import type { MenuItem, Category, CafeInfo } from '../types.js';
import { generateMenuPdf } from '../utils/menuPdfGenerator.js';

interface MenuPdfDownloadSectionProps {
  menuItems: MenuItem[];
  categories: Category[];
  cafeInfo?: CafeInfo | null;
  className?: string;
}

/**
 * Small inline button saying "Download Menu" on the side.
 */
export const MenuPdfDownloadSection: React.FC<MenuPdfDownloadSectionProps> = ({
  menuItems,
  categories,
  cafeInfo,
  className = '',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      await generateMenuPdf(menuItems, categories, cafeInfo, {
        fileName: 'Out_of_the_Town_Menu.pdf',
      });
      setHasDownloaded(true);
      setTimeout(() => setHasDownloaded(false), 3500);
    } catch (err) {
      console.error('Failed to generate menu PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`flex items-center justify-end my-3 ${className}`}>
      <button
        id="btn-download-menu-inline"
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80 text-xs font-bold transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-2xs disabled:opacity-70"
        title="Download complete food & bakery menu with photos, descriptions & prices (PDF)"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
            <span>Preparing PDF...</span>
          </>
        ) : hasDownloaded ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Menu Downloaded!</span>
          </>
        ) : (
          <>
            <FileDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Download Menu</span>
          </>
        )}
      </button>
    </div>
  );
};

/**
 * Small docked floating button saying "Download Menu" on the side of the screen.
 */
export const FloatingSideDownloadMenuButton: React.FC<{
  menuItems: MenuItem[];
  categories: Category[];
  cafeInfo?: CafeInfo | null;
}> = ({ menuItems, categories, cafeInfo }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      await generateMenuPdf(menuItems, categories, cafeInfo, {
        fileName: 'Out_of_the_Town_Menu.pdf',
      });
      setHasDownloaded(true);
      setTimeout(() => setHasDownloaded(false), 3500);
    } catch (err) {
      console.error('Failed to generate menu PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <aside aria-label="Download menu quick action" className="fixed right-0 top-1/2 -translate-y-1/2 z-35 pointer-events-auto">
      <button
        id="floating-side-download-menu-btn"
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        className="group flex items-center gap-1.5 px-3 py-2.5 bg-gradient-to-l from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs rounded-l-2xl shadow-xl shadow-amber-950/30 border-y border-l border-amber-400/40 transition-all hover:pr-4 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-75"
        title="Download complete menu with food photos, descriptions, prices & contact details (PDF)"
      >
        {isGenerating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-200 shrink-0" />
        ) : hasDownloaded ? (
          <Check className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
        ) : (
          <FileDown className="w-3.5 h-3.5 text-amber-200 group-hover:scale-110 transition-transform shrink-0" />
        )}
        <span className="text-xs font-bold tracking-tight whitespace-nowrap">
          {isGenerating ? 'Preparing...' : hasDownloaded ? 'Downloaded!' : 'Download Menu'}
        </span>
      </button>
    </aside>
  );
};
