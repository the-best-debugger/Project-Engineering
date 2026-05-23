import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Users,
  LogOut,
  Search,
  TrendingUp,
  DollarSign,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  items: {
    id: number;
    quantity: number;
    price: number;
    product: {
      name: string;
      image: string | null;
      category: { name: string };
    };
  }[];
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface Summary {
  totalRevenue: number;
  totalOrders: number;
  activeCustomers: number;
  avgOrderValue: number;
}

const PAGE_SIZE = 20;

const DashboardApp: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState<Summary>({
    totalRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    avgOrderValue: 0,
  });

  const fetchOrders = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/orders?page=${pageNum}&limit=${PAGE_SIZE}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      setOrders(json.data);
      setPagination(json.pagination);
      setSummary(json.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [page, fetchOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center font-bold">
              F
            </div>
            <span className="text-xl font-bold tracking-tight">Fragments</span>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-lg text-primary-400"
          >
            <ShoppingBag size={20} />
            <span className="font-medium">Orders List</span>
          </a>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors w-full">
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0">
          <div className="relative w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search orders, customers..."
              className="w-full bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-full pl-10 pr-4 py-2 text-sm transition-all outline-none"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Orders Performance Dashboard
              </h1>
              <button
                onClick={() => fetchOrders(page)}
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShoppingBag size={16} />
                )}
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: 'Total Revenue',
                  value: `$${summary.totalRevenue.toLocaleString()}`,
                  icon: DollarSign,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                },
                {
                  label: 'Total Orders',
                  value: summary.totalOrders.toString(),
                  icon: ShoppingBag,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                },
                {
                  label: 'Customers',
                  value: summary.activeCustomers.toString(),
                  icon: Users,
                  color: 'text-violet-600',
                  bg: 'bg-violet-50',
                },
                {
                  label: 'Avg Order Value',
                  value: `$${summary.avgOrderValue.toFixed(2)}`,
                  icon: TrendingUp,
                  color: 'text-amber-600',
                  bg: 'bg-amber-50',
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {stat.label}
                      </p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        {stat.value}
                      </h3>
                    </div>
                    <div className={cn('p-3 rounded-xl', stat.bg)}>
                      <stat.icon size={20} className={stat.color} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h2 className="font-bold text-slate-800">Recent Transactions</h2>
                {pagination && (
                  <span className="text-xs text-slate-500 font-medium">
                    Page {pagination.currentPage} of {pagination.totalPages} (
                    {pagination.total} total)
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Products</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4">
                              <div className="h-4 w-12 bg-slate-100 rounded" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-32 bg-slate-100 rounded" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-6 w-20 bg-slate-100 rounded-full" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-40 bg-slate-100 rounded" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-24 bg-slate-100 rounded" />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="h-4 w-16 bg-slate-100 rounded ml-auto" />
                            </td>
                          </tr>
                        ))
                      : orders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-mono font-medium text-slate-400">
                              #{order.id.toString().padStart(4, '0')}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {order.user.avatarUrl && (
                                  <img
                                    src={order.user.avatarUrl}
                                    alt=""
                                    className="w-8 h-8 rounded-full bg-slate-100"
                                  />
                                )}
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {order.user.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {order.user.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={cn(
                                  'px-2.5 py-1 rounded-full text-xs font-semibold border',
                                  getStatusColor(order.status)
                                )}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-slate-700 font-medium truncate max-w-[200px] block">
                                {order.items.map((i) => i.product.name).join(', ')}
                              </span>
                              <span className="text-xs text-slate-400">
                                {order.items.length} items
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              <div className="flex items-center gap-1.5 font-medium">
                                <Clock size={14} className="text-slate-400" />
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                              ${order.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/50 flex items-center justify-between">
                <p className="text-xs text-emerald-700 font-semibold">
                  Optimized: paginated payload, single join query, gzip enabled
                </p>
                {pagination && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!pagination.hasPrevPage || loading}
                      onClick={() => setPage((p) => p - 1)}
                      className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-medium text-slate-600 px-2">
                      {pagination.currentPage} / {pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={!pagination.hasNextPage || loading}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardApp;
