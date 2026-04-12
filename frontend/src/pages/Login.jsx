import { useAuth0 } from '@auth0/auth0-react'

function Login() {
  const { loginWithRedirect } = useAuth0()

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl p-10 flex flex-col items-center gap-6 shadow-2xl">
        <div className="text-4xl">📋</div>
        <h1 className="text-3xl font-bold text-white">TaskFlow</h1>
        <p className="text-gray-400 text-center max-w-xs">
          A real-time team task manager. Collaborate, organize, and get things done.
        </p>
        <button
          onClick={() => loginWithRedirect()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition w-full"
        >
          Login / Sign Up
        </button>
      </div>
    </div>
  )
}

export default Login