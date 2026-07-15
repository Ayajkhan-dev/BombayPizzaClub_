import React, { useState } from 'react'
import { FaLeaf, FaDrumstickBite, FaMinus, FaPlus, FaShoppingCart } from "react-icons/fa";
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/userSlice';
import { toast } from 'react-hot-toast';

function FoodCard({ data }) {
    const [quantity, setQuantity] = useState(1)
    const dispatch = useDispatch()
    const { cartItems } = useSelector(state => state.user)

    // NEW FEATURE: agar item ke paas sizes hain (Pizza), to default Regular select hoga
    const hasSizes = data.sizes && data.sizes.length > 0
    const [selectedSize, setSelectedSize] = useState(hasSizes ? data.sizes.find(s => s.label === "Regular") || data.sizes[0] : null)

    const displayPrice = hasSizes ? selectedSize?.price : data.price

    const handleIncrease = () => {
        setQuantity(prev => prev + 1)
    }
    const handleDecrease = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1)
        }
    }

    const handleAddToCart = () => {
        dispatch(addToCart({
            id: data._id,
            name: data.name,
            price: displayPrice,
            image: data.image,
            owner: data.owner?._id || data.owner,
            quantity,
            foodType: data.foodType,
            size: hasSizes ? selectedSize.label : undefined
        }))
        toast.success(`${data.name}${hasSizes ? ` (${selectedSize.label})` : ""} added to cart!`)
    }

    const isInCart = cartItems.some(i => i.id === data._id && (i.size || null) == (hasSizes ? selectedSize.label : null))

    return (
        <div className='w-full rounded-2xl border border-orange-100 bg-white shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group'>
            <div className='relative w-full h-[140px] sm:h-[180px] overflow-hidden'>
                <div className='absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md'>
                    {data.foodType === "veg" ? <FaLeaf className='text-green-600 text-sm' /> : <FaDrumstickBite className='text-red-600 text-sm' />}
                </div>
                <img src={data.image} alt={data.name} className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110' />
                <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent' />
            </div>

            <div className="flex-1 flex flex-col p-3 sm:p-4">
                <div className='flex justify-between items-start gap-2'>
                    <h1 className='font-bold text-gray-800 text-sm sm:text-lg leading-tight line-clamp-2'>{data.name}</h1>
                </div>

                <p className='text-[10px] sm:text-xs text-gray-400 mt-2 font-medium uppercase tracking-wider'>{data.category}</p>

                {hasSizes && (
                    <div className='flex gap-1.5 mt-2'>
                        {data.sizes.map((s) => (
                            <button
                                key={s.label}
                                type="button"
                                onClick={() => setSelectedSize(s)}
                                className={`text-[10px] sm:text-xs px-2 py-1 rounded-full border font-semibold transition ${
                                    selectedSize?.label === s.label
                                        ? "bg-[#ff4d2d] text-white border-[#ff4d2d]"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                                }`}
                            >
                                {s.label} ({s.inches}")
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 sm:p-4 bg-gray-50/50 border-t border-gray-50'>
                <div className='flex flex-col'>
                    <span className='text-[10px] text-gray-400 font-bold uppercase'>Price</span>
                    <span className='font-black text-gray-900 text-lg sm:text-xl'>₹{displayPrice}</span>
                </div>

                <div className='flex items-center gap-2'>
                    <div className='flex items-center bg-white border border-orange-100 rounded-full h-9 px-1 shadow-sm'>
                        <button className='w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#ff4d2d] transition' onClick={handleDecrease}>
                            <FaMinus size={10} />
                        </button>
                        <span className='w-6 text-center font-bold text-sm'>{quantity}</span>
                        <button className='w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#ff4d2d] transition' onClick={handleIncrease}>
                            <FaPlus size={10} />
                        </button>
                    </div>
                    
                    <button 
                        className={`h-9 w-9 flex items-center justify-center rounded-full transition-all duration-300 shadow-md ${isInCart ? "bg-gray-800 hover:bg-gray-700" : "bg-[#ff4d2d] hover:bg-orange-600"} text-white`}
                        onClick={handleAddToCart}
                        title={isInCart ? "Update Quantity" : "Add to Cart"}
                    >
                        <FaShoppingCart size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default FoodCard