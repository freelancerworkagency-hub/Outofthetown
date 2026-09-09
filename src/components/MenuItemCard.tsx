import React from 'react';
import { Star, Plus, Minus, Clock, Flame } from 'lucide-react';
import type { MenuItem } from '../types.js';
import { useCart } from '../context/CartContext.js';

interface MenuItemCardProps {
  item: MenuItem;
  onOpenDetails?: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onOpenDetails }) => {
  const { getItemQuantity, addItem, updateQuantity } = useCart();
  const quantity = getItemQuantity(item.id);

  return (
    <div
      id={`menu-item-${item.id}`}
      className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500 shadow-xs hover:shadow-xl transition-all duration-300"
    >
      <div className="flex gap-4">
        {/* Left Dish Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Dietary Badge & Bestseller Flag */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* Zomato Veg / Non-Veg Icon */}
              <span
                title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                className={`w-4 h-4 rounded-xs border flex items-center justify-center p-0.5 shrink-0 ${
                  item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                />
              </span>

              {item.isBestseller && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  <Flame className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                  Bestseller
                </span>
              )}

              {item.isVegan && (
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  Vegan
                </span>
              )}
            </div>

            {/* Dish Title */}
            <h3
              onClick={() => onOpenDetails?.(item)}
              className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1 cursor-pointer"
            >
              {item.name}
            </h3>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-2 mt-1 mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-md bg-emerald-700 text-white shadow-2xs">
                <span>{item.rating.toFixed(1)}</span>
                <Star className="w-3 h-3 fill-white" />
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                ({item.reviewsCount} reviews)
              </span>
              {item.preparationTimeMinutes && (
                <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 font-medium ml-1">
                  <Clock className="w-3 h-3" />
                  {item.preparationTimeMinutes} min
                </span>
              )}
            </div>

            {/* Price & Discount */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-base sm:text-lg font-bold font-mono text-stone-900 dark:text-stone-100">
                ₹{item.price}
              </span>
              {item.originalPrice && (
                <span className="text-xs sm:text-sm font-mono text-stone-400 line-through">
                  ₹{item.originalPrice}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed font-normal">
              {item.description}
            </p>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {item.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Dish Image & Zomato-Style ADD Button */}
        <div className="relative shrink-0 flex flex-col items-center">
          <div
            onClick={() => onOpenDetails?.(item)}
            className="w-28 sm:w-32 h-28 sm:h-32 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 cursor-pointer shadow-inner"
          >
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Zomato-Style Overlay ADD / Counter Button */}
          <div className="absolute -bottom-3 w-[88%] z-10">
            {!item.isAvailable ? (
              <div className="w-full py-1.5 bg-stone-300 dark:bg-stone-700 text-stone-600 dark:text-stone-400 text-xs font-bold rounded-xl text-center shadow-xs cursor-not-allowed uppercase tracking-wider">
                Sold Out
              </div>
            ) : quantity === 0 ? (
              <button
                id={`add-btn-${item.id}`}
                onClick={() => addItem(item)}
                className="w-full py-2 bg-white dark:bg-stone-900 border-2 border-amber-600 dark:border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer tracking-wider"
              >
                <span>ADD</span>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <div className="w-full py-1.5 px-2 bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-between">
                <button
                  id={`decrement-btn-${item.id}`}
                  onClick={() => updateQuantity(item.id, -1)}
                  aria-label="Decrease quantity"
                  className="w-6 h-6 flex items-center justify-center hover:bg-amber-700 rounded-md transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <span className="font-mono font-bold text-sm px-1">{quantity}</span>
                <button
                  id={`increment-btn-${item.id}`}
                  onClick={() => updateQuantity(item.id, 1)}
                  aria-label="Increase quantity"
                  className="w-6 h-6 flex items-center justify-center hover:bg-amber-700 rounded-md transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
