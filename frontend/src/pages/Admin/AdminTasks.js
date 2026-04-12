import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight, FiTarget, FiPlay, FiAward, FiTrendingUp, FiUsers, FiBarChart3 } from 'react-icons/fi';
import api from '../../api/axios';

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [games, setGames] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'game_score',
    gameId: '',
    targetScore: '',
    reward: { coins: 0, experience: 0 },
    difficulty: 'medium',
    category: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchGames();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/api/admin/tasks');
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      const { data } = await api.get('/api/games');
      setGames(data);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/admin/tasks', formData);

      if (response.status >= 200 && response.status < 300) {
        setShowCreateModal(false);
        setFormData({
          title: '', description: '', type: 'game_score', gameId: '', targetScore: '',
          reward: { coins: 0, experience: 0 }, difficulty: 'medium', category: ''
        });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      const response = await api.put(`/api/admin/tasks/${taskId}/toggle`);
      if (response.status >= 200 && response.status < 300) fetchTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await api.delete(`/api/admin/tasks/${taskId}`);
        if (response.status >= 200 && response.status < 300) fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add Task</span>
        </motion.button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'tasks', name: 'Tasks', icon: FiTarget },
            { id: 'overview', name: 'Overview', icon: FiTrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'tasks' && (
        <div className="grid gap-6">
          {tasks.map((task) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <FiTarget className="w-5 h-5" />
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.difficulty === 'easy' ? 'text-green-600 bg-green-100' :
                      task.difficulty === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                      task.difficulty === 'hard' ? 'text-orange-600 bg-orange-100' :
                      'text-red-600 bg-red-100'
                    }`}>
                      {task.difficulty}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                    }`}>
                      {task.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">{task.reward.coins}</p>
                      <p className="text-xs text-gray-500">Coins</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{task.reward.experience}</p>
                      <p className="text-xs text-gray-500">XP</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{task.completionStats?.totalCompletions || 0}</p>
                      <p className="text-xs text-gray-500">Completions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{task.completionStats?.uniqueUsers || 0}</p>
                      <p className="text-xs text-gray-500">Users</p>
                    </div>
                  </div>

                  {task.gameId && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
                      <FiPlay className="w-4 h-4" />
                      <span>{task.gameId.name}</span>
                      {task.targetScore && (
                        <>
                          <span>•</span>
                          <span>Target: {task.targetScore}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleTask(task._id)}
                    className={`p-2 rounded-lg transition-colors ${
                      task.isActive 
                        ? 'text-orange-600 hover:bg-orange-50' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {task.isActive ? <FiToggleLeft className="w-5 h-5" /> : <FiToggleRight className="w-5 h-5" />}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteTask(task._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="game_score">Game Score</option>
                    <option value="game_win">Game Win</option>
                    <option value="daily_challenge">Daily Challenge</option>
                    <option value="achievement">Achievement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {(formData.type === 'game_score' || formData.type === 'game_win') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Game</label>
                    <select
                      value={formData.gameId}
                      onChange={(e) => setFormData({ ...formData, gameId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a game</option>
                      {games.map((game) => (
                        <option key={game._id} value={game._id}>{game.name}</option>
                      ))}
                    </select>
                  </div>

                  {formData.type === 'game_score' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Score</label>
                      <input
                        type="number"
                        value={formData.targetScore}
                        onChange={(e) => setFormData({ ...formData, targetScore: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Coins Reward</label>
                  <input
                    type="number"
                    value={formData.reward.coins}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      reward: { ...formData.reward, coins: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Reward</label>
                  <input
                    type="number"
                    value={formData.reward.experience}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      reward: { ...formData.reward, experience: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminTasks;
