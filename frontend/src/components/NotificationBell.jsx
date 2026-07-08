import axios from 'axios'
import React, { useEffect, useRef, useState } from 'react'
import { IoMdNotifications } from "react-icons/io"
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { serverUrl } from '../App'
import { markAsRead } from '../redux/notificationSlice'

function NotificationBell() {
    const [showDropdown, setShowDropdown] = useState(false)
    const { notifications, unreadCount } = useSelector(state => state.notification)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleNotificationClick = async (notification) => {
        dispatch(markAsRead(notification._id))
        setShowDropdown(false)

        try {
            await axios.post(`${serverUrl}/api/notification/mark-as-read/${notification._id}`, {}, { withCredentials: true })
        } catch (error) {
            console.log("mark as read error", error)
        }

        navigate("/my-orders", { state: { highlightOrderId: notification.orderId } })
    }

    return (
        <div className='relative' ref={dropdownRef}>
            <button
                className='relative flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 text-[#ff4d2d] border border-orange-100 hover:bg-orange-100 transition-all'
                onClick={() => setShowDropdown(prev => !prev)}
                aria-label="Notifications"
            >
                <IoMdNotifications size={20} />
                {unreadCount > 0 && (
                    <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white'>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className='absolute top-[55px] right-0 w-80 max-w-[90vw] bg-white shadow-2xl rounded-2xl border border-orange-50 z-[10000] overflow-hidden animate-in fade-in zoom-in duration-200'>
                    <div className='px-4 py-3 border-b border-gray-100'>
                        <p className='font-bold text-gray-800'>Notifications</p>
                    </div>

                    <div className='max-h-96 overflow-y-auto'>
                        {(!notifications || notifications.length === 0) ? (
                            <p className='text-sm text-gray-400 text-center py-8'>No notifications yet</p>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-orange-50 transition-colors ${!notification.isRead ? 'bg-orange-50/60' : ''}`}
                                >
                                    <div className='flex items-start justify-between gap-2'>
                                        <p className='text-sm font-bold text-gray-800 leading-snug'>{notification.title}</p>
                                        {!notification.isRead && (
                                            <span className='w-2 h-2 rounded-full bg-[#ff4d2d] mt-1.5 flex-shrink-0' />
                                        )}
                                    </div>
                                    <p className='text-xs text-gray-600 mt-1'>{notification.customerName}</p>
                                    <p className='text-[10px] text-gray-400 mt-0.5'>Order ID: {String(notification.orderId).slice(-8).toUpperCase()}</p>
                                    <div className='flex items-center justify-between mt-1'>
                                        <span className='text-xs font-bold text-[#ff4d2d]'>₹{notification.orderAmount}</span>
                                        <span className='text-[10px] text-gray-400'>
                                            {new Date(notification.createdAt).toLocaleString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default NotificationBell