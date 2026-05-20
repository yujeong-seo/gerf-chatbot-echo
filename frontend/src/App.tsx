import { useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import EntryPage     from './pages/EntryPage'
import CommunityPage from './pages/CommunityPage'
import ChatPage      from './pages/ChatPage'
import UserPage      from './pages/UserPage'
import type { Message } from './types'

function RootRoute() {
  return sessionStorage.getItem('echo_onboarded')
    ? <Navigate to="/community" replace />
    : <EntryPage />
}

function GuardedRoute({ element }: { element: JSX.Element }) {
  return sessionStorage.getItem('echo_onboarded')
    ? element
    : <Navigate to="/" replace />
}

export default function App() {
  // Lifted here so chat survives tab navigation
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const chatThreadId = useRef(crypto.randomUUID())

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<RootRoute />} />
        <Route path="/community" element={<GuardedRoute element={<CommunityPage />} />} />
        <Route path="/chat"      element={<GuardedRoute element={
          <ChatPage
            messages={chatMessages}
            setMessages={setChatMessages}
            threadId={chatThreadId.current}
          />
        } />} />
        <Route path="/user"      element={<GuardedRoute element={<UserPage threadId={chatThreadId.current} />} />} />
      </Routes>
    </BrowserRouter>
  )
}
