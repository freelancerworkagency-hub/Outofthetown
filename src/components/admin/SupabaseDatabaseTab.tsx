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
                    Connected
                  </span>
                ) : status?.configured ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-sans font-semibold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Configured (Tables Pending)
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-sans font-semibold inline-flex items-center gap-1">
                    In-Memory Fallback Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Centralized cloud data persistence for orders, tables, live tracking & cafe catalog.
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

      {/* Status Overview Banner */}
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
              Detected Tables
            </span>
            <Table className="w-4 h-4 text-stone-400" />
          </div>
          <div className="pt-1">
            <div className="flex flex-wrap gap-1.5">
              {['orders', 'reservations', 'menu_items', 'promo_banners'].map((tbl) => {
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
                ? `${status.tablesFound.length} relational tables active`
                : 'Run SQL migration script below in your Supabase SQL Editor'}
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
                : 'Seamless zero-downtime fallback keeps customer ordering 100% operational.'}
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
              Copy this script and paste it into your Supabase Dashboard ➔ SQL Editor ➔ Click Run.
            </p>
          </div>

          <button
            onClick={handleCopySql}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
          </button>
        </div>

        {/* Instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800">
            <span className="font-bold text-stone-900 dark:text-stone-100 block mb-0.5">
              1. Open Supabase Dashboard
            </span>
            <p className="text-stone-500 text-[11px]">
              Go to your project at supabase.com and navigate to the <strong>SQL Editor</strong> tab.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800">
            <span className="font-bold text-stone-900 dark:text-stone-100 block mb-0.5">
              2. Paste & Run Schema
            </span>
            <p className="text-stone-500 text-[11px]">
              Paste the SQL schema below and click <strong>Run</strong> to generate all tables & RLS rules.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800">
            <span className="font-bold text-stone-900 dark:text-stone-100 block mb-0.5">
              3. Set Environment Secrets
            </span>
            <p className="text-stone-500 text-[11px]">
              Add <strong>SUPABASE_URL</strong> and <strong>SUPABASE_ANON_KEY</strong> in App Settings.
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
