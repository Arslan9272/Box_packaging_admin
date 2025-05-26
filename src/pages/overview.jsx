import React, { useState } from 'react';
import DashboardCard from '../components/dashboardCard'; // Path changed
import ContactTable from '../components/contactTable'; // Path changed

const Overview = () => {
  const [showChat, setShowChat] = useState(false);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <DashboardCard title="Total Orders" value="32" color="bg-blue-500" icon={<span>📦</span>} />
        <DashboardCard title="Pending Orders" value="6" color="bg-yellow-500" icon={<span>⏳</span>} />
        <DashboardCard title="Delivered" value="26" color="bg-green-500" icon={<span>✅</span>} />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Orders</h2>
        <ContactTable /> 
      </div>

      {/* <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Chat Support</h2>
        <ChatBox />
      </div> */}
    </div>
  );
};

export default Overview;