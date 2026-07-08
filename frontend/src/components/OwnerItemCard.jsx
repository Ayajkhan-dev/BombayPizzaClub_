import axios from 'axios';
import React from 'react'
import { FaPen, FaTrashAlt } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';
import { useDispatch } from 'react-redux';
import { setMyItems } from '../redux/ownerSlice';
import { toast } from 'react-hot-toast';

function OwnerItemCard({ data }) {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this item?")) return
        try {
            await axios.delete(`${serverUrl}/api/item/delete/${data._id}`, { withCredentials: true })
            // Re-fetch my items to update the dashboard
            const itemsResult = await axios.get(`${serverUrl}/api/item/get-my-items`, { withCredentials: true })
            dispatch(setMyItems(itemsResult.data))
            
            toast.success("Item deleted successfully.")
        } catch (error) {
            console.log(error)
            toast.error("Error deleting item")
        }
    }

    return (
        <div className='flex bg-white rounded-xl shadow-md overflow-hidden border border-orange-100 hover:shadow-xl transition-shadow duration-300 w-full'>
            <div className='w-1/3 flex-shrink-0 bg-gray-50'>
                <img src={data.image} alt={data.name} className='w-full h-40 object-cover' />
            </div>
            <div className='flex flex-col justify-between p-4 flex-1'>
                <div>
                    <div className='flex justify-between items-start'>
                        <h2 className='text-lg font-bold text-gray-800 line-clamp-1'>{data.name}</h2>
                        <div className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${data.foodType === "veg" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {data.foodType}
                        </div>
                    </div>
                    <p className='text-sm text-gray-500 mt-1 capitalize'>{data.category}</p>
                    <div className='text-[#ff4d2d] font-extrabold text-xl mt-2'>₹{data.price}</div>
                </div>
                
                <div className='flex items-center justify-end gap-3 pt-3 border-t border-gray-50'>
                    <button 
                        className='p-2.5 cursor-pointer rounded-full bg-orange-50 text-[#ff4d2d] hover:bg-orange-100 transition-colors' 
                        onClick={() => navigate(`/edit-item/${data._id}`)}
                        title="Edit Item"
                    >
                        <FaPen size={14} />
                    </button>
                    <button 
                        className='p-2.5 cursor-pointer rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors' 
                        onClick={handleDelete}
                        title="Delete Item"
                    >
                        <FaTrashAlt size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default OwnerItemCard
