import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

function Dashboard() {
  const { user, logout } = useAuth0()
  const navigate = useNavigate()
  const [boards, setBoards] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    try {
      const res = await axios.get(`${API}/api/boards?userId=${user.sub}`)
      setBoards(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const createBoard = async () => {
    if (!title.trim()) return
    try {
      await axios.post(`${API}/api/boards`, {
        title,
        description,
        owner: user.sub
      })
      setTitle('')
      setDescription('')
      setShowForm(false)
      fetchBoards()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteBoard = async (id) => {
    try {
      await axios.delete(`${API}/api/boards/${id}`)
      fetchBoards()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <div className="bg-gray-800 px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">📋 TaskFlow</h1>
        <div className="flex items-center gap-4">
          <img src={user.picture} className="w-8 h-8 rounded-full" alt="avatar" />
          <span className="text-gray-300 text-sm">{user.name}</span>
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold">My Boards</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-medium"
          >
            + New Board
          </button>
        </div>

        {/* Create Board Form */}
        {showForm && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8 flex flex-col gap-4">
            <input
              type="text"
              placeholder="Board title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-gray-700 rounded-lg px-4 py-2 text-white outline-none"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-gray-700 rounded-lg px-4 py-2 text-white outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={createBoard}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="text-5xl mb-4">📭</div>
            <p>No boards yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {boards.map(board => (
              <div
                key={board._id}
                className="bg-gray-800 rounded-xl p-6 cursor-pointer hover:bg-gray-700 transition relative group"
                onClick={() => navigate(`/board/${board._id}`)}
              >
                <h3 className="text-lg font-semibold mb-2">{board.title}</h3>
                <p className="text-gray-400 text-sm">{board.description || 'No description'}</p>
                <button
                  onClick={e => { e.stopPropagation(); deleteBoard(board._id) }}
                  className="absolute top-3 right-3 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard