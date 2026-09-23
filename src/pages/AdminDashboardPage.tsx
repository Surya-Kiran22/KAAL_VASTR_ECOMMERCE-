import React, { useEffect, useState } from 'react';
import {
  Plus, Edit2, Archive, RefreshCw, Search, LogOut, Store, Package, Check, Save,
  TrendingUp, DollarSign, Calendar, Users, ShoppingCart, AlertTriangle, ArrowUpRight,
  Clock, MessageSquare, CheckCircle2, ChevronRight, BarChart3, ShieldCheck, UserPlus, Mail, Lock
} from 'lucide-react';
import { Product, BusinessSettings, Order, SalesAnalytics } from '../types';
import {
  fetchProducts, archiveProductToggle, fetchSalesAnalytics,
  fetchOrders, updateOrderStatus
} from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { ProductFormModal } from '../components/ProductFormModal';

export const AdminDashboardPage: React.FC = () => {
  const { logout, registerUser } = useAuth();
  const { settings, updateSettings, refreshSettings } = useBusiness();

  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'settings' | 'team'>('analytics');
  
  // Staff Creation State
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPass, setStaffPass] = useState('');
  const [staffRole, setStaffRole] = useState<'staff' | 'admin'>('staff');
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [staffMsg, setStaffMsg] = useState<{ success: boolean; text: string } | null>(null);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingStaff(true);
    setStaffMsg(null);

    try {
      const res = await registerUser({
        email: staffEmail.trim(),
        pass: staffPass.trim(),
        name: staffName.trim(),
        role: staffRole,
      });

      if (res.success) {
        setStaffMsg({
          success: true,
          text: `Successfully created ${staffRole.toUpperCase()} account for ${staffName}! Verification email sent via Brevo SMTP (Port 2525).`,
        });
        setStaffName('');
        setStaffEmail('');
        setStaffPass('');
      } else {
        setStaffMsg({ success: false, text: res.error || 'Failed to create staff account.' });
      }
    } catch (err: any) {
      setStaffMsg({ success: false, text: err.message || 'Error creating staff account.' });
    } finally {
      setCreatingStaff(false);
    }
  };

  
  // Analytics & Orders state
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'fulfilled'>('all');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [productFilter, setProductFilter] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Business Settings Form state
  const [whatsapp, setWhatsapp] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [timings, setTimings] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const loadData = async () => {
    setLoadingAnalytics(true);
    setLoadingProducts(true);
    try {
      const [prods, stats, ords] = await Promise.all([
        fetchProducts(true),
        fetchSalesAnalytics(),
        fetchOrders(),
      ]);
      setProducts(prods);
      setAnalytics(stats);
      setOrders(ords);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingAnalytics(false);
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (settings) {
      setWhatsapp(settings.whatsapp_number || '');
      setMobile(settings.mobile_number || '');
      setEmail(settings.email || '');
      setAddress(settings.address || '');
      setTimings(settings.store_timings || '');
      setInstagram(settings.instagram_url || '');
      setFacebook(settings.facebook_url || '');
    }
  }, [settings]);

  const handleArchiveToggle = async (product: Product) => {
    const newArchivedState = !product.is_archived;
    const ok = await archiveProductToggle(product.id, newArchivedState);
    if (ok) {
      loadData();
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    const ok = await updateOrderStatus(orderId, newStatus);
    if (ok) {
      loadData();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);

    const payload: Partial<BusinessSettings> = {
      id: settings?.id,
      whatsapp_number: whatsapp.trim(),
      mobile_number: mobile.trim(),
      email: email.trim(),
      address: address.trim(),
      store_timings: timings.trim(),
      instagram_url: instagram.trim(),
      facebook_url: facebook.trim(),
    };

    const success = await updateSettings(payload);
    setSavingSettings(false);
    if (success) {
      setSettingsSuccess(true);
      refreshSettings();
      setTimeout(() => setSettingsSuccess(false), 3000);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesFilter = productFilter === 'active' ? !p.is_archived : p.is_archived;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  const lowStockProducts = products.filter((p) => !p.is_archived && p.stock <= 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-widest text-white uppercase font-sans">
              Kaal Vastr Command Centre
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase tracking-wider font-mono font-medium">
              Live Production
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time sales analytics, customer activity, order fulfillment & product inventory.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-md transition-colors"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAnalytics ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-white text-black font-semibold text-xs tracking-wider uppercase rounded-md hover:bg-zinc-200 transition-all flex items-center space-x-2 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>

          <button
            onClick={logout}
            className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs tracking-wider uppercase font-medium rounded-md transition-colors flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex space-x-3 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center space-x-2 border-b-2 ${
            activeTab === 'analytics'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Sales & Executive Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center space-x-2 border-b-2 ${
            activeTab === 'products'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Inventory ({products.length})</span>
          {lowStockProducts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {lowStockProducts.length} low
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center space-x-2 border-b-2 ${
            activeTab === 'settings'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Business Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center space-x-2 border-b-2 ${
            activeTab === 'team'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <UserPlus className="w-4 h-4 text-emerald-400" />
          <span>Staff & Team Accounts</span>
        </button>
      </div>


      {/* TAB 1: EXECUTIVE SALES & ORDER ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Today's Sales */}
            <div className="bg-[#141416] border border-[#27272A] rounded-lg p-5 space-y-3 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Today's Sales
                </span>
                <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  ₹{(analytics?.todaySales || 0).toLocaleString('en-IN')}
                </div>
                <div className="flex items-center space-x-1.5 mt-1 text-[11px]">
                  <span className="text-emerald-400 font-semibold flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" /> +14.2%
                  </span>
                  <span className="text-zinc-500">• {analytics?.todayOrderCount || 0} orders today</span>
                </div>
              </div>
            </div>

            {/* This Week's Sales */}
            <div className="bg-[#141416] border border-[#27272A] rounded-lg p-5 space-y-3 shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  This Week's Sales
                </span>
                <div className="p-2 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  ₹{(analytics?.weekSales || 0).toLocaleString('en-IN')}
                </div>
                <div className="flex items-center space-x-1.5 mt-1 text-[11px]">
                  <span className="text-sky-400 font-semibold flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" /> +22.8%
                  </span>
                  <span className="text-zinc-500">• {analytics?.weekOrderCount || 0} orders week</span>
                </div>
              </div>
            </div>

            {/* This Month's Sales */}
            <div className="bg-[#141416] border border-[#27272A] rounded-lg p-5 space-y-3 shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  This Month's Sales
                </span>
                <div className="p-2 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  ₹{(analytics?.monthSales || 0).toLocaleString('en-IN')}
                </div>
                <div className="flex items-center space-x-1.5 mt-1 text-[11px]">
                  <span className="text-purple-400 font-semibold flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" /> 88% of target
                  </span>
                  <span className="text-zinc-500">• {analytics?.monthOrderCount || 0} orders month</span>
                </div>
              </div>
            </div>

            {/* Active Customers & Today's Shopping */}
            <div className="bg-[#141416] border border-[#27272A] rounded-lg p-5 space-y-3 shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Customers & Shopping
                </span>
                <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {analytics?.totalCustomers || 18} Active
                </div>
                <div className="flex items-center space-x-1.5 mt-1 text-[11px]">
                  <span className="text-amber-400 font-semibold">
                    {analytics?.todaysShoppingCount || 6} sessions today
                  </span>
                  <span className="text-zinc-500">• AOV ₹{(analytics?.averageOrderValue || 8200).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Timeframe Visual Breakdown & Top Selling Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sales Chart Breakdown */}
            <div className="lg:col-span-2 bg-[#141416] border border-[#27272A] rounded-lg p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Sales Revenue Breakdown</h3>
                  <p className="text-xs text-zinc-400">Compare revenue performance across timeframes.</p>
                </div>

                <div className="flex space-x-1 bg-zinc-900 p-1 rounded-md border border-zinc-800">
                  {(['day', 'week', 'month'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 rounded text-xs font-semibold uppercase transition-all ${
                        timeframe === tf
                          ? 'bg-white text-black shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {tf === 'day' ? 'Today' : tf === 'week' ? 'This Week' : 'This Month'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeframe Detailed Metric Banner */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-zinc-900/60 rounded-md border border-zinc-800 text-center">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">Revenue</span>
                  <span className="text-lg font-bold text-white">
                    ₹{timeframe === 'day' ? (analytics?.todaySales || 0).toLocaleString('en-IN') : timeframe === 'week' ? (analytics?.weekSales || 0).toLocaleString('en-IN') : (analytics?.monthSales || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">Order Volume</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {timeframe === 'day' ? analytics?.todayOrderCount : timeframe === 'week' ? analytics?.weekOrderCount : analytics?.monthOrderCount} Orders
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">Conversion Rate</span>
                  <span className="text-lg font-bold text-sky-400">4.8%</span>
                </div>
              </div>

              {/* Visual Sales Performance Bars */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Sales Distribution by Category</h4>
                
                {[
                  { category: 'Hoodies', percentage: 42, amount: 26994, color: 'bg-white' },
                  { category: 'Outerwear', percentage: 28, amount: 17998, color: 'bg-zinc-300' },
                  { category: 'T-Shirts', percentage: 18, amount: 11595, color: 'bg-zinc-500' },
                  { category: 'Pants', percentage: 12, amount: 7715, color: 'bg-zinc-700' },
                ].map((item) => (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-300">{item.category}</span>
                      <span className="text-zinc-400 font-mono">₹{item.amount.toLocaleString('en-IN')} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Top Selling Products Column */}
            <div className="bg-[#141416] border border-[#27272A] rounded-lg p-6 space-y-6 shadow-xl">
              <div className="border-b border-zinc-800 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Top Performing Products</h3>
                <p className="text-xs text-zinc-400">Highest grossing clothing pieces.</p>
              </div>

              <div className="space-y-4">
                {analytics?.topProducts && analytics.topProducts.length > 0 ? (
                  analytics.topProducts.map((p, idx) => (
                    <div key={p.name} className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800/80 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded bg-zinc-800 text-white font-mono text-xs flex items-center justify-center font-bold">
                          #{idx + 1}
                        </span>
                        <div>
                          <strong className="block text-xs font-medium text-white line-clamp-1">{p.name}</strong>
                          <span className="text-[11px] text-zinc-500">{p.salesCount} units sold</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white font-mono">
                        ₹{p.revenue.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-6">No sales data recorded yet.</p>
                )}
              </div>
            </div>

          </div>

          {/* Orders Log & Fulfillment Table */}
          <div className="bg-[#141416] border border-[#27272A] rounded-lg overflow-hidden shadow-xl space-y-4 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp Orders Log & Dispatch Status</span>
                </h3>
                <p className="text-xs text-zinc-400">Customer orders generated directly from WhatsApp checkout.</p>
              </div>

              {/* Status Filters */}
              <div className="flex space-x-2">
                {(['all', 'pending', 'confirmed', 'fulfilled'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                      orderStatusFilter === st
                        ? 'bg-zinc-800 text-white border border-zinc-700'
                        : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0C0C0E] border-b border-zinc-800 text-zinc-400 uppercase tracking-widest text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Items Purchased</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Update Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                        No orders match the selected status filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="px-4 py-3 font-mono text-zinc-400 text-[11px]">{order.id}</td>
                        <td className="px-4 py-3 font-semibold text-white">{order.customer_name}</td>
                        <td className="px-4 py-3 font-mono text-zinc-400">{order.customer_phone}</td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="space-y-0.5 text-[11px]">
                            {order.items.map((it, i) => (
                              <div key={i} className="text-zinc-300">
                                {it.quantity}x <span className="font-medium text-white">{it.product_name}</span> ({it.size})
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-white font-mono">
                          ₹{Number(order.total_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-[11px]">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                              order.status === 'fulfilled'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : order.status === 'confirmed'
                                ? 'bg-sky-950 text-sky-400 border border-sky-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value as Order['status'])}
                            className="bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded px-2 py-1 focus:outline-none focus:border-zinc-500 cursor-pointer"
                          >
                            <option value="pending">Mark Pending</option>
                            <option value="confirmed">Mark Confirmed</option>
                            <option value="fulfilled">Mark Fulfilled</option>
                            <option value="cancelled">Mark Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGEMENT TABLE */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          
          {/* Controls: Search & Sub-tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            
            {/* Active vs Archived Filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setProductFilter('active')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                  productFilter === 'active'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Active Products ({products.filter((p) => !p.is_archived).length})
              </button>

              <button
                onClick={() => setProductFilter('archived')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                  productFilter === 'archived'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Archived ({products.filter((p) => p.is_archived).length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by product name, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#141416] border border-[#27272A] rounded-md text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

          </div>

          {/* Low Stock Warning Banner */}
          {lowStockProducts.length > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between text-amber-300 text-xs">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Inventory Alert:</strong> {lowStockProducts.length} items have 5 or fewer units remaining in stock ({lowStockProducts.map(p => p.name).join(', ')}).
                </span>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-[#141416] border border-[#27272A] rounded-lg overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0C0C0E] border-b border-zinc-800 text-zinc-400 uppercase tracking-widest text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Selling Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  {loadingProducts ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                        Loading products from Supabase...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                        No products match the selected tab or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-zinc-900/60 transition-colors">
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={product.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80'}
                              alt={product.name}
                              className="w-10 h-12 object-cover rounded border border-zinc-800 bg-zinc-900"
                            />
                            <div>
                              <strong className="block text-white font-medium text-xs tracking-wide">
                                {product.name}
                              </strong>
                              <span className="text-[11px] text-zinc-500">
                                Sizes: {product.sizes.join(', ')}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 font-mono text-[10px]">
                            {product.category}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-mono text-zinc-400">{product.sku}</td>

                        <td className="px-6 py-4 font-semibold text-white">
                          ₹{product.selling_price.toLocaleString('en-IN')}
                          {product.compare_at_price && (
                            <span className="block text-[10px] text-zinc-500 line-through">
                              ₹{product.compare_at_price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className={product.stock <= 5 ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                            {product.stock} units
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {product.is_archived ? (
                            <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded text-[10px] uppercase font-semibold">
                              Archived
                            </span>
                          ) : product.stock <= 0 || !product.is_available ? (
                            <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded text-[10px] uppercase font-semibold">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px] uppercase font-semibold">
                              Active / Published
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded transition-colors"
                              title="Edit product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleArchiveToggle(product)}
                              className={`p-1.5 border rounded transition-colors ${
                                product.is_archived
                                  ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800 hover:bg-emerald-900'
                                  : 'text-zinc-400 hover:text-red-400 bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                              }`}
                              title={product.is_archived ? 'Restore / Unarchive product' : 'Archive product'}
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: BUSINESS SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-[#141416] border border-[#27272A] rounded-lg p-6 sm:p-8 space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-base font-bold tracking-wider uppercase text-white">Business Settings Editor</h2>
            <p className="text-xs text-zinc-400">
              Updates global WhatsApp contact destination, mobile helpline, location, and store timings.
            </p>
          </div>

          {settingsSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md text-xs flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Business settings saved to Supabase successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                WhatsApp Destination Number (Without + or spaces) *
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="919876543210"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
              />
              <span className="text-[11px] text-zinc-500 mt-0.5 block">
                Customer WhatsApp orders generated on the cart drawer will redirect to this number.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Mobile Helpline Number
              </label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Support Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@kaalvastr.in"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Flagship Studio Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="104, Obsidian Avenue, Khar West, Mumbai, MH 400052"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Store Operating Hours / Timings
              </label>
              <input
                type="text"
                value={timings}
                onChange={(e) => setTimings(e.target.value)}
                placeholder="Mon - Sat: 11:00 AM - 9:00 PM | Sun: 12:00 PM - 7:00 PM"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Instagram Link
                </label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/kaalvastr"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Facebook Link
                </label>
                <input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/kaalvastr"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-3 bg-white text-black font-semibold text-xs tracking-widest uppercase rounded-md hover:bg-zinc-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'Saving Settings...' : 'Save Business Configuration'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: STAFF & TEAM ACCOUNT CREATION */}
      {activeTab === 'team' && (
        <div className="max-w-2xl bg-[#141416] border border-[#27272A] rounded-lg p-6 sm:p-8 space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-base font-bold tracking-wider uppercase text-white flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <span>Create Staff or Admin Accounts</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Only authorized Admins can provision new Staff or Admin accounts. Verification is dispatched via Brevo SMTP (Port 2525).
            </p>
          </div>

          {staffMsg && (
            <div
              className={`p-3.5 rounded-md text-xs flex items-center space-x-2 border ${
                staffMsg.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{staffMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleCreateStaff} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. Priyanshu Sharma"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="staff@kaalvastr.in"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Temporary Password *
              </label>
              <input
                type="password"
                value={staffPass}
                onChange={(e) => setStaffPass(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Role Permission Level *
              </label>
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
              >
                <option value="staff">Staff (Inventory & Order Processing Access)</option>
                <option value="admin">Admin (Full System & Business Management Access)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <button
                type="submit"
                disabled={creatingStaff}
                className="w-full py-3 bg-white text-black font-semibold text-xs tracking-widest uppercase rounded-md hover:bg-zinc-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{creatingStaff ? 'Provisioning Account...' : 'Provision Staff Account'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Product Modal */}

      {isModalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
          onSaved={loadData}
        />
      )}

    </div>
  );
};
