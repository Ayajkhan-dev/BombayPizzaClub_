import React, { useEffect, useRef, useState } from 'react'
import Nav from './Nav'
import { categories } from '../category'
import CategoryCard from './CategoryCard'
import { FaCircleChevronLeft } from "react-icons/fa6"
import { FaCircleChevronRight } from "react-icons/fa6"
import { useSelector } from 'react-redux'
import FoodCard from './FoodCard'

function UserDashboard() {
    const { itemsInMyCity, searchItems } = useSelector(state => state.user)
    const cateScrollRef = useRef()
    const [showLeftCateButton, setShowLeftCateButton] = useState(false)
    const [showRightCateButton, setShowRightCateButton] = useState(false)
    const [updatedItemsList, setUpdatedItemsList] = useState([])

    const handleFilterByCategory = (category) => {
        if (category == "All") {
            setUpdatedItemsList(itemsInMyCity)
        } else {
            const filteredList = itemsInMyCity?.filter(i => i.category === category)
            setUpdatedItemsList(filteredList)
        }
    }

    useEffect(() => {
        setUpdatedItemsList(itemsInMyCity)
    }, [itemsInMyCity])

    const updateButton = (ref, setLeftButton, setRightButton) => {
        const element = ref.current
        if (element) {
            setLeftButton(element.scrollLeft > 0)
            setRightButton(element.scrollLeft + element.clientWidth < element.scrollWidth)
        }
    }

    const scrollHandler = (ref, direction) => {
        if (ref.current) {
            ref.current.scrollBy({
                left: direction == "left" ? -200 : 200,
                behavior: "smooth"
            })
        }
    }

    useEffect(() => {
        if (cateScrollRef.current) {
            updateButton(cateScrollRef, setShowLeftCateButton, setShowRightCateButton)
            cateScrollRef.current.addEventListener('scroll', () => {
                updateButton(cateScrollRef, setShowLeftCateButton, setShowRightCateButton)
            })
        }

        return () => {
            cateScrollRef?.current?.removeEventListener("scroll", () => {
                updateButton(cateScrollRef, setShowLeftCateButton, setShowRightCateButton)
            })
        }
    }, [categories])

    return (
        <div className='w-full min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-x-hidden overflow-y-auto'>
            <Nav />

            {searchItems && searchItems.length > 0 && (
                <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-4 sm:p-5 bg-white shadow-md rounded-2xl mt-4'>
                    <h1 className='text-gray-900 text-xl sm:text-2xl md:text-3xl font-semibold border-b border-gray-200 pb-2'>
                        Search Results
                    </h1>
                    <div className='w-full h-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6'>
                        {searchItems.map((item) => (
                            <FoodCard data={item} key={item._id} />
                        ))}
                    </div>
                </div>
            )}

            <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
                <h1 className='text-gray-800 text-xl sm:text-2xl md:text-3xl'>Inspiration for your first order</h1>
                <div className='w-full relative'>
                    {showLeftCateButton && (
                        <button
                            className='hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10'
                            onClick={() => scrollHandler(cateScrollRef, "left")}
                        >
                            <FaCircleChevronLeft />
                        </button>
                    )}
                    <div className='w-full flex overflow-x-auto gap-3 sm:gap-4 pb-2' ref={cateScrollRef}>
                        {categories.map((cate, index) => (
                            <CategoryCard
                                name={cate.category}
                                image={cate.image}
                                key={index}
                                onClick={() => handleFilterByCategory(cate.category)}
                            />
                        ))}
                    </div>
                    {showRightCateButton && (
                        <button
                            className='hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10'
                            onClick={() => scrollHandler(cateScrollRef, "right")}
                        >
                            <FaCircleChevronRight />
                        </button>
                    )}
                </div>
            </div>

            <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
                <h1 className='text-gray-800 text-xl sm:text-2xl md:text-3xl'>
                    Our Menu
                </h1>
                <div className='w-full h-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-[20px]'>
                    {updatedItemsList?.map((item, index) => (
                        <FoodCard key={index} data={item} />
                    ))}
                    {(!updatedItemsList || updatedItemsList.length === 0) && (
                        <p className='text-gray-500 text-lg py-10 col-span-full'>No items available right now. Check back soon!</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserDashboard