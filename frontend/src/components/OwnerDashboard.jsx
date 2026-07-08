import React from 'react'
import Nav from './Nav'
import { useSelector } from 'react-redux'
import { FaUtensils, FaPlus } from "react-icons/fa"
import { useNavigate } from 'react-router-dom'
import OwnerItemCard from './OwnerItemCard'

function OwnerDashboard() {
    const { myItems } = useSelector(state => state.owner)
    const { userData } = useSelector(state => state.user)
    const navigate = useNavigate()

    return (
        <div className='w-full min-h-screen bg-[#fff9f6] flex flex-col items-center pb-20'>
            <Nav />

            <div className='w-full flex flex-col items-center gap-6 px-4 sm:px-6 mt-24'>
                <div className='w-full max-w-4xl flex items-center justify-between'>
                    <h1 className='text-2xl sm:text-3xl text-gray-900 font-bold flex items-center gap-3'>
                        <FaUtensils className='text-[#ff4d2d] w-10 h-10' />
                        Welcome, {userData?.fullName}
                    </h1>
                    <button
                        className='bg-[#ff4d2d] text-white px-5 sm:px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-orange-600 transition-all duration-200 flex items-center gap-2'
                        onClick={() => navigate("/add-item")}
                    >
                        <FaPlus />
                        Add Food Item
                    </button>
                </div>

                {(!myItems || myItems.length === 0) ? (
                    <div className='flex justify-center items-center p-4 sm:p-6 w-full max-w-lg mt-10'>
                        <div className='w-full bg-white shadow-lg rounded-2xl p-8 border border-gray-100 text-center'>
                            <FaUtensils className='text-[#ff4d2d] w-16 h-16 mx-auto mb-4' />
                            <h2 className='text-xl sm:text-2xl font-bold text-gray-800 mb-2'>No Items Added Yet</h2>
                            <p className='text-gray-600 mb-6'>
                                Share your delicious dishes with the world. Click the button above to add your first item!
                            </p>
                            <button
                                className='bg-[#ff4d2d] text-white px-6 py-2 rounded-full font-bold hover:bg-orange-600 transition-colors'
                                onClick={() => navigate("/add-item")}
                            >
                                Add Your First Item
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className='w-full max-w-4xl flex flex-col gap-5 mt-4'>
                        <h2 className='text-xl font-bold text-gray-700 px-2'>Manage Your Items ({myItems.length})</h2>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            {myItems.map((item, index) => (
                                <OwnerItemCard data={item} key={index} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default OwnerDashboard