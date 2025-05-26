import React, { useState, useEffect } from 'react';

const ContactTable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:8000/orders', {
          headers: {
            // Add authentication token if required
            // 'Authorization': `Bearer ${yourAuthToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading orders...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size (inch)</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.email_address}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.phone_no}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.product_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.color}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.quantity}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {order.size_length} x {order.size_width} x {order.size_depth}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.order_status}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.messages}</td>
              
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContactTable;