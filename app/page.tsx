'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  RefreshCwIcon,
  SearchIcon,
  TruckIcon,
  PackageCheckIcon,
  PackageXIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface StatusReason {
  remarque: string
  commentaires: string
  station: string
  livreur: string
  created_at: string
  tracking: string
}

interface DeliveryOrder {
  tracking: string
  reference: string
  client: string
  phone: string
  adresse: string
  stop_desk: number
  wilaya_id: number
  montant: string
  tarif_prestation: string
  tarif_retour: string
  created_at: string
  livred_at: string | null
  driver_name: string | null
  driver_phone: string | null
  products: string
  status: string
  global_status: string
  status_reason: StatusReason[]
}

interface ApiResponse {
  current_page: number
  data: DeliveryOrder[]
  last_page: number
  total: number
  per_page: number
}

// ── Constants ────────────────────────────────────────────────────────────────

const TOKEN   = process.env.NEXT_PUBLIC_ANDERSON_API_TOKEN ?? ''
const BASE    = process.env.NEXT_PUBLIC_ANDERSON_BASE_URL ?? 'https://anderson-ecommerce.ecotrack.dz/api/v1'

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  vers_wilaya:          { label: 'Vers wilaya',        bg: 'bg-blue-100',   text: 'text-blue-800' },
  en_preparation:       { label: 'En préparation',     bg: 'bg-purple-100', text: 'text-purple-800' },
  en_livraison:         { label: 'En livraison',        bg: 'bg-amber-100',  text: 'text-amber-800' },
  'livré_non_encaissé': { label: 'Livré',              bg: 'bg-green-100',  text: 'text-green-800' },
  'encaissé_non_payé':  { label: 'Encaissé',           bg: 'bg-teal-100',   text: 'text-teal-800' },
  retour_en_traitement: { label: 'Retour',             bg: 'bg-red-100',    text: 'text-red-800' },
}

