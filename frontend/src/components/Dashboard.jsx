import React, { useEffect,useState  } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import logo from "../assets/logo.svg";
import open_slider from "../assets/open_slider.svg";
import closed_slider from "../assets/close_slider.svg";
function Dashboard() {
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);

  const navigate = useNavigate();
  useEffect(() => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    alert('Please log in to access the dashboard.');
    navigate('/login');
    return;
  }

  api.get('/user/profile')
    .catch(() => {
      localStorage.removeItem('token');
      alert('Session expired. Please log in again.');
      navigate('/login');
    });

  api.get('/group/allgroups')
    .then((res) => {
      const data = res.data;
      if (!data.success) throw new Error(data.message || 'Failed to fetch trips');
      setRecentTrips(data.groups.slice(0, 3)); // show latest 3 trips
    })
    .catch((err) => console.error('Error fetching trips:', err));

  api.get('/expense/allexpenses')
  .then((res) => {
    const data = res.data;
    if (!data.success) throw new Error(data.message || 'Failed to fetch expenses');
    setRecentExpenses(data.expenses.slice(0, 3)); // show latest 3 expenses
  })
  .catch((err) => console.error('Error fetching expenses:', err));
}, [navigate]);


  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="flex h-screen bg-white text-black transition-all duration-300 ease-in-out">
    
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-12'
        } bg-white border-r border-gray-200 p-2 flex flex-col transition-all duration-300 ease-in-out shadow-md relative`}
      >
        
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 focus:outline-none absolute top-2 right-2 text-sm border border-gray-400 rounded px-1 py-0.5"
          title="Toggle sidebar"
        >
          <img
            src={sidebarOpen ? closed_slider : open_slider}
            alt="Toggle Sidebar"
            className="w-4 h-4"
          />
        </button>
        {sidebarOpen && (
          <div className="mt-10 px-2">
            <nav className="space-y-4">
              <button className="w-full text-left px-4 py-2 bg-green-600 text-white rounded font-semibold">
                Home
              </button>
              <button
              onClick={() => navigate('/groupdetails')} className="w-full text-left px-4 py-2 border rounded">
              Groups
              </button>
              <button className="w-full text-left px-4 py-2 border rounded">
                Expenses
              </button>
              <button className="w-full text-left px-4 py-2 border rounded">
                Tracking
              </button>
            </nav>
          </div>
        )}
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/*Top header */}
        <header className="flex justify-between items-center p-4 border-b">
          <img src={logo} alt="Logo" className="h-8" />
          <button className="border px-4 py-1 rounded font-medium">
            Profile
          </button>
        </header>

        {/* Page Content */}
        <section className="flex-1 p-6 bg-white overflow-auto">
          <div className="border border-gray-300 rounded-xl p-6 h-full flex flex-col gap-6">
            <div className="border border-gray-300 rounded-xl p-4 w-full">
              <h3 className="font-bold mb-2 text-lg">Recent Trips</h3>
              {recentTrips.length === 0 ? (
                <p className="text-gray-500">No recent trips found.</p>
              ) : (
                <ul className="space-y-2">
                  {recentTrips.map((trip) => (
                    <li key={trip._id} className="border p-2 rounded hover:bg-gray-50">
                      <div className="font-medium">{trip.name}</div>
                      <div className="text-sm text-gray-600">{trip.description || 'No description'}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border border-gray-300 rounded-xl p-4 w-full">
              <h3 className="font-bold mb-2 text-lg">Recent Expenses</h3>
              {recentExpenses.length === 0 ? (
                <p className="text-gray-500">No recent expenses found.</p>
              ) : (
                <ul className="space-y-2">
                  {recentExpenses.map((expense) => (
                    <li key={expense._id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-medium">{expense.description}</h3>
                        <p className="text-sm text-gray-600">
                          Paid by {expense.user?.username || 'Unknown'} • {new Date(expense.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-semibold text-green-600">
                          ₹{expense.amount}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default Dashboard;
