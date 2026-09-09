import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Table,
  Zap,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api.js';

interface SupabaseDatabaseTabProps {
  token: string;
  onNotification: (msg: string) => void;
}

interface SupabaseStatus {
  configured: boolean;
  url: string | null;
  connected: boolean;
  tablesFound: string[];
  tablesMissing?: string[];
  error?: string;
}

export const SupabaseDatabaseTab: React.FC<SupabaseDatabaseTabProps> = ({
  token,
  onNotification,
}) => {
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [schemaSql, setSchemaSql] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStatusAndSchema = async () => {
    setIsLoading(true);
    try {
      const [statusRes, sqlRes] = await Promise.all([
        api.getSupabaseStatus(token),
        api.getSupabaseSchema(token),
      ]);
      setStatus(statusRes);
      setSchemaSql(sqlRes);
    } catch (err: any) {
      onNotification(err.message || 'Failed to load Supabase info');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndSchema();
  }, [token]);

  const handleCopySql = () => {
    if (!schemaSql) return;
    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    onNotification('Supabase SQL schema copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      const result = await api.syncSupabaseAll(token);
      onNotification(
        `Synced ${result.syncedOrders} orders & ${result.syncedReservations} reservations with Supabase!`
      );
      await fetchStatusAndSchema();
    } catch (err: any) {
      onNotification(err.message || 'Sync failed. Please ensure tables exist in Supabase.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Derive Supabase project dashboard link if available
  const projectRef = status?.url ? status.url.replace(/^https?:\/\//, '').split('.')[0] : null;
  const sqlEditorUrl = projectRef ? `https://supabase.com/dashboard/project/${projectRef}/sql/new` : 'https://supabase.com/dashboard';

  const allExpected = ['orders', 'reservations', 'menu_items', 'promo_banners', 'cafe_info', 'invoices'];
  const tablesActiveCount = status?.tablesFound ? status.tablesFound.length : 0;
  const hasPendingTables = tablesActiveCount < allExpected.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Supabase PostgreSQL Database
                {status?.connected ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-sans font-semibold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connected ({tablesActiveCount}/{allExpected.length} Active)
                  </span>
                ) : status?.configured ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-sans font-semibold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Connected (Tables Pending)
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-sans font-semibold inline-flex items-center gap-1">
                    In-Memory Fallback Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Centralized cloud data persistence for orders, reservations, live tracking, and cafe catalog.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatusAndSchema}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>

          <button
            onClick={handleSyncData}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Zap className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync To Supabase'}</span>
          </button>
        </div>
      </div>

      {/* Setup Guidance Banner if tables are not yet generated in Supabase */}
      {status?.configured && hasPendingTables && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">
                Supabase Connected • 1-Minute Table Setup
              </p>
              <p className="text-amber-800/80 dark:text-amber-300/80 text-[11px] mt-0.5">
                Your database URL and API keys are verified. To enable cloud synchronization, run the SQL schema script below in your Supabase project's SQL Editor. The local in-memory store remains 100% active and safe in the meantime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy SQL</span>
            </button>
            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold hover:bg-amber-100 dark:hover:bg-stone-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Open SQL Editor</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Connection & URL */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Supabase Endpoint
            </span>
            <Server className="w-4 h-4 text-stone-400" />
          </div>
          <div className="pt-1">
            <p className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
              {status?.url ? status.url : 'Awaiting SUPABASE_URL in Settings'}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              {status?.configured
                ? 'Valid API credentials recognized'
                : 'Configure SUPABASE_URL & SUPABASE_ANON_KEY in Settings panel'}
            </p>
          </div>
        </div>

        {/* Card 2: Tables Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Active Schema Tables
            </span>
            <Table className="w-4 h-4 text-stone-400" />
          </div>
          <div className="pt-1">
            <div className="flex flex-wrap gap-1.5">
              {allExpected.map((tbl) => {
                const found = status?.tablesFound?.includes(tbl);
                return (
                  <span
                    key={tbl}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                      found
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                    }`}
                  >
                    {tbl} {found ? '✓' : ''}
                  </span>
                );
              })}
            </div>
            <p className="text-[11px] text-stone-400 mt-2">
              {status?.tablesFound && status.tablesFound.length > 0
                ? `${status.tablesFound.length} of ${allExpected.length} tables active in database`
                : 'Run SQL script below in Supabase SQL Editor'}
            </p>
          </div>
        </div>

        {/* Card 3: Storage Engine Mode */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Operational Engine
            </span>
            <Shield className="w-4 h-4 text-stone-400" />
          </div>
          <div className="pt-1">
            <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">
              {status?.connected ? 'Hybrid Cloud Storage' : 'Resilient In-Memory Store'}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              {status?.connected
                ? 'Writes sync to Supabase with in-memory caching for zero latency.'
                : 'Seamless fallback keeps food orders and reservations 100% operational.'}
            </p>
          </div>
        </div>
      </div>

      {/* SQL Migration & Setup Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Supabase SQL DDL Schema Script
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Creates tables, indices, and Row Level Security policies for Out of the Town Restro & Bakery.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
            </button>
            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer transition-colors"
            >
              <span>Open SQL Editor</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800">
            <span className="font-bold text-stone-900 dark:text-stone-100 block mb-0.5">
              1. Open SQL Editor
            </span>
            <p className="text-stone-500 text-[11px]">
              Open your Supabase project dashboard and click on <strong>SQL Editor</strong>.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800">
            <span className="font-bold text-stone-900 dark:text-stone-100 block mb-0.5">
              2. Paste & Run Schema
            </span>
            <p className="text-stone-500 text-[11px]">
              Paste the SQL code below and click <strong>Run</strong> to generate all tables & RLS policies.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800">
            <span className="font-bold text-stone-900 dark:text-stone-100 block mb-0.5">
              3. Click Refresh Status
            </span>
            <p className="text-stone-500 text-[11px]">
              Click <strong>Refresh Status</strong> or <strong>Sync To Supabase</strong> to verify full cloud persistence.
            </p>
          </div>
        </div>

        {/* Code Box */}
        <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-950 font-mono text-[12px] text-stone-200">
          <div className="flex items-center justify-between px-4 py-2 bg-stone-900 border-b border-stone-800 text-[11px] text-stone-400">
            <span>supabase_schema.sql</span>
            <span className="text-[10px]">PostgreSQL 15+ / Supabase RLS</span>
          </div>
          <pre className="p-4 overflow-x-auto max-h-72 text-[11px] leading-relaxed select-all">
            {schemaSql || 'Loading schema...'}
          </pre>
        </div>
      </div>
    </div>
  );
};
