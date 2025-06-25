import React, { useState, useEffect, useRef } from 'react';

// Notification Banner Component
const NotificationBanner = ({ notification, onClose, onMarkAsRead }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 5000); // Auto-hide after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.message_id);
    handleClose();
  };

  return (
    <div className={`fixed top-4 right-4 max-w-sm w-full bg-white border-l-4 border-blue-500 rounded-lg shadow-lg transform transition-all duration-300 z-50 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414L11 7.586V3a1 1 0 10-2 0v4.586l-.293-.293z"/>
                <path d="M3 5a2 2 0 012-2h1a1 1 0 010 2H5v7h2l1 2h4l1-2h2V5h-1a1 1 0 110-2h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
              </svg>
            </div>
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">
              {notification.title}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {notification.message}
            </p>
            <p className="mt-1 text-xs text-gray-400 bg-gray-50 p-2 rounded">
              "{notification.content_preview}"
            </p>
            <div className="mt-2 text-xs text-gray-400">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={handleClose}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleMarkAsRead}
            className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
          >
            Mark as Read
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatBox = () => {
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // Notification states - now tracking per user
  const [notifications, setNotifications] = useState([]);
  const [userNotificationCounts, setUserNotificationCounts] = useState({}); // userId -> count
  
  const messageEndRef = useRef(null);
  const currentToken = localStorage.getItem('access_token');
  const wsRef = useRef(null);

  // Mark notification as read
  const markNotificationAsRead = async (messageId) => {
    try {
      // This would call your notification API to mark as read
      // For now, we'll update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.message_id === messageId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Handle new notification and update user-specific count
  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
    
    // Extract user ID from notification (you may need to adjust this based on your notification structure)
    // Assuming the notification has a sender_id or user_id field
    const userId = notification.sender_id || notification.user_id;
    if (userId) {
      // Remove 'user_' prefix if it exists to match with users array
      const cleanUserId = userId.toString().replace('user_', '');
      setUserNotificationCounts(prev => ({
        ...prev,
        [cleanUserId]: (prev[cleanUserId] || 0) + 1
      }));
    }
  };

  // Clear notifications for a specific user when their chat is opened
  const clearUserNotifications = (userId) => {
    setUserNotificationCounts(prev => ({
      ...prev,
      [userId]: 0
    }));
    
    // Mark all notifications from this user as read
    setNotifications(prev => 
      prev.map(notif => {
        const notifUserId = (notif.sender_id || notif.user_id || '').toString().replace('user_', '');
        return notifUserId === userId.toString() 
          ? { ...notif, read: true }
          : notif;
      })
    );
  };

  // Remove notification from display
  const removeNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notif => notif.timestamp !== notificationId)
    );
  };

  // Handle user selection and clear their notifications
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    clearUserNotifications(user.id);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:8000/auth/users', {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });
        const data = await response.json();
        const regularUsers = data.filter(user => !user.is_admin);
        setUsers(regularUsers);
        if (regularUsers.length > 0) {
          setSelectedUser(regularUsers[0]);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    if (currentToken) {
      fetchUsers();
    }
  }, [currentToken]);

  useEffect(() => {
    if (!selectedUser || !currentToken) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    setConnectionStatus('connecting');
    
    try {
      const ws = new WebSocket(`ws://localhost:8000/ws/admin?token=${encodeURIComponent(currentToken)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'connection_status') {
            setConnectionStatus(data.status);
          } 
          else if (data.type === 'chat_message') {
            setMessages(prev => [...prev, {
              id: `msg-${data.message_id || Date.now()}`,
              sender: data.sender_name || data.sender_id || 'User',
              text: data.content,
              time: new Date(data.timestamp || Date.now()).toLocaleTimeString(),
              isAdminMessage: data.is_admin || false
            }]);
          }
          else if (data.type === 'notification') {
            // Handle incoming notifications
            console.log('New notification received:', data);
            handleNewNotification(data);
          }
          else if (data.type === 'message_sent') {
            console.log('Message sent confirmation:', data);
          }
          else if (data.type === 'error') {
            console.error('WebSocket error:', data.message);
          }
        } catch (err) {
          console.error('Error processing message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        if (event.code !== 1000 && event.code !== 1008) {
          setTimeout(() => {
            if (selectedUser) {
              console.log('Reconnecting...');
              setConnectionStatus('reconnecting');
            }
          }, 5000);
        }
      };

      const fetchMessages = async () => {
        try {
          setLoading(true);
          const response = await fetch(
            `http://localhost:8000/admin/history?recipient_id=user_${selectedUser.id}`,
            { headers: { Authorization: `Bearer ${currentToken}` } }
          );
          const data = await response.json();
          
          setMessages(data.map(msg => ({
            id: msg.id,
            sender: msg.sender_name || (msg.admin_id ? 'Admin' : selectedUser.username),
            text: msg.content,
            time: new Date(msg.timestamp).toLocaleTimeString(),
            isAdminMessage: !!msg.admin_id
          })));
        } catch (err) {
          console.error('Error fetching messages:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchMessages();

    } catch (err) {
      console.error('WebSocket initialization error:', err);
      setConnectionStatus('error');
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedUser, currentToken]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser) return;

    const newMessage = {
      id: `temp-${Date.now()}`,
      sender: 'You (Admin)',
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAdminMessage: true,
      pending: true
    };

    setMessages(prev => [...prev, newMessage]);
    const messageContent = messageInput;
    setMessageInput('');

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat_message',
          recipient_id: `user_${selectedUser.id}`,
          content: messageContent
        }));
        
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, pending: false } : msg
        ));
      } else {
        await fetch(
          'http://localhost:8000/admin/send',
          {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${currentToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              recipient_id: `user_${selectedUser.id}`,
              content: messageContent
            })
          }
        );
        
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, pending: false } : msg
        ));
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, pending: false, failed: true } : msg
      ));
    }
  };

  return (
    <div className="relative">
      {/* Notification Banners */}
      {notifications
        .filter(notif => !notif.read)
        .slice(0, 3) // Show max 3 notifications at once
        .map((notification, index) => (
          <NotificationBanner
            key={notification.timestamp}
            notification={notification}
            onClose={() => removeNotification(notification.timestamp)}
            onMarkAsRead={markNotificationAsRead}
            style={{ top: `${1 + index * 5}rem` }}
          />
        ))}

      <div className="flex h-[500px] bg-white rounded-lg shadow-md overflow-hidden">
        {/* Sidebar with users list */}
        <div className="w-1/4 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 bg-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Chat Users</h3>
            </div>
            <div className="mt-1 text-xs">
              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></span>
              {connectionStatus === 'connected' ? 'Online' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {users.map(user => (
              <div 
                key={user.id}
                className={`p-3 hover:bg-gray-100 cursor-pointer flex items-center justify-between ${
                  selectedUser?.id === user.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                {/* Notification count badge */}
                {userNotificationCounts[user.id] > 0 && (
                  <div className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {userNotificationCounts[user.id] > 9 ? '9+' : userNotificationCounts[user.id]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="bg-blue-500 text-white py-3 px-4 flex justify-between items-center">
            <h3 className="font-semibold">
              {selectedUser ? `Chat with ${selectedUser.username}` : 'Select a user to chat'}
            </h3>
            <div className="text-sm">
              Status: {connectionStatus}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : messages.length > 0 ? (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.isAdminMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.isAdminMessage 
                      ? 'bg-blue-500 text-white' 
                      : message.failed 
                        ? 'bg-red-100' 
                        : 'bg-gray-200'
                  }`}>
                    <div className="font-medium text-sm">{message.sender}</div>
                    <div>{message.text}</div>
                    <div className="flex justify-between mt-1">
                      <span className={`text-xs ${message.isAdminMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.time}
                      </span>
                      {message.pending && (
                        <span className="text-xs text-yellow-500">Sending...</span>
                      )}
                      {message.failed && (
                        <span className="text-xs text-red-500">Failed</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-center items-center h-full text-gray-400">
                {selectedUser 
                  ? 'No messages yet. Start the conversation!' 
                  : 'Select a user from the sidebar to start chatting'}
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          {/* Message input */}
          {selectedUser && (
            <div className="border-t p-3 flex">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message..."
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition disabled:bg-gray-400"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBox;