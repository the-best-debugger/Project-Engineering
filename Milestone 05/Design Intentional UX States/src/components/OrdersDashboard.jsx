//  YOUR FOUR TASKS
//
//  LOADING STATE (while data is being fetched)
//
//  SUCCESS STATE (data loaded, orders present)
//
//  EMPTY STATE (data loaded, but zero orders returned)
//
//  ERROR STATE (the API call failed)
//
//   HOW TO TEST EACH STATE
//
//  Open src/mockApi.js and change the SIMULATE constant:
//    'loading'  → tests your loading state (hangs forever)
//    'success'  → tests your success state (8 orders returned)
//    'empty'    → tests your empty state   (0 orders returned)
//    'error'    → tests your error state   (API throws error)

import { useState, useEffect } from 'react'
import { fetchOrders } from '../mockApi'

//Sub-components (already built for you)

function SkeletonRow() {
  return (
    <tr>
      {[120, 170, 120, 130, 120, 120].map((w, i) => (
        <td key={i} style={{ padding: '16px 20px' }}>
          <div style={{
            width: w, height: 13, borderRadius: 6,
            background: 'linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }} />
        </td>
      ))}
    </tr>
  )
}

function LoadingState() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, idx) => (
        <SkeletonRow key={idx} />
      ))}
    </>
  )
}

function OrderRow({ order }) {
  const STATUS_CONFIG = {
    Delivered:  { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  dot: '#10b981' },
    Shipped:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  dot: '#3b82f6' },
    Processing: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
    Pending:    { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', dot: '#8b5cf6' },
    Cancelled:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  dot: '#ef4444' },
  }
  const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending

  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <td style={{ padding: '15px 20px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{order.id}</td>
      <td style={{ padding: '15px 20px', color: 'var(--text-primary)', fontWeight: 500 }}>{order.customer}</td>
      <td style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: 13 }}>{order.date}</td>
      <td style={{ padding: '15px 20px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 13 }}>₹{order.amount.toLocaleString()}</td>
      <td style={{ padding: '15px 20px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
          {order.status}
        </span>
      </td>
      <td style={{ padding: '15px 20px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: order.priority === 'High' ? 'var(--red-dim)' : 'var(--blue-dim)',
          color: order.priority === 'High' ? 'var(--red)' : 'var(--blue)',
          padding: '4px 10px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
        }}>
          {order.priority === 'High' ? '⚑ High' : '• Normal'}
        </span>
      </td>
    </tr>
  )
}

function SuccessState({ orders }) {
  return (
    <>
      {orders.map(order => <OrderRow key={order.id} order={order} />)}
    </>
  )
}

function EmptyState({ isFiltered, onClearFilter }) {
  return (
    <tr>
      <td colSpan={6}>
        <div style={{ padding: '80px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{
            width: 68,
            height: 68,
            borderRadius: 16,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}>
            {isFiltered ? '🔎' : '📭'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {isFiltered ? 'No matching orders found' : 'No orders yet'}
          </div>
          <div style={{ color: 'var(--text-secondary)', maxWidth: 320, lineHeight: 1.6 }}>
            {isFiltered
              ? 'No orders match the current status filter. Clear filters to view all orders.'
              : 'Orders from operations, warehouse, and customer support teams will appear here once created.'}
          </div>
          {isFiltered ? (
            <button onClick={onClearFilter} style={{
              marginTop: 8,
              padding: '10px 24px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius)',
              color: '#000',
              fontSize: 14,
              fontWeight: 700,
            }}>
              Clear filters
            </button>
          ) : (
            <button style={{
              marginTop: 8,
              padding: '10px 24px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 500,
            }}>
              Create your first order
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

function ErrorState({ message, onRetry }) {
  const getErrorDetails = (text) => {
    if (!text) {
      return {
        title: 'Unable to load orders',
        body: 'No response received from the orders service. Please retry.',
      }
    }
    if (text.includes('503')) {
      return {
        title: 'Orders service is temporarily unavailable',
        body: 'The API returned 503. Wait a few seconds and retry. If the issue persists, contact platform support.',
      }
    }
    if (text.toLowerCase().includes('network')) {
      return {
        title: 'Network issue detected',
        body: 'Orderly could not reach the API. Check connectivity and retry.',
      }
    }
    if (text.toLowerCase().includes('timeout')) {
      return {
        title: 'Request timed out',
        body: 'The server took too long to respond. Retry once your connection is stable.',
      }
    }
    return {
      title: 'Order fetch failed',
      body: text,
    }
  }

  const details = getErrorDetails(message)

  return (
    <tr>
      <td colSpan={6}>
        <div style={{ padding: '80px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{
            width: 68,
            height: 68,
            borderRadius: 16,
            border: '1px solid rgba(239,68,68,0.35)',
            background: 'var(--red-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}>
            ⚠️
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{details.title}</div>
          <div style={{ color: 'var(--text-secondary)', maxWidth: 340, fontSize: 14, fontFamily: 'var(--mono)' }}>
            {details.body}
          </div>
          <button onClick={onRetry} style={{
            marginTop: 8,
            padding: '10px 24px',
            background: 'var(--red-dim)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: 'var(--radius)',
            color: '#fecaca',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            ↻ Retry request
          </button>
        </div>
      </td>
    </tr>
  )
}

//Main Dashboard Component

export default function OrdersDashboard() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const loadOrders = () => {
    // Reset state before each fetch
    setLoading(true)
    setError(null)
    setOrders([])

    fetchOrders()
      .then(data => {
        const enrichedOrders = data.map((order) => ({
          ...order,
          priority: order.status === 'Pending' || order.status === 'Processing' || order.amount >= 15000
            ? 'High'
            : 'Normal',
        }))
        setOrders(enrichedOrders)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadOrders()
  }, [])

  // DASHBOARD STATS (already implemented — do not change)
  const totalRevenue   = orders.reduce((s, o) => s + (o.status !== 'Cancelled' ? o.amount : 0), 0)
  const needsAttention = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length
  const statusBreakdown = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {})
  const visibleOrders = statusFilter === 'all'
    ? orders
    : orders.filter(order => order.status === statusFilter)
  const emptyFromFilter = !loading && !error && orders.length > 0 && visibleOrders.length === 0

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Orders</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage and track all customer orders in one place.</p>
        </div>
        <button onClick={loadOrders} style={{
          padding: '10px 20px', background: 'var(--accent)', color: '#000',
          border: 'none', borderRadius: 'var(--radius)', fontSize: 14,
          fontWeight: 600, cursor: 'pointer',
        }}>
          ↻ Refresh
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Total Orders', value: loading ? '—' : orders.length, icon: '🧾', color: 'var(--blue)' },
          { label: 'Total Value', value: loading ? '—' : `₹${totalRevenue.toLocaleString()}`, icon: '💰', color: 'var(--accent)' },
          { label: 'Needs Attention', value: loading ? '—' : needsAttention, icon: '⏳', color: 'var(--purple)' },
        ].map((card, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{card.label}</span>
              <span style={{ fontSize: 20 }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: card.color, fontFamily: 'var(--mono)' }}>{card.value}</div>
          </div>
        ))}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 32,
        padding: '14px 16px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Status breakdown:</span>
          {loading ? (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Calculating...</span>
          ) : Object.keys(statusBreakdown).sort().map(status => (
            <span key={status} style={{
              fontSize: 12,
              color: 'var(--text-primary)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '4px 10px',
            }}>
              {status}: {statusBreakdown[status]}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="status-filter" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Filter</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 13,
              padding: '6px 10px',
            }}
          >
            <option value="all">All statuses</option>
            {Object.keys(statusBreakdown).sort().map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── ORDERS TABLE ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Recent Orders
            {!loading && !error && (
              <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>
                {orders.length} {orders.length === 1 ? 'order' : 'orders'}
              </span>
            )}
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Order ID', 'Customer Name', 'Order Date', 'Total Amount', 'Status', 'Priority Flag'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>

              {loading && <LoadingState />}
              {!loading && error && <ErrorState message={error} onRetry={loadOrders} />}
              {!loading && !error && visibleOrders.length > 0 && <SuccessState orders={visibleOrders} />}
              {!loading && !error && visibleOrders.length === 0 && (
                <EmptyState
                  isFiltered={emptyFromFilter}
                  onClearFilter={() => setStatusFilter('all')}
                />
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* Shimmer animation keyframes */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0 }
          100% { background-position:  200% 0 }
        }
        tbody { transition: opacity 0.2s ease; }
      `}</style>
    </div>
  )
}
