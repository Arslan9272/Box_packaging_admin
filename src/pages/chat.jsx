import React from 'react'
import ChatBox from '../components/chatbox' // Adjust the path as necessary

function Chat() {
    
  return (
    <div>
         <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Chat Support</h2>
        <ChatBox />
      </div>
    </div>
  )
}

export default Chat
