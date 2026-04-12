import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import axios from 'axios'
import io from 'socket.io-client'

const API = import.meta.env.VITE_API_URL
let socket

function Board() {
  const { id } = useParams()
  const { user } = useAuth0()
  const navigate = useNavigate()
  const [board, setBoard] = useState(null)
  const [tasks, setTasks] = useState([])
  const [showTaskForm, setShowTaskForm] = useState(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchBoard()
    fetchTasks()

    socket = io(API)
    socket.emit('join-board', id)
    socket.on('task-updated', (data) => {
      if (data.type === 'created') setTasks(prev => [...prev, data.task])
      if (data.type === 'updated') setTasks(prev => prev.map(t => t._id === data.task._id ? data.task : t))
      if (data.type === 'deleted') setTasks(prev => prev.filter(t => t._id !== data.taskId))
    })

    return () => socket.disconnect()
  }, [id])

  const fetchBoard = async () => {
    const res = await axios.get(`${API}/api/boards/${id}`)
    setBoard(res.data)
  }

  const fetchTasks = async () => {
    const res = await axios.get(`${API}/api/tasks?boardId=${id}`)
    setTasks(res.data)
  }

  const createTask = async (listId) => {
    if (!taskTitle.trim()) return
    await axios.post(`${API}/api/tasks`, {
      title: taskTitle,
      description: taskDesc,
      boardId: id,
      listId,
      assignee: user.sub,
      priority: taskPriority,
      dueDate: taskDueDate || null,
      order: tasks.filter(t => t.listId === listId).length
    })
    setTaskTitle('')
    setTaskDesc('')
    setTaskPriority('medium')
    setTaskDueDate('')
    setShowTaskForm(null)
  }

  const deleteTask = async (taskId) => {
    await axios.delete(`${API}/api/tasks/${taskId}`)
    setSelectedTask(null)
  }

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const task = tasks.find(t => t._id === draggableId)
    const updatedTask = { ...task, listId: destination.droppableId, order: destination.index }
    setTasks(prev => prev.map(t => t._id === draggableId ? updatedTask : t))
    await axios.put(`${API}/api/tasks/${draggableId}`, { listId: destination.droppableId, order: destination.index })
  }

  const uploadFile = async (e, taskId) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const res = await axios.post(`${API}/api/upload`, formData)
    const task = tasks.find(t => t._id === taskId)
    const attachments = [...(task.attachments || []), res.data]
    await axios.put(`${API}/api/tasks/${taskId}`, { attachments })
    setUploading(false)
    fetchTasks()
  }

  const priorityColor = (p) => {
    if (p === 'high') return 'bg-red-500'
    if (p === 'medium') return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (!board) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <div className="bg-gray-800 px-6 py-4 flex justify-between items-center shadow">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white">← Back</button>
          <h1 className="text-xl font-bold">{board.title}</h1>
        </div>
        <div className="text-sm text-green-400">● Live</div>
      </div>

      {/* Board */}
      <div className="p-6 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 min-w-max">
            {board.lists.map(list => (
              <div key={list.id} className="bg-gray-800 rounded-xl w-72 p-4 flex flex-col gap-3">
                <h2 className="font-semibold text-gray-200">{list.title}</h2>

                <Droppable droppableId={list.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex flex-col gap-2 min-h-16"
                    >
                      {tasks
                        .filter(t => t.listId === list.id)
                        .sort((a, b) => a.order - b.order)
                        .map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedTask(task)}
                                className="bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition"
                              >
                                <div className="flex justify-between items-start">
                                  <p className="text-sm font-medium">{task.title}</p>
                                  <span className={`w-2 h-2 rounded-full mt-1 ${priorityColor(task.priority)}`}></span>
                                </div>
                                {task.dueDate && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    📅 {new Date(task.dueDate).toLocaleDateString()}
                                  </p>
                                )}
                                {task.attachments?.length > 0 && (
                                  <p className="text-xs text-gray-400 mt-1">📎 {task.attachments.length} file(s)</p>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Add Task */}
                {showTaskForm === list.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Task title"
                      value={taskTitle}
                      onChange={e => setTaskTitle(e.target.value)}
                      className="bg-gray-700 rounded px-3 py-2 text-sm outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={taskDesc}
                      onChange={e => setTaskDesc(e.target.value)}
                      className="bg-gray-700 rounded px-3 py-2 text-sm outline-none"
                    />
                    <select
                      value={taskPriority}
                      onChange={e => setTaskPriority(e.target.value)}
                      className="bg-gray-700 rounded px-3 py-2 text-sm outline-none"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={e => setTaskDueDate(e.target.value)}
                      className="bg-gray-700 rounded px-3 py-2 text-sm outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => createTask(list.id)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm flex-1">Add</button>
                      <button onClick={() => setShowTaskForm(null)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm">✕</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTaskForm(list.id)}
                    className="text-gray-400 hover:text-white text-sm text-left"
                  >
                    + Add task
                  </button>
                )}
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold">{selectedTask.title}</h2>
              <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <p className="text-gray-400 text-sm">{selectedTask.description || 'No description'}</p>
            <div className="flex gap-3 text-sm">
              <span className={`px-2 py-1 rounded text-white ${priorityColor(selectedTask.priority)}`}>
                {selectedTask.priority} priority
              </span>
              {selectedTask.dueDate && (
                <span className="text-gray-400">📅 {new Date(selectedTask.dueDate).toLocaleDateString()}</span>
              )}
            </div>

            {/* Attachments */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Attachments</p>
              {selectedTask.attachments?.map((a, i) => (
                <a key={i} href={a.url.replace('/upload/', '/upload/fl_attachment/')} target="_blank" rel="noreferrer" className="text-blue-400 text-sm block hover:underline">
                  📎 {a.name}
                </a>
              ))}
              <label className="mt-2 block cursor-pointer text-sm text-blue-400 hover:underline">
                {uploading ? 'Uploading...' : '+ Upload file'}
                <input type="file" className="hidden" onChange={e => uploadFile(e, selectedTask._id)} />
              </label>
            </div>

            <button
              onClick={() => deleteTask(selectedTask._id)}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
            >
              Delete Task
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Board