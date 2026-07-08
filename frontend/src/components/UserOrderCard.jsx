import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { serverUrl } from '../App'

function UserOrderCard({ data }) {
    const navigate = useNavigate()
    const [selectedRating, setSelectedRating] = useState({})

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-GB', {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })
    }

    const handleRating = async (itemId, rating) => {
        try {
            await axios.post(`${serverUrl}/api/item/rating`, { itemId, rating }, { withCredentials: true })
            setSelectedRating(prev => ({ ...prev, [itemId]: rating }))
        } catch (error) {
            console.log(error)
        }
    }

    // Safety check — agar data nahi hai toh kuch mat render karo
    if (!data) return null

    return (
        <div className='bg-white rounded-lg shadow p-4 space-y-4'>

            {/* Order Header */}
            <div className='flex justify-between border-b pb-2'>
                <div>
                    <p className='font-semibold'>Order #{data._id?.slice(-6)}</p>
                    <p className='text-sm text-gray-500'>Date: {formatDate(data.createdAt)}</p>
                </div>
                <div className='text-right'>
                    {/* Payment Status */}
                    {data.paymentMethod === "cod"
                        ? <p className='text-sm text-gray-500'>Cash on Delivery</p>
                        : <p className={`text-sm font-semibold flex items-center gap-1 ${data.payment ? "text-green-600" : "text-red-500"}`}>
                            Payment: {data.payment ? "✅ Done" : "❌ Pending"}
                          </p>
                    }
                    {/* BUG 1 FIX: optional chaining + fallback */}
                    {/* <p className='font-medium text-blue-600'>
                        {data.shopOrders?.[0]?.status || "Pending"}
                    </p> */}
                </div>
            </div>

            {/* Shop Orders */}
            {data.shopOrders?.map((shopOrder, index) => (
                <div className='border rounded-lg p-3 bg-[#fffaf7] space-y-3' key={index}>

                    {/* BUG 2 FIX: optional chaining on shop.name */}
                    <p className='font-medium text-gray-700'>
                        {shopOrder?.owner?.fullName || "Bombay Pizza Club"}
                    </p>

                    <div className='flex space-x-4 overflow-x-auto pb-2'>
                        {shopOrder.shopOrderItems?.map((item, idx) => (
                            <div key={idx} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white'>
                                <img
                                    src={item?.item?.image}
                                    alt={item?.name}
                                    className='w-full h-24 object-cover rounded'
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/160x96?text=No+Image' }}
                                />
                                <p className='text-sm font-semibold mt-1'>{item?.name}</p>
                                <p className='text-xs text-gray-500'>
                                    Qty: {item?.quantity} x ₹{item?.price}
                                </p>

                                {/* Rating — sirf delivered orders pe */}
                                {shopOrder.status === "delivered" && (
                                    <div className='flex space-x-1 mt-2'>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                className={`text-lg ${selectedRating[item?.item?._id] >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                                onClick={() => handleRating(item?.item?._id, star)}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className='flex justify-between items-center border-t pt-2'>
                        <p className='font-semibold'>Subtotal: ₹{shopOrder?.subtotal}</p>
                        <span className='text-sm font-medium text-blue-600'>{shopOrder?.status}</span>
                    </div>
                </div>
            ))}

            {/* Total + Track */}
            <div className='flex justify-between items-center border-t pt-2'>
                <p className='font-semibold'>Total: ₹{data.totalAmount}</p>
                <button
                    className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm'
                    onClick={() => navigate(`/track-order/${data._id}`)}
                >
                    Track Order
                </button>
            </div>
        </div>
    )
}

export default UserOrderCard