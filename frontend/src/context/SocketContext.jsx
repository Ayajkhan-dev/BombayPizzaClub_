import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export const SocketProvider = ({ serverUrl, userId, children }) => {
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const socketInstance = io(serverUrl, { withCredentials: true })
    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
      setSocket(null)
    }
  }, [serverUrl])

  useEffect(() => {
    if (!socket) return
    if (userId) {
      socket.emit('identity', { userId })
    }
  }, [socket, userId])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
