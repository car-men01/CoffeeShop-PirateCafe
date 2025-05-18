import React, { useState, useEffect, useContext } from 'react';
import { API_URL } from '../config';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import { NetworkContext } from '../NetworkContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [monitoredUsers, setMonitoredUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [simulationUserId, setSimulationUserId] = useState('');
  const [simulationAction, setSimulationAction] = useState('READ');
  const [successMessage, setSuccessMessage] = useState('');

  
  const { isAdmin } = useContext(AuthContext);
  const { apiGet, apiPost, apiDelete } = useContext(NetworkContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if not admin
    if (isAdmin === false) {
      navigate('/');
      return;
    }
    
    fetchMonitoredUsers();
    fetchAllUsers();
  }, [isAdmin, navigate]);

 // Update the handleRemoveMonitoring function to use the NetworkContext
const handleRemoveMonitoring = async (userId) => {
  try {
    await apiDelete(`/admin/remove-monitoring/${userId}`);
    
    // Remove this user from the local state
    setMonitoredUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    
    // Clear selected user if it was this one
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(null);
    }
    
    // Show success message
    setSuccessMessage('User removed from monitoring successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  } catch (error) {
    console.error('Error removing user monitoring:', error);
    setError('Failed to remove user monitoring. Please try again.');
    setTimeout(() => setError(''), 3000);
  }
};

  
  const fetchMonitoredUsers = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/admin/monitored-users');
      setMonitoredUsers(response.data);
    } catch (err) {
      setError('Failed to load monitored users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAllUsers = async () => {
  try {
    const response = await apiGet('/admin/users');
    setAllUsers(response.data);
  } catch (err) {
    console.error('Failed to fetch users:', err);
    
    // Fallback: Use data from monitored users if available
    if (monitoredUsers && monitoredUsers.length > 0) {
      setAllUsers(monitoredUsers);
      return;
    }
    
    // Fallback with mock data if needed
    // setAllUsers([
    //   { id: '1', username: 'admin', email: 'admin@example.com', role: 'admin' },
    //   { id: '2', username: 'user1', email: 'user1@example.com', role: 'user' },
    //   { id: '3', username: 'user2', email: 'user2@example.com', role: 'user' }
    // ]);
  }
};
  
  const fetchUserStats = async (userId) => {
    try {
      const response = await apiGet(`/admin/user-stats/${userId}`);
      setUserStats(response.data);
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
    }
  };
  
  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchUserStats(user.id);
  };
  
  const simulateSuspiciousActivity = async () => {
    if (!simulationUserId) {
      alert('Please select a user first');
      return;
    }
    
    try {
      // Change the action to READ which is likely more stable
      await apiPost('/admin/simulate-activity', {
        userId: simulationUserId,
        action: simulationAction,
        count: 1
      });
      
      const selectedUserName = allUsers.find(u => u.id === simulationUserId)?.username || 'Selected user';
      alert(`Simulated suspicious activity for user: ${selectedUserName}`);
      
      // Refresh data after a brief delay to allow monitoring to detect
      setTimeout(() => {
        fetchMonitoredUsers();
        fetchAllUsers();
      }, 5000);
    } catch (err) {
      console.error('Failed to simulate activity:', err);
      
      // More detailed error reporting
      if (err.response) {
        // The server responded with a status code outside of 2xx range
        console.error(`Server returned ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        // No response was received
        console.error('No response received from server');
      } else {
        // Something else caused the error
        console.error('Error setting up the request:', err.message);
      }
      
      alert(`Failed to simulate activity: ${err.response?.data?.error || err.message}`);
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  if (!isAdmin) {
    return <div className="loading">Checking permissions...</div>;
  }
  
  if (loading) {
    return <div className="loading">Loading monitored users...</div>;
  }
  
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      {/* New simulation section */}
      <div className="simulation-section">
        <h3>Simulate Suspicious Activity</h3>
        <div className="simulation-controls">
          <div className="control-group">
            <label htmlFor="user-select" className="control-label">Select a user:</label>
            <select 
              id="user-select"
              value={simulationUserId}
              onChange={(e) => setSimulationUserId(e.target.value)}
              className="dropdown-select"
            >
              <option value="">-- Select a user --</option>
              {allUsers.map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
          </div>
          
          <div className="control-group">
            <label htmlFor="action-select" className="control-label">Activity type:</label>
            <select
              id="action-select"
              value={simulationAction}
              onChange={(e) => setSimulationAction(e.target.value)}
              className="dropdown-select"
            >
              <option value="READ">Read</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>
          
          <div className="control-group">
            <label htmlFor="simulate-btn" className="control-label">&nbsp;</label>
            <button 
              id="simulate-btn"
              className="simulate-button"
              onClick={simulateSuspiciousActivity}
              disabled={!simulationUserId}
            >
              Simulate Activity
            </button>
          </div>
        </div>
      </div>
      
      <div className="dashboard-container">
        <div className="users-panel">
          <h2>Monitored Users</h2>
          
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          
          {monitoredUsers.length === 0 ? (
            <div className="no-data">No monitored users found</div>
          ) : (
            <ul className="user-list">
              {monitoredUsers.map(user => (
                <li 
                  key={user.id} 
                  className={selectedUser?.id === user.id ? 'selected' : ''}
                  onClick={() => handleUserClick(user)}
                >
                  <div className="user-item">
                    <span className="user-name">{user.username}</span>
                    <span className="user-email">{user.email}</span>
                    <span className="monitoring-since">
                      Monitored since: {formatDate(user.monitoringSince)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          <button 
            className="refresh-button"
            onClick={fetchMonitoredUsers}
          >
            Refresh List
          </button>
        </div>
        
        <div className="user-details-panel">
          {selectedUser ? (
            <>
              <h2>User Details: {selectedUser.username}</h2>
              
              <button 
                className="remove-monitoring-btn"
                onClick={() => handleRemoveMonitoring(selectedUser.id)}
              >
                Remove User Monitoring
              </button>

              <div className="user-details">
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>Monitored since:</strong> {formatDate(selectedUser.monitoringSince)}</p>
                <p><strong>Last login:</strong> {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}</p>
              </div>
              
              {userStats && (
                <div className="user-stats">
                  <h3>Activity Statistics (Last 24 Hours)</h3> {/* Changed from 7 Days to 24 Hours */}
                  <div className="stats-grid">
                    <div className="stat-box create">
                      <h4>Create</h4>
                      <span className="stat-number">{userStats.stats.CREATE}</span>
                    </div>
                    <div className="stat-box read">
                      <h4>Read</h4>
                      <span className="stat-number">{userStats.stats.READ}</span>
                    </div>
                    <div className="stat-box update">
                      <h4>Update</h4>
                      <span className="stat-number">{userStats.stats.UPDATE}</span>
                    </div>
                    <div className="stat-box delete">
                      <h4>Delete</h4>
                      <span className="stat-number">{userStats.stats.DELETE}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-selection">
              <p>Select a user to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;