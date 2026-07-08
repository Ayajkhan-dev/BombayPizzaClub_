import React from 'react'
import { FaMinus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import { CiTrash } from "react-icons/ci";
import { useDispatch } from 'react-redux';
import { removeCartItem, updateQuantity } from '../redux/userSlice';
function CartItemCard({data}) {
    const dispatch=useDispatch()
    const handleIncrease=(id,currentQty)=>{
       dispatch(updateQuantity({id,quantity:currentQty+1}))
    }
      const handleDecrease=(id,currentQty)=>{
        if(currentQty>1){
  dispatch(updateQuantity({id,quantity:currentQty-1}))
        }
        
    }
  return (
    <div className='flex items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl shadow border'>
      <div className='flex items-center gap-3 sm:gap-4 min-w-0 flex-1'>
        <img src={data.image} alt="" className='w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border flex-shrink-0'/>
        <div className='min-w-0'>
            <h1 className='font-medium text-gray-800 text-sm sm:text-base truncate'>{data.name}</h1>
            <p className='text-xs sm:text-sm text-gray-500'>₹{data.price} x {data.quantity}</p>
            <p className="font-bold text-gray-900 text-sm sm:text-base">₹{data.price*data.quantity}</p>
        </div>
      </div>
      <div className='flex items-center gap-2 sm:gap-3 flex-shrink-0'>
        <button className='p-2 cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200' onClick={()=>handleDecrease(data.id,data.quantity)}>
        <FaMinus size={12}/>
        </button>
        <span>{data.quantity}</span>
        <button className='p-2 cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200'  onClick={()=>handleIncrease(data.id,data.quantity)}>
        <FaPlus size={12}/>
        </button>
        <button className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
 onClick={()=>dispatch(removeCartItem(data.id))}>
<CiTrash size={18}/>
        </button>
      </div>
    </div>
  )
}

export default CartItemCard