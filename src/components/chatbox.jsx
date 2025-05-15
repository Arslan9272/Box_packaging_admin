import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatBox = () => {
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const messageEndRef = useRef(null);
  
  // Get authentication token from local storage
  const currentToken = localStorage.getItem('access_token');
  
  // WebSocket connection ref
  const wsRef = useRef(null);

  // Fetch users list (only regular users, not admins)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:8000/auth/users', {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });
        // Filter out admin users if needed (assuming is_admin flag exists)
        const regularUsers = response.data.filter(user => !user.is_admin);
        setUsers(regularUsers);
        // Select first user by default if available
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

  // Initialize WebSocket connection when a user is selected
useEffect(() => {
  if (!selectedUser || !currentToken) return;

  // Close previous connection if exists
  if (wsRef.current) {
    wsRef.current.close();
  }

  setConnectionStatus('connecting');
  
  // Create WebSocket connection with proper error handling
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
        console.log('WebSocket message:', data);
        
        if (data.type === 'connection_status') {
          setConnectionStatus(data.status);
        } 
        else if (data.type === 'admin_message' || data.type === 'message_from_client') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            sender: data.admin_name || data.sender_name || selectedUser.username,
            text: data.content,
            time: new Date(data.timestamp || Date.now()).toLocaleTimeString(),
            isAdminMessage: data.type === 'admin_message'
          }]);
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
      
      // Attempt reconnect only if closure was unexpected
      if (event.code !== 1000 && event.code !== 1008) {
        setTimeout(() => {
          if (selectedUser) {
            console.log('Reconnecting...');
            // Trigger reconnection by updating a dummy state
            setConnectionStatus(prev => prev === 'disconnected' ? 'reconnecting' : 'disconnected');
          }
        }, 5000);
      }
    };

    // Fetch message history
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8000/admin/history?recipient_id=user_${selectedUser.id}`,
          { headers: { Authorization: `Bearer ${currentToken}` } }
        );
        
        setMessages(response.data.map(msg => ({
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending messages as admin
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser) return;

    const newMessage = {
      id: `temp-${Date.now()}`,
      sender: 'You',
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAdminMessage: true,
      pending: true
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'message_to_client',
          recipient_id: `user_${selectedUser.id}`,
          content: messageInput
        }));
      } else {
        // Fallback to HTTP if WebSocket is not available
        await axios.post(
          'http://localhost:8000/admin/send',
          {
            recipient_id: `user_${selectedUser.id}`,
            content: messageInput
          },
          {
            headers: { 'Authorization': `Bearer ${currentToken}` }
          }
        );
      }

      // Update message status
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, pending: false } : msg
      ));
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, pending: false, failed: true } : msg
      ));
    }
  };

  return (
    <div className="flex h-[500px] bg-white rounded-lg shadow-md overflow-hidden">
      {/* Sidebar with users list */}
      <div className="w-1/4 border-r border-gray-200 bg-gray-50 overflow-y-auto">
        <div className="p-3 border-b border-gray-200 bg-gray-100">
          <h3 className="font-semibold text-gray-700">Chat Users</h3>
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
              className={`p-3 hover:bg-gray-100 cursor-pointer flex items-center ${
                selectedUser?.id === user.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
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
                    ? 'bg-blue-100' 
                    : message.failed 
                      ? 'bg-red-100' 
                      : 'bg-gray-100'
                }`}>
                  <div className="font-medium text-sm">{message.sender}</div>
                  <div>{message.text}</div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">{message.time}</span>
                    {message.pending && (
                      <span className="text-xs text-gray-500">Sending...</span>
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
          <form onSubmit={handleSendMessage} className="border-t p-3 flex">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
              // disabled={connectionStatus !== 'connected'}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition disabled:bg-gray-400"
              // disabled={connectionStatus !== 'connected'}
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatBox;