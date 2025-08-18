"use client"

import { useState } from "react"
import "./chat.css"
import img from './avatar.png';
import {
  Layout,Card,Input
} from 'antd';
const { Content } = Layout;
const { Search } = Input;
const Icons = {
  ArrowLeft: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  Download: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  ),
  Mic: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </svg>
  ),
  Paperclip: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  MoreVertical: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  ),
  Printer: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  Send: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
}

export default function ChatInterface() {
  const [message, setMessage] = useState("")

  const contacts = [
    { id: 1, name: "Martin Randolph", date: "11/19/19", avatar: "https://via.placeholder.com/40" },
    { id: 2, name: "Andrew Parker", date: "11/16/19", avatar: "https://via.placeholder.com/40" },
    { id: 3, name: "Karen Castillo", date: "11/15/19", avatar: "https://via.placeholder.com/40" },
    { id: 4, name: "Maximillian Jacobson", date: "10/30/19", avatar: "https://via.placeholder.com/40" },
    { id: 5, name: "Martha Craig", date: "10/28/19", avatar: "https://via.placeholder.com/40" },
    { id: 6, name: "Tabitha Potter", date: "8/25/19", avatar: "https://via.placeholder.com/40" },
    { id: 7, name: "Maisy Humphrey", date: "8/20/19", avatar: "https://via.placeholder.com/40" },
    { id: 8, name: "Kieron Dotson", date: "7/29/19", avatar: "https://via.placeholder.com/40" },
  ]

  const messages = [
    {
      id: 1,
      content:
        "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters.",
      time: "6:30 pm",
      sender: "contact",
    },
    {
      id: 2,
      content:
        "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour.",
      time: "6:34 pm",
      sender: "user",
    },
    {
      id: 3,
      content:
        "The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default.Contrary to popular belief, Lorem Ipsum is not simply random text is the model text for your company.",
      time: "6:38 pm",
      sender: "contact",
    },
  ]

  const handleSendMessage = () => {
    if (message.trim()) {
      // Logic to send message would go here
      setMessage("")
    }
  }
  const handleSearch = (value) => {
    console.log('Search Value:', value);
    // Implement the search logic here (e.g., filter menu items, navigate, etc.)
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
          <Content style={{ margin: '24px 16px' }}>
            <Card
              title="Chat"
              bordered={false}
              headStyle={{ fontSize: '20px', fontWeight: 'bold' ,textDecoration:'#1890ff underline'}}
            >
    <div className="chat-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
        <Search
            placeholder="Search"
            allowClear
            onSearch={handleSearch}
            style={{ width: '100%', marginBottom: '16px' }}
          />
        </div>
        <div className="contacts-list">
          {contacts.map((contact) => (
            <div key={contact.id} className="contact-item">
              <div className="avatar">
                <img src={img} alt={contact.name} />
              </div>
              <div className="contact-info">
                <h3>{contact.name}</h3>
                <p>{contact.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="header-left">
            <button className="icon-button">
              <Icons.ArrowLeft />
            </button>
            <div className="avatar">
                <img src={img}/>
              </div>
            <span>xxxxxx</span>
          </div>
          <div className="header-right">
            <button className="icon-button">
              <Icons.Printer />
            </button>
            <button className="icon-button">
              <Icons.Download />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-container">
        {messages.map((msg) => (
            <div
            key={msg.id}
            className={`message-wrapper ${msg.sender === "user" ? "user-message" : "contact-message"}`}
            >
            {msg.sender === "contact" && (
                <div className="message-avatar">
                <img src={img} alt="avatar" className="avatar-img" />
                </div>
            )}
            <div className="message-content-wrapper">
                <div className={`message-content ${msg.sender === "user" ? "user" : "contact"}`}>
                <span>{msg.content}</span>
                <span className="message-time-inline">{msg.time}</span>
                <div className="message-meta">
                    <button className="icon-button small">
                    <Icons.MoreVertical />
                    </button>
                </div>
                </div>
            </div>
            </div>
        ))}
        </div>



        {/* Message Input */}
        <div className="message-input-container">
          <button className="icon-button">
            <Icons.Mic />
          </button>
          <input
            type="text"
            placeholder="Write message"
            className="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage()
              }
            }}
          />
          <button className="icon-button">
            <Icons.Paperclip />
          </button>
          <button className="send-button" onClick={handleSendMessage}>
            <Icons.Send />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
    </Card>
    </Content>
    </Layout>
  )
}