const GLOBAL_STATUS_MAP: Record<string, { label: string; dot: string }> = {
  en_process: { label: 'En cours',  dot: 'bg-amber-400' },
  livre:      { label: 'Livré',     dot: 'bg-green-500' },
  retour:     { label: 'Retour',    dot: 'bg-red-500' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dt: string | null) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, bg: 'bg-gray-100', text: 'text-gray-700' }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [orders, setOrders]     = useState<DeliveryOrder[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage]         = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal]       = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE}/get/orders?api_token=${TOKEN}&page=${p}`)
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`)
      const json: ApiResponse = await res.json()
      setOrders(json.data)
      setLastPage(json.last_page)
      setTotal(json.total)
      setPage(json.current_page)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.client.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search) ||
      o.tracking.toLowerCase().includes(search.toLowerCase()) ||
      o.reference.toLowerCase().includes(search.toLowerCase()) ||
      o.products.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.global_status === statusFilter
    return matchSearch && matchStatus
  })

  const counts = {
    total,
    en_process: orders.filter((o) => o.global_status === 'en_process').length,
    livre:      orders.filter((o) => o.global_status === 'livre').length,
    retour:     orders.filter((o) => o.global_status === 'retour').length,
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6'>

      {/* ── Header ── */}
      <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Hind Tracking</h1>
          <p className='mt-0.5 text-sm text-gray-500'>Anderson Ecotrack · {total} expéditions au total</p>
        </div>
        <button
          onClick={() => load(page)}
          disabled={loading}
          className='inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50'
        >
          <RefreshCwIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* ── Stats ── */}
      <div className='mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {[
          { icon: TruckIcon, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Total', value: total },
          { icon: ClockIcon, color: 'text-amber-500', bg: 'bg-amber-50', label: 'En cours', value: counts.en_process },
          { icon: PackageCheckIcon, color: 'text-green-500', bg: 'bg-green-50', label: 'Livré', value: counts.livre },
          { icon: PackageXIcon, color: 'text-red-500', bg: 'bg-red-50', label: 'Retour', value: counts.retour },
        ].map(({ icon: Icon, color, bg, label, value }) => (
          <div key={label} className='flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm'>
            <div className={`rounded-lg ${bg} p-2`}>
              <Icon className={`size-5 ${color}`} />
            </div>
            <div>
              <p className='text-xs text-gray-500'>{label}</p>
              <p className='text-xl font-bold text-gray-900'>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className='mb-4 flex flex-wrap items-center gap-3'>
        <div className='relative flex-1 min-w-[200px] max-w-sm'>
          <SearchIcon className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
          <input
            type='text'
            placeholder='Chercher client, tracking, produit…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
          />
        </div>
        <div className='flex gap-1.5'>
          {['all', 'en_process', 'livre', 'retour'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'Tous' : GLOBAL_STATUS_MAP[s]?.label ?? s}
            </button>
          ))}
        </div>
        <span className='text-xs text-gray-400'>{filtered.length} résultats</span>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className='mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3'>
          <p className='text-sm font-medium text-red-700'>Erreur : {error}</p>
          {!TOKEN && (
            <p className='mt-1 text-xs text-red-500'>
              Ajoutez <code className='font-mono'>NEXT_PUBLIC_ANDERSON_API_TOKEN</code> dans <code className='font-mono'>.env.local</code>
            </p>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className='overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500'>
                <th className='px-4 py-3'>Tracking / Réf.</th>
                <th className='px-4 py-3'>Client</th>
                <th className='px-4 py-3'>Produits</th>
                <th className='px-4 py-3 text-right'>Montant</th>
                <th className='px-4 py-3'>Statut</th>
                <th className='px-4 py-3'>Livreur</th>
                <th className='px-4 py-3'>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className='py-16 text-center text-sm text-gray-400'>
                    <RefreshCwIcon className='mx-auto mb-2 size-5 animate-spin' />
                    Chargement…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className='py-16 text-center text-sm text-gray-400'>
                    Aucun résultat.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <React.Fragment key={o.tracking}>
                    <tr
                      key={o.tracking}
                      className='cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50'
                      onClick={() => setExpanded(expanded === o.tracking ? null : o.tracking)}
                    >
                      <td className='px-4 py-3'>
                        <div className='font-mono text-xs text-gray-500'>{o.tracking}</div>
                        <div className='text-xs text-gray-400'>{o.reference}</div>
                      </td>
                      <td className='px-4 py-3'>
                        <div className='font-medium text-gray-900'>{o.client}</div>
                        <div className='text-xs text-gray-500'>{o.phone}</div>
                        {o.adresse && o.adresse !== '-' && (
                          <div className='text-xs text-gray-400'>{o.adresse}</div>
                        )}
                        {o.stop_desk === 1 && (
                          <span className='mt-0.5 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600'>
                            Stop desk
                          </span>
                        )}
                      </td>
                      <td className='max-w-[220px] px-4 py-3'>
                        <p className='line-clamp-2 text-xs text-gray-600'>{o.products}</p>
                      </td>
                      <td className='px-4 py-3 text-right font-semibold tabular-nums text-gray-900'>
                        {Number(o.montant) > 0 ? `${Number(o.montant).toLocaleString('fr-DZ')} DA` : '—'}
                      </td>
                      <td className='px-4 py-3'>
                        <StatusBadge status={o.status} />
                        {o.global_status in GLOBAL_STATUS_MAP && (
                          <div className='mt-1 flex items-center gap-1'>
                            <span className={`size-1.5 rounded-full ${GLOBAL_STATUS_MAP[o.global_status].dot}`} />
                            <span className='text-[10px] text-gray-500'>{GLOBAL_STATUS_MAP[o.global_status].label}</span>
                          </div>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        {o.driver_name ? (
                          <>
                            <div className='text-xs font-medium text-gray-700'>{o.driver_name}</div>
                            <div className='text-xs text-gray-400'>{o.driver_phone}</div>
                          </>
                        ) : (
                          <span className='text-xs text-gray-300'>—</span>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='text-xs text-gray-500'>{fmt(o.created_at)}</div>
                        {o.livred_at && (
                          <div className='text-xs text-green-600'>{fmt(o.livred_at)}</div>
                        )}
                      </td>
                    </tr>

                    {/* Expanded status history */}
                    {expanded === o.tracking && o.status_reason.length > 0 && (
                      <tr key={`${o.tracking}-exp`} className='bg-blue-50'>
                        <td colSpan={7} className='px-6 py-4'>
                          <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700'>
                            Historique des statuts
                          </p>
                          <ol className='space-y-1.5'>
                            {o.status_reason.map((r, i) => (
                              <li key={i} className='flex items-start gap-3 text-xs text-gray-700'>
                                <span className='mt-0.5 shrink-0 text-blue-400'>#{i + 1}</span>
                                <div>
                                  <span className='font-medium'>{r.remarque}</span>
                                  {r.commentaires && <span className='ml-1 text-gray-500'>· {r.commentaires}</span>}
                                  <div className='text-gray-400'>{r.station} · {r.livreur} · {fmt(r.created_at)}</div>
                                </div>
                              </li>
                            ))}
                          </ol>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {lastPage > 1 && (
        <div className='mt-4 flex items-center justify-between'>
          <span className='text-sm text-gray-500'>
            Page <span className='font-medium'>{page}</span> sur <span className='font-medium'>{lastPage}</span>
          </span>
          <div className='flex gap-2'>
            <button
              disabled={page <= 1 || loading}
              onClick={() => load(page - 1)}
              className='inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40'
            >
              <ChevronLeftIcon className='size-4' />
              Précédent
            </button>
            <button
              disabled={page >= lastPage || loading}
              onClick={() => load(page + 1)}
              className='inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40'
            >
              Suivant
              <ChevronRightIcon className='size-4' />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
