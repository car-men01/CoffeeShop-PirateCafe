import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { NetworkContext } from '../NetworkContext';
import { FaRobot, FaPaperPlane, FaUser, FaTrash, FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../styles/ChatbotPage.css';

const ChatbotPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const { apiPost } = useContext(NetworkContext);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Initial greeting when page loads
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        text: `Welcome to Pirate Café AI Assistant! ☕🏴‍☠️

Hello ${currentUser?.username || 'there'}! I'm your personal AI assistant here to help you navigate the seas of coffee and café management.

${currentUser?.role === 'admin' ? 
`🔧 **Admin Dashboard**
As an admin, I can help you with:
• User management and monitoring
• System analytics and statistics  
• Product catalog management
• Order management and tracking
• Administrative tools and features

Try asking: "How many users are registered?" or "Show me recent orders"` : 
`☕ **Your Coffee Journey**
I can assist you with:
• Checking your order history and status
• Managing your wallet and balance
• Exploring our product menu
• Account security and monitoring tips
• General navigation and support

Try asking: "What's my account balance?" or "What's my last order?"`}

What would you like to know today?`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isWelcome: true
      };
      setMessages([welcomeMessage]);
    }
  }, [currentUser]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await apiPost('/api/chatbot/chat', {
        message: inputMessage.trim()
      });

      const botMessage = {
        text: response.data.response,
        sender: 'bot',
        timestamp: response.data.timestamp,
        fallback: response.data.fallback
      };

      // Simulate typing delay for better UX
      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1500);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        text: "Ahoy! I'm having trouble with the connection right now. Please check that the server is running and try again! 🤖⚓",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        error: true
      };

      setTimeout(() => {
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    // Add welcome message back after clearing
    setTimeout(() => {
      const welcomeMessage = {
        text: `Chat cleared! How can I help you today? ☕`,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }, 500);
  };

  const quickQuestions = currentUser?.role === 'admin' 
    ? [
        "How many users are registered?",
        "What are the recent orders?", 
        "Show me system statistics",
        "How do I add a new product?"
      ]
    : [
        "What is my account balance?",
        "What is my last order?",
        "What's the most expensive product?",
        "How do I avoid getting monitored?"
      ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    // Auto-send after a short delay
    setTimeout(() => {
      handleSendMessage();
    }, 300);
  };

  if (!isAuthenticated) {
    return (
      <div className="chatbot-page">
        <div className="auth-required">
          <FaRobot className="auth-icon" />
          <h2>Authentication Required</h2>
          <p>Please log in to access the AI Assistant</p>
          <button onClick={() => navigate('/login')} className="login-btn">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot-page">
      {/* Header */}
      <div className="chatbot-page-header">
        <div className="header-left">
          <FaRobot className="header-icon" />
          <div className="header-text">
            <h1>Pirate Café AI Assistant</h1>
            <p>Your intelligent coffee companion • {currentUser?.role?.toUpperCase()} MODE</p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={clearChat} className="header-btn clear-btn" title="Clear chat">
            <FaTrash />
            <span>Clear Chat</span>
          </button>
          <button onClick={() => navigate('/')} className="header-btn home-btn" title="Go home">
            <FaHome />
            <span>Home</span>
          </button>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="quick-questions">
        <h3>Quick Questions</h3>
        <div className="questions-grid">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(question)}
              className="quick-question-btn"
              disabled={isLoading}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="chat-container">
        {/* Messages */}
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.sender} ${message.error ? 'error' : ''} ${message.fallback ? 'fallback' : ''} ${message.isWelcome ? 'welcome' : ''}`}
            >
              <div className="message-avatar">
                {message.sender === 'bot' ? <FaRobot /> : <FaUser />}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {message.text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message bot typing">
              <div className="message-avatar">
                <FaRobot />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="typing-text">AI is thinking...</div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-container">
          <div className="chat-input">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your Pirate Café experience..."
              rows="1"
              disabled={isLoading}
              className="message-input"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="send-btn"
              aria-label="Send message"
            >
              <FaPaperPlane />
            </button>
          </div>
          <div className="input-help">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
