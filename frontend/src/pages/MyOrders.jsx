import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { IoIosArrowRoundBack } from "react-icons/io"
import { useNavigate } from 'react-router-dom'
import UserOrderCard from '../components/UserOrderCard'
import OwnerOrderCard from '../components/OwnerOrderCard'
import { setMyOrders, updateRealtimeOrderStatus } from '../redux/userSlice'
import { useSocket } from '../context/SocketContext'

function MyOrders() {
    const { userData, myOrders } = useSelector(state => state.user)
    const socket = useSocket()
    const navigate = useNavigate()
    const dispatch = useDispatch()

    useEffect(() => {
        if (!socket) return

        socket.on('newOrder', (data) => {
            if (data.shopOrders?.owner._id === userData?._id) {
                dispatch(setMyOrders([data, ...myOrders]))
            }
        })

        socket.on('update-status', ({ orderId, ownerId, status, userId }) => {
            if (userId === userData?._id) {
                dispatch(updateRealtimeOrderStatus({ orderId, ownerId, status }))
            }
        })

        return () => {
            socket.off('newOrder')
            socket.off('update-status')
        }
    }, [socket, myOrders, userData?._id]) // FIX: Sahi dependencies

    return (
        <div className='w-full min-h-screen bg-[#fff9f6] flex justify-center px-4'>
            <div className='w-full max-w-[800px] p-4'>
                <div className='flex items-center gap-[20px] mb-6'>
                    <div className='z-[10]' onClick={() => navigate("/")}>
                        <IoIosArrowRoundBack size={35} className='text-[#ff4d2d]' />
                    </div>
                    <h1 className='text-2xl font-bold text-start'>My Orders</h1>
                </div>
                <div className='space-y-6'>
                    {myOrders?.map((order, index) => (
                        userData.role === "user" ? (
                            <UserOrderCard data={order} key={index} />
                        ) : userData.role === "owner" ? (
                            <OwnerOrderCard data={order} key={index} />
                        ) : null
                    ))}
                </div>
            </div>
        </div>
    )
}

export default MyOrders