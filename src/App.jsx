// Reverted working version of AI Prompt Library with modal prompt view and robust clipboard fallback
import React from 'react';
import { useEffect, useState } from "react";
import axios from 'axios';

const promptTypes = [
  "Content Q&A",
  "Compose",
  "Image Analysis",
  "Extract",
  "Agent"
];

const categories = [
  "Writing", "Productivity", "Coding / Dev", "Marketing / Sales", "Business Strategy",
  "Data / Analysis", "Creative / Fun", "Customer Support", "Education / Learning",
  "Design / UX", "Legal / Compliance", "HR / Recruiting"
];

const categoryColors = {
  Writing: "border-blue-500",
  Productivity: "border-orange-500",
  "Coding / Dev": "border-purple-500",
  "Marketing / Sales": "border-green-500",
  "Business Strategy": "border-indigo-500",
  "Data / Analysis": "border-yellow-500",
  "Creative / Fun": "border-pink-500",
  "Customer Support": "border-teal-500",
  "Education / Learning": "border-red-500",
  "Design / UX": "border-cyan-500",
  "Legal / Compliance": "border-gray-500",
  "HR / Recruiting": "border-lime-500"
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function PromptLibrary() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPrompt, setNewPrompt] = useState({ title: "", description: "", prompt: "", category: "Writing", type: "Content Q&A", author: "" });
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [modalPrompt, setModalPrompt] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("title");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Fetch prompts from API
  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/prompts`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'If-None-Match': ''
          },
          params: { _t: Date.now() } // Prevent caching
        });
        setPrompts(response.data);
      } catch (error) {
        console.error('Error fetching prompts:', error);
        setError('Failed to load prompts. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrompts();
  }, [lastRefresh]); // Add lastRefresh to dependencies
  useEffect(() => localStorage.setItem("darkMode", darkMode), [darkMode]);

  const resetForm = () => {
    setNewPrompt({ 
      title: "", 
      description: "", 
      prompt: "", 
      category: "Writing", 
      type: "Content Q&A", 
      author: "" 
    });
    setIsEditing(false);
    setEditingPrompt(null);
  };

  const handleAddPrompt = async () => {
    if (!newPrompt.title || !newPrompt.prompt) {
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/prompts`, newPrompt);
      setPrompts([response.data, ...prompts]);
      resetForm();
      setAddModalOpen(false);
    } catch (error) {
      console.error('Error adding prompt:', error);
    }
  };

  const handleCopy = async () => {
    const text = modalPrompt?.prompt;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(modalPrompt._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEdit = (prompt) => {
    setEditingPrompt(prompt);
    setIsEditing(true);
    setNewPrompt({ ...prompt });
    setAddModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      try {
        await axios.delete(`${API_URL}/prompts/${id}`);
        setPrompts(prompts.filter(p => p._id !== id));
        setModalPrompt(null);
      } catch (error) {
        console.error('Error deleting prompt:', error);
      }
    }
  };

  const handleUpdate = async () => {
    if (editingPrompt && newPrompt.title && newPrompt.prompt) {
      try {
        const response = await axios.put(`${API_URL}/prompts/${editingPrompt._id}`, {
          ...newPrompt,
          updatedAt: new Date().toISOString()
        });
        setPrompts(prompts.map(p => p._id === editingPrompt._id ? response.data : p));
        resetForm();
        setAddModalOpen(false);
      } catch (error) {
        console.error('Error updating prompt:', error);
      }
    }
  };

  // Function to force refresh data
  const refreshData = () => {
    setLastRefresh(Date.now());
  };

  return (
    <div className={`min-h-screen relative ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Box AI Prompt Library</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Organize and manage your AI prompts efficiently</p>
        </div>
        
        <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6`}>
          <div className="max-w-5xl mx-auto space-y-6">
              {/* Search and Add Row */}
              <div className="flex gap-4 items-center justify-center">
                <div className="flex-1 max-w-3xl relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input 
                    className={`w-full h-11 pl-10 pr-4 border border-gray-200 dark:border-gray-600 rounded-xl ${darkMode ? 'bg-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-50 text-black placeholder-gray-500'}`} 
                    placeholder="Search prompts..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value.toLowerCase())} 
                  />
                </div>
                <button
                  className={`h-11 px-6 rounded-xl font-medium transition-all duration-200 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                  onClick={() => {
                    resetForm();
                    setAddModalOpen(true);
                  }}
                >
                  Add Prompt
                </button>
              </div>
              
              {/* Filters Row */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-4 items-center flex-wrap justify-center">
                  <select 
                    className={`h-10 px-4 border border-gray-200 dark:border-gray-600 rounded-xl min-w-[180px] ${darkMode ? 'bg-gray-700/50 text-white' : 'bg-gray-50 text-black'}`} 
                    value={sortOption} 
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="title">Sort by: Title (A-Z)</option>
                    <option value="category">Sort by: Category (A-Z)</option>
                    <option value="author">Sort by: Author (A-Z)</option>
                    <option value="type">Sort by: Type (A-Z)</option>
                  </select>

                  <select 
                    className={`h-10 px-4 border border-gray-200 dark:border-gray-600 rounded-xl min-w-[180px] ${darkMode ? 'bg-gray-700/50 text-white' : 'bg-gray-50 text-black'}`} 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Filter by Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select 
                    className={`h-10 px-4 border border-gray-200 dark:border-gray-600 rounded-xl min-w-[180px] ${darkMode ? 'bg-gray-700/50 text-white' : 'bg-gray-50 text-black'}`} 
                    value={selectedType} 
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="">Filter by Type</option>
                    {promptTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>

                  <button 
                    className="text-xs underline text-blue-500 hover:text-blue-700 h-10 flex items-center" 
                    onClick={() => { 
                      setSearch(""); 
                      setSelectedCategory(""); 
                      setSelectedType("");
                      setSortOption("title"); 
                    }}
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {prompts
              .filter(p =>
                (!selectedCategory || p.category === selectedCategory) &&
                (!selectedType || p.type === selectedType) &&
                (p.title.toLowerCase().includes(search) ||
                  p.description.toLowerCase().includes(search) ||
                  p.prompt.toLowerCase().includes(search) ||
                  p.category.toLowerCase().includes(search) ||
                  (p.type && p.type.toLowerCase().includes(search)) ||
                  (p.author && p.author.toLowerCase().includes(search))))
              .sort((a, b) => (!a[sortOption] || !b[sortOption]) ? 0 : a[sortOption].localeCompare(b[sortOption]))
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((item, index) => (
              <div key={index} className={`rounded-xl ${categoryColors[item.category] || 'border-gray-300'} ${darkMode ? 'bg-gray-800/50' : 'bg-white'} shadow-sm hover:shadow-md transition-all duration-200 border-2 overflow-hidden flex flex-col min-h-[250px]`}>
                <div className="cursor-pointer flex-1 p-4 min-h-[180px]" onClick={() => setModalPrompt(item)}>
                  <div className="font-semibold text-lg mb-1">{item.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1 line-clamp-2">{item.description}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">by {item.author || "Unknown"}</div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{item.category}</span>
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">{item.type || 'Content Q&A'}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(item.prompt).then(() => {
                        setCopiedId(item._id);
                        setTimeout(() => setCopiedId(null), 2000);
                      });
                    }}
                    className="text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 flex items-center gap-1"
                  >
                    Copy
                    {copiedId === item._id && <span className="text-xs bg-green-500 text-white px-1 rounded">✓</span>}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item);
                    }}
                    className="text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="fixed top-2 right-2 p-1.5 rounded-full shadow-sm transition-colors duration-200 ease-in-out z-[9999] text-sm"
          style={{
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
            color: darkMode ? '#ffffff' : '#000000'
          }}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* View Prompt Modal */}
        {modalPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className={`w-full max-w-lg ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'} rounded-lg p-6 border-2 ${categoryColors[modalPrompt.category] || 'border-gray-300'}`}>
              <h2 className="text-xl font-semibold mb-2">{modalPrompt.title}</h2>
              <p className="text-sm text-gray-500 mb-1 italic">by {modalPrompt.author || "Unknown"}</p>
              <p className="text-sm mb-2">{modalPrompt.description}</p>
              <div className="flex gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-500">Category:</span>
                  <span className="ml-2 text-sm px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-800">{modalPrompt.category}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Type:</span>
                  <span className="ml-2 text-sm px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800">{modalPrompt.type || 'Content Q&A'}</span>
                </div>
              </div>
              <textarea readOnly className={`w-full h-48 p-3 border rounded resize-none ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-100 text-black border-gray-300'}`}>{modalPrompt.prompt}</textarea>
              <div className="text-right text-blue-600 font-bold text-sm mt-1">{modalPrompt.prompt.length} characters</div>
              <div className="flex justify-between items-center mt-3">
                <div className="flex gap-2 items-center">
                  <button 
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2" 
                    onClick={handleCopy}
                  >
                    <span>Copy Prompt</span>
                    {copiedId === modalPrompt._id && <span className="text-xs bg-green-500 text-white px-1 rounded">Copied!</span>}
                  </button>
                  <button 
                    className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded" 
                    onClick={() => {
                      handleEdit(modalPrompt);
                      setModalPrompt(null);
                    }}
                  >
                    Edit
                  </button>
                </div>
                <button 
                  className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded" 
                  onClick={() => setModalPrompt(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>)}

          {/* Pagination Controls */}
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Previous
            </button>
            
            <span className={`px-4 py-1 rounded ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              Page {currentPage}
            </span>

            {/* Only show Next if there are more items */}
            {prompts.filter(p =>
              (!selectedCategory || p.category === selectedCategory) &&
              (!selectedType || p.type === selectedType) &&
              (p.title.toLowerCase().includes(search) ||
                p.description.toLowerCase().includes(search) ||
                p.prompt.toLowerCase().includes(search) ||
                p.category.toLowerCase().includes(search) ||
                (p.type && p.type.toLowerCase().includes(search)) ||
                (p.author && p.author.toLowerCase().includes(search)))).length > currentPage * itemsPerPage && (
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Next
              </button>
            )}
          </div>
        </div>

        {/* Add Prompt Modal */}
        {addModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className={`w-full max-w-2xl ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'} p-6 rounded-lg shadow-lg`}>
              <form onSubmit={(e) => {
                e.preventDefault();
                isEditing ? handleUpdate() : handleAddPrompt();
              }}>
                <h2 className="text-lg font-semibold mb-6">{isEditing ? 'Edit Prompt' : 'Add New Prompt'}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Prompt Text</label>
                    <textarea 
                      placeholder="Enter your prompt text here" 
                      className={`w-full p-2 border rounded-lg h-48 resize-none ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`} 
                      value={newPrompt.prompt} 
                      onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })} 
                    />
                    <div className="flex justify-between items-center mt-1">
                      <button
                        type="button"
                        className={`text-sm px-3 py-1 rounded ${newPrompt.prompt.length < 10 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
                        disabled={newPrompt.prompt.length < 10 || isSuggesting}
                        onClick={async () => {
                          setIsSuggesting(true);
                          try {
                            const response = await axios.post(`${API_URL}/suggest`, { prompt: newPrompt.prompt });
                            setNewPrompt(prev => ({
                              ...prev,
                              title: response.data.title,
                              description: response.data.description
                            }));
                          } catch (error) {
                            console.error('Error getting suggestions:', error);
                          } finally {
                            setIsSuggesting(false);
                          }
                        }}
                      >
                        {isSuggesting ? 'Thinking...' : 'Suggest Title & Description'}
                      </button>
                      <div className="text-blue-600 dark:text-blue-400 font-medium text-sm">{newPrompt.prompt.length} characters</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Title</label>
                    <input 
                      type="text" 
                      placeholder="Enter a descriptive title (max 50 chars)" 
                      className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`} 
                      value={newPrompt.title} 
                      maxLength={50}
                      onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })} 
                    />
                    <div className="text-right text-gray-500 dark:text-gray-400 text-xs mt-1">{newPrompt.title.length}/50</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
                    <input 
                      type="text" 
                      placeholder="Brief description of what this prompt does (max 120 chars)" 
                      className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`} 
                      value={newPrompt.description} 
                      maxLength={120}
                      onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })} 
                    />
                    <div className="text-right text-gray-500 dark:text-gray-400 text-xs mt-1">{newPrompt.description.length}/120</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Author</label>
                    <input 
                      type="text" 
                      placeholder="Your name or identifier" 
                      className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`} 
                      value={newPrompt.author} 
                      onChange={(e) => setNewPrompt({ ...newPrompt, author: e.target.value })} 

                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category</label>
                  <div className="text-xs text-gray-500 mb-1">Group your prompt by its primary use case</div>
                  <select 
                    className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`} 
                    value={newPrompt.category} 
                    onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Type</label>
                  <div className="text-xs text-gray-500 mb-1">Select how this prompt will be used</div>
                  <select 
                    className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`} 
                    value={newPrompt.type} 
                    onChange={(e) => setNewPrompt({ ...newPrompt, type: e.target.value })}
                  >
                    {promptTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                {isEditing && (
                  <button 
                    type="button" 
                    className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded" 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this prompt?')) {
                        handleDelete(editingPrompt._id);
                        setAddModalOpen(false);
                      }
                    }}
                  >
                    Delete Prompt
                  </button>
                )}
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    className="text-sm text-red-500" 
                    onClick={() => {
                      setAddModalOpen(false);
                      if (!isEditing) {
                        resetForm();
                      }
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    {isEditing ? 'Save Changes' : 'Add Prompt'}
                  </button>
                </div>
              </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={`mt-16 py-8 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={refreshData}
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading prompts...</span>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="flex flex-col items-center justify-center text-center">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              &copy; {new Date().getFullYear()} AI Prompt Library. Created by William Higgins.
              {!import.meta.env.PROD && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full border border-yellow-500/20">
                  Development Mode
                </span>
              )}
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <a 
                href="mailto:wahiggins3@gmail.com" 
                className={`hover:underline ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                Contact Me
              </a>
              <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>•</span>
              <a 
                href="https://github.com/wahiggins" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`hover:underline ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
