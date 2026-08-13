import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../api';
import Header from './Header';
import Groups from './Groups';
import UserExpenses from './UserExpenses';
import Tracking from './Tracking';
import Feedback from './Feedback';
import PersonalExpenses from './PersonalExpenses';
import open_slider from '../assets/open_slider.svg';
import closed_slider from '../assets/close_slider.svg';
import { showNotification } from '../notifications';
import { socket } from '../socket';
import { jwtDecode } from 'jwt-decode';

const RANGES = [
  { key: 'week', label: '1 Week' },
  { key: 'month', label: '1 Month' },
  { key: 'year', label: '1 Year' },
  { key: 'all', label: 'All Time' },
];

// Custom tooltip for the recharts area chart
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: ₹{p.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
};

function Dashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const [userExpenseData, setUserExpenseData] = useState(null);
  const [settledGroupData, setSettledGroupData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Chart state
  const [chartRange, setChartRange] = useState('month');
  const [chartData, setChartData] = useState([]);
  const [chartTotals, setChartTotals] = useState({ totalSpent: 0, totalLent: 0 });
  const [chartLoading, setChartLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Handle deep-link query params (e.g. ?view=expenses from notifications)
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'expenses') {
      setActiveView('expenses');
      api.get('/expense/allexpenses')
        .then(res => { if (res.data.success) setUserExpenseData(res.data); })
        .catch(err => console.error('Preload user expenses failed:', err));
    } else if (view === 'settlements') {
      setActiveView('tracking');
      api.get('/settleup/settled-groups')
        .then(res => { if (res.data.success) setSettledGroupData(res.data.settledGroups); })
        .catch(err => console.error('Preload settlements failed:', err));
    } else if (view === 'feedback') {
      setActiveView('feedback');
    }
  }, [searchParams]);

  // Fetch chart data only when range changes — no polling
  const fetchChartData = useCallback(async (range) => {
    setChartLoading(true);
    try {
      const res = await api.get(`/personal-expense/chart?range=${range}`);
      if (res.data.success) {
        setChartData(res.data.chartData);
        setChartTotals({ totalSpent: res.data.totalSpent, totalLent: res.data.totalLent });
      }
    } catch (err) {
      console.error('Chart data fetch error:', err);
    } finally {
      setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'dashboard') fetchChartData(chartRange);
  }, [chartRange, activeView, fetchChartData]);

  // Authenticate socket and validate session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Please log in to access the dashboard.', 'error');
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const userId = decoded.userId || decoded.id;
      if (userId) {
        socket.auth = { token };
        socket.connect();
      }
    } catch (e) {
      console.error('Invalid token');
    }

    api.get('/user/profile')
      .then(res => {
        if (res.data?.data?.username) localStorage.setItem('username', res.data.data.username);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        showNotification('Session expired. Please log in again.', 'error');
        navigate('/login');
      });

    // Refresh chart when a group expense is added (socket event)
    const onExpenseUpdated = () => fetchChartData(chartRange);
    socket.on('expense_updated', onExpenseUpdated);

    return () => {
      socket.off('expense_updated', onExpenseUpdated);
      socket.disconnect();
    };
  }, [navigate, fetchChartData, chartRange]);

  // Format X-axis labels to be more readable
  const formatXAxis = useMemo(() => (label) => {
    if (!label) return '';
    // Yearly label e.g. '2025'
    if (label.length === 4) {
      return label;
    }
    // Monthly label e.g. '2025-08' → 'Aug'
    if (label.length === 7) {
      const [year, month] = label.split('-');
      return new Date(year, parseInt(month) - 1).toLocaleString('default', { month: 'short' });
    }
    // Daily label e.g. '2025-08-06' → '6 Aug'
    if (label.length === 10) {
      const [year, month, day] = label.split('-');
      const d = new Date(year, parseInt(month) - 1, parseInt(day));
      return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
    }
    return label;
  }, []);

  return (
    <div className="flex h-screen bg-white text-black">
      <Header />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-x-0 top-16 bottom-0 z-30 bg-black/30 backdrop-blur-[1px] transition-opacity duration-300 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] ${sidebarOpen ? 'w-64 translate-x-0' : 'w-12'
          } bg-white border-r border-gray-200 p-2 flex flex-col transition-all duration-300 ease-in-out shadow-md`}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 focus:outline-none absolute top-2 right-2 mt-2 text-sm border border-gray-400 rounded px-1 py-0.5 cursor-pointer"
          title="Toggle sidebar"
        >
          <img src={sidebarOpen ? closed_slider : open_slider} alt="Toggle Sidebar" className="w-4 h-4" />
        </button>

        {sidebarOpen && (
          <div className="mt-10 px-2">
            <nav className="space-y-4">
              {[
                { key: 'dashboard', label: 'Dashboard' },
                { key: 'groups', label: 'Groups' },
                { key: 'expenses', label: 'Expenses' },
                { key: 'tracking', label: 'Tracking' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setActiveView(key); setSidebarOpen(false); }}
                  className={`w-full text-left px-4 py-2 rounded font-semibold transition-colors cursor-pointer ${activeView === key
                    ? 'bg-green-600 text-white'
                    : 'border hover:bg-gray-50'
                    }`}
                >
                  {label}
                </button>
              ))}

              {/* Feedback — special styled button */}
              <button
                onClick={() => { setActiveView('feedback'); setSidebarOpen(false); }}
                className={`group relative overflow-hidden w-full text-left px-4 py-2 rounded font-semibold cursor-pointer border transition-all duration-300 ${activeView === 'feedback'
                  ? 'bg-sky-300 border-sky-500 shadow-[inset_0_3px_8px_rgba(3,105,161,0.35)] translate-y-[1px]'
                  : 'bg-sky-200 border-sky-400 shadow-sm hover:shadow-md hover:-translate-y-[1px]'
                  }`}
              >
                <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/65 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-[340%] transition-all duration-700" />
                <span className="relative font-bold text-black">Feedback</span>
              </button>
            </nav>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-12 md:ml-64' : 'ml-12'}`}>
        <section className="flex-1 p-6 bg-white overflow-auto flex justify-center mt-16">

          {activeView === 'dashboard' ? (
            <div className="w-full max-w-4xl space-y-6">

              {/* Analytics Chart Card */}
              <div className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Expense Analytics</h2>
                    <p className="text-sm text-gray-500">Personal + Group contributions</p>
                  </div>

                  {/* Time range filter buttons */}
                  <div className="flex rounded-lg overflow-hidden border border-gray-200">
                    {RANGES.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setChartRange(key)}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${chartRange === key
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary totals for selected range */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Spent</p>
                    <p className="text-xl font-bold text-red-700">₹{chartTotals.totalSpent.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Lent</p>
                    <p className="text-xl font-bold text-blue-700">₹{chartTotals.totalLent.toFixed(2)}</p>
                  </div>
                </div>

                {chartLoading ? (
                  <div className="h-56 flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">Loading chart…</div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-center">
                    <div>
                      <p className="text-gray-500 font-medium">No expense data for this period.</p>
                      <p className="text-gray-400 text-sm mt-1">Add personal expenses or group expenses to see your analytics here.</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tickFormatter={formatXAxis} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `₹${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="spent" name="Spent" stroke="#ef4444" fill="url(#colorSpent)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="lent" name="Lent" stroke="#3b82f6" fill="url(#colorLent)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Personal Expenses section embedded directly in Home */}
              <PersonalExpenses onExpenseChange={() => fetchChartData(chartRange)} />
            </div>

          ) : activeView === 'groups' ? (
            <Groups />
          ) : activeView === 'expenses' ? (
            <UserExpenses preloaded={userExpenseData} />
          ) : activeView === 'tracking' ? (
            <Tracking preloaded={settledGroupData} />
          ) : (
            <Feedback />
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
