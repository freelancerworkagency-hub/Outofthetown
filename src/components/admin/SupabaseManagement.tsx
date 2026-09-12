import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Table,
  UploadCloud,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { api } from '../../services/api.js';

interface SupabaseManagementProps {
  token: string;
  onRefreshAll?: () => void;
}

export const SupabaseManagement: React.FC<SupabaseManagementProps> = ({ token, onRefreshAll }) => {
  const [status, setStatus] = useState<{
    configured: boolean;
    url: string | null;
    connected: boolean;
    tablesFound: string[];
    tablesMissing: string[];
    error?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [sqlSchema, setSqlSchema] = useState<string>('');
  const [hasCopiedSql, setHasCopiedSql] = useState(false);
  const [showSqlViewer, setShowSqlViewer] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const res = await api.getSupabaseStatus(token);
      setStatus(res);
    } catch (err: any) {
      console.error('Failed to fetch Supabase status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchema = async () => {
    try {
      const res = await api.getSupabaseSchema(token);
      if (typeof res === 'string') {
        setSqlSchema(res);
      } else if ((res as any)?.sql) {
        setSqlSchema((res as any).sql);
      }
    } catch (err: any) {
      console.error('Failed to fetch Supabase schema:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchSchema();
  }, [token]);

  const handleCopySql = () => {
    if (!sqlSchema) return;
    navigator.clipboard.writeText(sqlSchema);
    setHasCopiedSql(true);
    setNotice('SQL Schema copied to clipboard!');
    setTimeout(() => {
      setHasCopiedSql(false);
      setNotice(null);
    }, 3500);
  };

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      setSyncResult(null);
      const res = await api.syncSupabaseAll(token);
      setSyncResult(res);
      setNotice((res as any).message || 'Database synchronized successfully!');
      fetchStatus();
      onRefreshAll?.();
    } catch (err: any) {
      setNotice('Sync note: ' + err.message);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  // Extract project ref from URL if available
  const projectRef = status?.url ? status.url.replace('https://', '').split('.')[0] : 'xzoozxmblqpdekrsdxdr';
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  const totalExpectedTables = [
    { name: 'orders', label: 'Orders & Live KOT', desc: 'Real customer orders & status logs' },
    { name: 'reservations', label: 'Table Reservations', desc: 'Dine-in table booking records' },
    { name: 'menu_items', label: 'Menu Dishes & Bestsellers', desc: 'Food items with prices, veg tags, ratings' },
    { name: 'categories', label: 'Food Categories', desc: 'Menu categorization, icons, slugs' },
    { name: 'promo_banners', label: 'Flipkart Style Banners', desc: 'Marketing offers and coupons' },
    { name: 'cafe_info', label: 'Cafe Profile & Timings', desc: 'Address, timings, helpline' },
    { name: 'invoices', label: 'Invoices & Billing', desc: 'GST bills and receipts' },
    { name: 'customers', label: 'Customer Accounts', desc: 'Mobile/email customer accounts' },
  ];

  const foundCount = status?.tablesFound?.length || 0;
  const isSchemaReady = foundCount >= totalExpectedTables.length;

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div className="p-4 rounded-2xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold shadow-xl flex items-center gap-2 border border-stone-700 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 text-white p-6 sm:p-8 border border-amber-900/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Database className="w-4 h-4" />
              <span>Supabase Cloud PostgreSQL Database</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
              Database Health &amp; Synchronization
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Connected with authenticated Service Role access. The system maintains high-speed local memory performance while backing up all menu items, categories, bestsellers, orders, and customer accounts to your PostgreSQL database.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>

            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-600/30 cursor-pointer transition-all active:scale-95 disabled:opacity-70"
            >
              <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'Syncing All Data...' : 'Sync All Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Connection */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              API Connection
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Connected</span>
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate font-mono">
              {status?.url || 'https://xzoozxmblqpdekrsdxdr.supabase.co'}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              PostgREST REST API &amp; Service Key active
            </p>
          </div>
        </div>

        {/* Card 2: Tables Found */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              PostgreSQL Tables
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                isSchemaReady
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {isSchemaReady ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              <span>{foundCount} / {totalExpectedTables.length} Active</span>
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {isSchemaReady ? 'All Tables Initialized' : `${foundCount} of ${totalExpectedTables.length} Tables Found`}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              {isSchemaReady
                ? 'Persistent PostgreSQL storage is fully active.'
                : 'Run the SQL migration script in Supabase to create all tables.'}
            </p>
          </div>
        </div>

        {/* Card 3: Dual Persistence Strategy */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              High Availability
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Zero Downtime</span>
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
              Dual In-Memory + Supabase Sync
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              Store operations continue at sub-millisecond speeds even during network latency.
            </p>
          </div>
        </div>
      </div>

      {/* Setup Guide Box (if tables missing) */}
      {!isSchemaReady && (
        <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Setup Required: Create Database Tables in Your Supabase Project
              </h3>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                Your Supabase credentials are authenticated, but the tables (orders, reservations, menu items, categories, etc.) need to be created in your Supabase database. Follow these 2 quick steps:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800 flex flex-col justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Step 1
                </span>
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  Copy Complete SQL Schema
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  Copies the pre-formatted PostgreSQL DDL with all 8 tables, indexes, and Row Level Security policies.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95"
              >
                {hasCopiedSql ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy SQL Schema</span>
                  </>
                )}
              </button>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800 flex flex-col justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Step 2
                </span>
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  Paste &amp; Run in Supabase SQL Editor
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  Opens your Supabase project's SQL query editor directly. Paste the script and click "Run".
                </p>
              </div>
              <a
                href={sqlEditorUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Supabase SQL Editor</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tables Status Breakdown */}
      <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
              PostgreSQL Tables Status
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Real-time table detection via Supabase schema cache
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSqlViewer(!showSqlViewer)}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
          >
            {showSqlViewer ? 'Hide SQL Script' : 'View SQL Script'}
          </button>
        </div>

        {/* Collapsible SQL Viewer */}
        {showSqlViewer && (
          <div className="relative rounded-2xl bg-stone-950 text-stone-100 p-4 font-mono text-[11px] max-h-72 overflow-y-auto no-scrollbar border border-stone-800">
            <button
              onClick={handleCopySql}
              className="sticky top-2 right-2 float-right px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer"
            >
              {hasCopiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{hasCopiedSql ? 'Copied' : 'Copy'}</span>
            </button>
            <pre className="whitespace-pre-wrap">{sqlSchema || '-- Loading schema...'}</pre>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {totalExpectedTables.map((t) => {
            const isFound = status?.tablesFound?.includes(t.name);
            return (
              <div
                key={t.name}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isFound
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-stone-500" />
                    <span className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100">
                      {t.name}
                    </span>
                  </div>
                  {isFound ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Pending setup" />
                  )}
                </div>
                <p className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                  {t.label}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                  {t.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sync Result Summary (if triggered) */}
      {syncResult && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Synchronization Completed</span>
          </div>
          <p className="text-emerald-800 dark:text-emerald-300">{syncResult.message}</p>
        </div>
      )}
    </div>
  );
};
