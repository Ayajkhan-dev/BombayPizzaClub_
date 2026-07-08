import axios from 'axios';
import React, { useState } from 'react'
import { MdPhone, MdLocationOn } from "react-icons/md";
import { serverUrl } from '../App';
import { useDispatch } from 'react-redux';
import { updateOrderStatus } from '../redux/userSlice';
import { toast } from 'react-hot-toast';

function OwnerOrderCard({ data }) {
    const [availableBoys, setAvailableBoys] = useState([])
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()

    const handleUpdateStatus = async (orderId, ownerId, status) => {
        if (!status) return
        setLoading(true)
        try {
            const result = await axios.post(`${serverUrl}/api/order/update-status/${orderId}/${ownerId}`, { status }, { withCredentials: true })
            dispatch(updateOrderStatus({ orderId, ownerId, status }))
            setAvailableBoys(result.data.availableBoys || [])
            toast.success(`Status updated to ${status}`)
        } catch (error) {
            console.log(error)
            toast.error("Error updating status")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-orange-50 space-y-5 hover:shadow-xl transition-all duration-300'>
            <div className='flex flex-col sm:flex-row justify-between items-start gap-3'>
                <div className='min-w-0 flex-1'>
                    <h2 className='text-base sm:text-lg font-black text-gray-800 truncate'>{data.user?.fullName}</h2>
                    <p className='text-xs text-gray-400 font-medium mb-2 truncate'>{data.user?.email}</p>
                    <div className='flex flex-col gap-1'>
                        <p className='flex items-center gap-2 text-sm text-gray-600 font-bold'>
                            <MdPhone size={18} className='text-[#ff4d2d] flex-shrink-0' />
                            <span>{data.user?.mobile}</span>
                        </p>
                        <p className='flex items-start gap-2 text-sm text-gray-600'>
                            <MdLocationOn size={18} className='text-[#ff4d2d] flex-shrink-0 mt-0.5' />
                            <span className='break-words'>{data?.deliveryAddress?.text}</span>
                        </p>
                    </div>
                </div>
                <div className='flex flex-row sm:flex-col items-center sm:items-end gap-2 flex-shrink-0'>
                    {data.paymentMethod === "online"
                        ? <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${data.payment ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {data.payment ? "Paid Online" : "Payment Pending"}
                        </span>
                        : <span className='text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase'>Cash on Delivery</span>
                    }
                    <p className='text-[10px] text-gray-400 font-bold uppercase'>Ordered: {new Date(data.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            <div className='bg-gray-50 rounded-xl p-3 sm:p-4'>
                <p className='text-xs text-gray-400 font-black uppercase mb-3'>Ordered Items</p>
                <div className='flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide'>
                    {data.shopOrders.shopOrderItems.map((item, index) => (
                        <div key={index} className='flex-shrink-0 w-32 sm:w-36 bg-white border border-orange-50 rounded-xl p-2 shadow-sm'>
                            <img src={item.item?.image} alt="" className='w-full h-20 object-cover rounded-lg' />
                            <p className='text-xs font-bold mt-2 text-gray-800 line-clamp-1'>{item.name}</p>
                            <p className='text-[10px] text-[#ff4d2d] font-black'>QTY: {item.quantity} × ₹{item.price}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className='flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100'>
                <div className='flex flex-wrap items-center gap-3'>
                    <div className='flex flex-col'>
                        <span className='text-[10px] text-gray-400 font-black uppercase'>Current Status</span>
                        <span className='text-sm font-black text-[#ff4d2d] uppercase tracking-wide'>{data.shopOrders.status}</span>
                    </div>
                    
                    <select 
                        className='bg-white border-2 border-orange-100 rounded-lg px-3 sm:px-4 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff4d2d] transition-all disabled:opacity-50'
                        disabled={loading}
                        onChange={(e) => handleUpdateStatus(data._id, data.shopOrders.owner?._id || data.shopOrders.owner, e.target.value)}
                        value=""
                    >
                        <option value="" disabled>Change Status</option>
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="out of delivery">Out Of Delivery</option>
                    </select>
                </div>
                
                <div className='flex flex-col items-end'>
                    <span className='text-[10px] text-gray-400 font-black uppercase'>Total Amount</span>
                    <span className='text-lg sm:text-xl font-black text-gray-900'>₹{data.shopOrders.subtotal}</span>
                </div>
            </div>

            {data.shopOrders.status === "out of delivery" && (
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-2">
                    <p className='text-xs font-black text-orange-800 uppercase flex items-center gap-2'>
                        <div className='w-2 h-2 bg-orange-500 rounded-full animate-pulse' />
                        {data.shopOrders.assignedDeliveryBoy ? "Assigned Delivery Boy" : "Available Delivery Boys"}
                    </p>
                    
                    {data.shopOrders.assignedDeliveryBoy ? (
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1'>
                            <p className='text-sm font-bold text-gray-800'>{data.shopOrders.assignedDeliveryBoy.fullName}</p>
                            <p className='text-sm font-black text-[#ff4d2d]'>{data.shopOrders.assignedDeliveryBoy.mobile}</p>
                        </div>
                    ) : (
                        <div className='space-y-1'>
                            {availableBoys.length > 0 ? (
                                availableBoys.map((b, index) => (
                                    <div key={index} className='flex items-center justify-between bg-white/50 p-2 rounded-lg gap-2'>
                                        <p className='text-xs font-bold truncate'>{b.fullName}</p>
                                        <p className='text-xs font-black text-[#ff4d2d] flex-shrink-0'>{b.mobile}</p>
                                    </div>
                                ))
                            ) : (
                                <p className='text-xs text-gray-500 italic'>Waiting for delivery boy to accept...</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default OwnerOrderCard