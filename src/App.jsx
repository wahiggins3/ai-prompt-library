// Reverted working version of AI Prompt Library with modal prompt view and robust clipboard fallback
import React from 'react';
import { useEffect, useState } from "react";
import axios from 'axios';

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

const API_URL = 'http://localhost:3000/api';

export default function PromptLibrary() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [prompts, setPrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState({ title: "", description: "", prompt: "", category: "Writing", author: "" });
  const [modalPrompt, setModalPrompt] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("title");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch prompts from API
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await axios.get(`${API_URL}/prompts`);
        setPrompts(response.data);
      } catch (error) {
        console.error('Error fetching prompts:', error);
      }
    };
    fetchPrompts();
  }, []);
  useEffect(() => localStorage.setItem("darkMode", darkMode), [darkMode]);

  const handleAddPrompt = async () => {
    console.log('handleAddPrompt called');
    console.log('Current newPrompt:', newPrompt);
    
    if (!newPrompt.title || !newPrompt.prompt) {
      console.log('Missing required fields');
      return;
    }

    try {
      console.log('Sending POST request to:', `${API_URL}/prompts`);
      const response = await axios.post(`${API_URL}/prompts`, newPrompt);
      console.log('Server response:', response.data);
      
      setPrompts([response.data, ...prompts]);
      setNewPrompt({ title: "", description: "", prompt: "", category: "Writing", author: "" });
      setAddModalOpen(false);
    } catch (error) {
      console.error('Error adding prompt:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    }
  };

  const handleCopy = () => {
    const text = modalPrompt?.prompt;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEdit = async (prompt) => {
    setEditingPrompt(prompt);
    setIsEditing(true);
    setModalPrompt(null);
    setNewPrompt(prompt);
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
    if (newPrompt.title && newPrompt.prompt) {
      try {
        const response = await axios.put(`${API_URL}/prompts/${editingPrompt._id}`, newPrompt);
        setPrompts(prompts.map(p => p._id === editingPrompt._id ? response.data : p));
        setNewPrompt({ title: "", description: "", prompt: "", category: "Writing", author: "" });
        setAddModalOpen(false);
        setIsEditing(false);
        setEditingPrompt(null);
      } catch (error) {
        console.error('Error updating prompt:', error);
      }
    }
  };

  return (
    <div className={darkMode ? 'dark bg-gray-900 text-white min-h-screen' : 'bg-white text-black min-h-screen'}>
      <div className="p-4 max-w-7xl mx-auto">
        <div className="mb-4 text-center">
          <h1 className="text-3xl font-bold">Box AI Prompt Library</h1>
        </div>

        <div className="flex flex-col gap-4 mb-6 max-w-2xl mx-auto w-full">
          <div className="flex gap-4">
            <input 
              className={`flex-1 p-2 border border-gray-400 rounded ${darkMode ? 'bg-gray-800 text-white border-gray-600' : ''}`} 
              placeholder="Search prompts..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value.toLowerCase())} 
            />
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm whitespace-nowrap" 
              onClick={() => setAddModalOpen(true)}
            >
              + Add Prompt
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <select 
              className={`w-full p-2 border border-gray-400 rounded ${darkMode ? 'bg-gray-800 text-white border-gray-600' : ''}`} 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="title">Title (A-Z)</option>
              <option value="category">Category (A-Z)</option>
              <option value="author">Author (A-Z)</option>
            </select>

            <select 
              className={`w-full p-2 border border-gray-400 rounded ${darkMode ? 'bg-gray-800 text-white border-gray-600' : ''}`} 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="text-left mt-2">
              <button 
                className="text-xs underline text-blue-500 hover:text-blue-700" 
                onClick={() => { setSearch(""); setSelectedCategory(""); setSortOption("title"); }}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {prompts
            .filter(p =>
              (!selectedCategory || p.category === selectedCategory) &&
              (p.title.toLowerCase().includes(search) ||
                p.description.toLowerCase().includes(search) ||
                p.prompt.toLowerCase().includes(search) ||
                p.category.toLowerCase().includes(search) ||
                (p.author && p.author.toLowerCase().includes(search)))
            )
            .sort((a, b) => (!a[sortOption] || !b[sortOption]) ? 0 : a[sortOption].localeCompare(b[sortOption]))
            .map((item, index) => (
              <div key={index} className={`rounded-lg border-2 ${categoryColors[item.category] || 'border-gray-300'} shadow p-4`}>
                <div className="cursor-pointer" onClick={() => setModalPrompt(item)}>
                <div className="font-semibold text-lg mb-1">{item.title}</div>
                <div className="text-sm text-gray-600 mb-1">{item.description}</div>
                <div className="text-xs text-gray-500 mb-2 italic">by {item.author || "Unknown"}</div>
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-800">{item.category}</span>
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* View Prompt Modal */}
        {modalPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className={`w-full max-w-lg ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'} rounded-lg p-6 border-2 ${categoryColors[modalPrompt.category] || 'border-gray-300'}`}>
              <h2 className="text-xl font-semibold mb-2">{modalPrompt.title}</h2>
              <p className="text-sm text-gray-500 mb-1 italic">by {modalPrompt.author || "Unknown"}</p>
              <p className="text-sm mb-2">{modalPrompt.description}</p>
              <textarea readOnly className={`w-full h-48 p-3 border rounded resize-none ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-100 text-black border-gray-300'}`}>{modalPrompt.prompt}</textarea>
              <div className="text-right text-blue-600 font-bold text-sm mt-1">{modalPrompt.prompt.length} characters</div>
              <div className="flex justify-between items-center mt-3">
                <div className="flex gap-2">
                  <button 
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" 
                    onClick={isEditing ? handleUpdate : handleAddPrompt}
                  >
                    {isEditing ? 'Update Prompt' : 'Save Prompt'}
                  </button>
                  <button className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded" onClick={() => handleEdit(modalPrompt)}>Edit</button>
                  <button className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded" onClick={() => handleDelete(modalPrompt._id)}>Delete</button>
                </div>
                {copied && <span className="text-green-500 text-sm">Copied!</span>}
                <button className="text-sm text-red-500 ml-auto" onClick={() => setModalPrompt(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Prompt Modal */}
        {addModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className={`w-full max-w-2xl ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'} p-6 rounded-lg shadow-lg`}>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddPrompt();
              }}>
                <h2 className="text-lg font-semibold mb-4">Add New Prompt</h2>
              <input 
                type="text" 
                placeholder="Title" 
                className={`w-full mb-2 p-2 border rounded ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`} 
                value={newPrompt.title} 
                onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })} 
                onPaste={(e) => {
                  e.stopPropagation();
                  const pastedText = e.clipboardData.getData('text');
                  setNewPrompt({ ...newPrompt, title: pastedText });
                }}
              />
              <input 
                type="text" 
                placeholder="Short Description" 
                className={`w-full mb-2 p-2 border rounded ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`} 
                value={newPrompt.description} 
                onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })} 
                onPaste={(e) => {
                  e.stopPropagation();
                  const pastedText = e.clipboardData.getData('text');
                  setNewPrompt({ ...newPrompt, description: pastedText });
                }}
              />
              <textarea 
                placeholder="Prompt Text" 
                className={`w-full mb-2 p-2 border rounded h-48 resize-none ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`} 
                value={newPrompt.prompt} 
                onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })} 
                onPaste={(e) => {
                  e.stopPropagation();
                  const pastedText = e.clipboardData.getData('text');
                  setNewPrompt({ ...newPrompt, prompt: pastedText });
                }}
              />
              <div className="text-right text-blue-600 font-bold text-sm mb-2">{newPrompt.prompt.length} characters</div>
              <input 
                type="text" 
                placeholder="Author" 
                className={`w-full mb-2 p-2 border rounded ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`} 
                value={newPrompt.author} 
                onChange={(e) => setNewPrompt({ ...newPrompt, author: e.target.value })} 
                onPaste={(e) => {
                  e.stopPropagation();
                  const pastedText = e.clipboardData.getData('text');
                  setNewPrompt({ ...newPrompt, author: pastedText });
                }}
              />
              <select className={`w-full mb-4 p-2 border rounded ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`} value={newPrompt.category} onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button 
                  type="button"
                  className="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-white" 
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Prompt
                </button>
              </div>
              </form>
            </div>
          </div>
        )}

        <div className="fixed bottom-4 right-4">
          <button className="px-3 py-1 text-sm border rounded" onClick={() => setDarkMode(!darkMode)}>
            Toggle {darkMode ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>
    </div>
  );
}
