// This will be a placeholder for the DashboardCard component
import React from 'react';

const DashboardCard = ({ title, value, color, icon }) => {
  return (
    <div className={`rounded-lg shadow-md p-5 ${color} text-white`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
};

export default DashboardCard;