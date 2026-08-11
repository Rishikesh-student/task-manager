import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const BOARD_COLORS = [
  { from: '#3730a3', to: '#4f46e5' },
  { from: '#6d28d9', to: '#8b5cf6' },
  { from: '#065f46', to: '#10b981' },
  { from: '#991b1b', to: '#ef4444' },
  { from: '#92400e', to: '#f59e0b' },
  { from: '#1e3a5f', to: '#3b82f6' },
  { from: '#831843', to: '#ec4899' },
  { from: '#134e4a', to: '#14b8a6' },
]

function getInitials(name) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'
}

const AVATAR_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function Dashboard() {
  const { user, logout } = useAuth0()
  const navigate = useNavigate()
  const [boards, setBoards] = useState([])
  const [taskCounts, setTaskCounts] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchBoards() }, [])

  const fetchBoards = async () => {
    try {
      const res = await axios.get(`${API}/api/boards?userId=${user.sub}`)
      setBoards(res.data)
      fetchTaskCounts(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchTaskCounts = async (boards) => {
    try {
      const counts = {}
      await Promise.all(boards.map(async (board) => {
        const res = await axios.get(`${API}/api/tasks?boardId=${board._id}`)
        counts[board._id] = res.data.length
      }))
      setTaskCounts(counts)
    } catch (err) { console.error(err) }
  }

  const createBoard = async () => {
    if (!title.trim()) return
    try {
      await axios.post(`${API}/api/boards`, { title, description, owner: user.sub })
      setTitle(''); setDescription(''); setShowForm(false)
      fetchBoards()
    } catch (err) { console.error(err) }
  }

  const deleteBoard = async (id) => {
    try {
      await axios.delete(`${API}/api/boards/${id}`)
      fetchBoards()
    } catch (err) { console.error(err) }
  }

  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(search.toLowerCase()) ||
    board.description?.toLowerCase().includes(search.toLowerCase())
  )

  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0)
  const inProgressCount = Math.floor(totalTasks * 0.4)

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Navbar */}
      <div style={{ background: '#1a1d2e', borderBottom: '1px solid #2d3154', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '600' }}>
          <div style={{ width: '30px', height: '30px', background: '#4f46e5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📋</div>
          TaskFlow
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={user.picture} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #4f46e5' }} alt="avatar" />
          <span style={{ fontSize: '14px', color: '#a0aec0' }}>{user.name}</span>
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            style={{ background: 'transparent', border: '1px solid #2d3154', color: '#a0aec0', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '22px', fontWeight: '600' }}>My Boards</div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
          >
            + New Board
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="🔍  Search boards..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', background: '#1a1d2e', border: '1px solid #2d3154', borderRadius: '12px', padding: '12px 16px', color: '#fff', fontSize: '14px', marginBottom: '24px', outline: 'none' }}
        />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Boards', value: boards.length, sub: `${boards.length} active` },
            { label: 'Total Tasks', value: totalTasks, sub: 'across all boards' },
            { label: 'In Progress', value: inProgressCount, sub: 'estimated active' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#1a1d2e', border: '1px solid #2d3154', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: '#5a6284', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              <div style={{ fontSize: '28px', fontWeight: '600' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Create Form */}
        {showForm && (
          <div style={{ background: '#1a1d2e', border: '1px solid #2d3154', borderRadius: '16px', padding: '24px', marginBottom: '28px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Create New Board</div>
            <input
              type="text"
              placeholder="Board title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', background: '#0f1117', border: '1px solid #2d3154', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '14px', marginBottom: '12px', outline: 'none' }}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', background: '#0f1117', border: '1px solid #2d3154', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '14px', marginBottom: '16px', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={createBoard} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Create</button>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', color: '#a0aec0', border: '1px solid #2d3154', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Boards Grid */}
        {filteredBoards.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#5a6284', marginTop: '80px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p>{search ? 'No boards match your search.' : 'No boards yet. Create your first one!'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredBoards.map((board, index) => {
              const color = BOARD_COLORS[index % BOARD_COLORS.length]
              return (
                <div
                  key={board._id}
                  onClick={() => navigate(`/board/${board._id}`)}
                  style={{ borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #2d3154', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {/* Card Header */}
                  <div style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})`, padding: '20px', position: 'relative', minHeight: '100px' }}>
                    <button
                      onClick={e => { e.stopPropagation(); deleteBoard(board._id) }}
                      style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >✕</button>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>{board.title}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{board.description || 'No description'}</div>
                  </div>

                  {/* Card Footer */}
                  <div style={{ background: '#1a1d2e', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#5a6284' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid #4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#4f46e5' }}>✓</div>
                      {taskCounts[board._id] ?? 0} tasks
                    </div>
                    <div style={{ display: 'flex' }}>
                      {board.members?.slice(0, 3).map((member, i) => (
                        <div key={i} style={{ width: '26px', height: '26px', borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], border: '2px solid #1a1d2e', marginLeft: i === 0 ? 0 : '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: '#fff' }}>
                          {getInitials(member.split('|')[0])}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard