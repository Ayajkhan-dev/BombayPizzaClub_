import React, { useEffect, useRef, useState } from 'react'
import { IoIosSearch } from "react-icons/io"
import { FiShoppingCart } from "react-icons/fi"
import { useDispatch, useSelector } from 'react-redux'
import { RxCross2 } from "react-icons/rx"
import axios from 'axios'
import { serverUrl } from '../App'
import { setSearchItems, setUserData } from '../redux/userSlice'
import { FaPlus } from "react-icons/fa6"
import { TbReceipt2 } from "react-icons/tb"
import { useNavigate } from 'react-router-dom'
import NotificationBell from './NotificationBell'

function Nav() {
    const { userData, cartItems } = useSelector(state => state.user)
    const [showInfo, setShowInfo] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [query, setQuery] = useState("")
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleLogOut = async () => {
        try {
            await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true })
            dispatch(setUserData(null))
            navigate("/signin")
        } catch (error) {
            console.log(error)
        }
    }

    const searchAbortController = useRef(null)

    const handleSearchItems = async (searchTerm, signal) => {
        try {
            const result = await axios.get(`${serverUrl}/api/item/search-items?query=${encodeURIComponent(searchTerm)}`, { withCredentials: true, signal })
            dispatch(setSearchItems(result.data))
        } catch (error) {
            if (axios.isCancel?.(error) || error.name === 'CanceledError') return
            console.log(error)
        }
    }

    useEffect(() => {
        const trimmedQuery = query.trim()

        if (searchAbortController.current) {
            searchAbortController.current.abort()
        }

        if (trimmedQuery.length > 0) {
            const controller = new AbortController()
            searchAbortController.current = controller
            handleSearchItems(trimmedQuery, controller.signal)
        } else {
            dispatch(setSearchItems(null))
        }

        return () => {
            if (searchAbortController.current) {
                searchAbortController.current.abort()
            }
        }
    }, [query])

    // Guest (not logged in) ke liye bhi search bar aur cart dikhna chahiye,
    // isliye "user" role ke saath guest (!userData) ko bhi include kiya
    const isGuestOrUser = !userData || userData?.role === "user"

    return (
        <div className='w-full h-[80px] flex items-center justify-between md:justify-around gap-2 sm:gap-[30px] px-3 sm:px-[20px] fixed top-0 z-[9999] bg-[#fff9f6] border-b border-orange-50 shadow-sm'>
            <h1 className='text-base sm:text-2xl md:text-3xl font-black text-[#ff4d2d] cursor-pointer whitespace-nowrap' onClick={() => navigate("/")}>BOMBAY PIZZA CLUB</h1>

            {isGuestOrUser && (
                <div className='hidden md:flex flex-1 max-w-md h-[45px] bg-white border border-gray-200 rounded-full items-center px-4 gap-2 focus-within:border-[#ff4d2d] transition-all'>
                    <IoIosSearch size={22} className='text-gray-400' />
                    <input
                        type="text"
                        placeholder='Search delicious food...'
                        className='bg-transparent outline-none w-full text-sm'
                        onChange={(e) => setQuery(e.target.value)}
                        value={query}
                    />
                </div>
            )}

            <div className='flex items-center gap-2 sm:gap-5'>
                {isGuestOrUser && (
                    <div className='md:hidden cursor-pointer' onClick={() => setShowSearch(!showSearch)}>
                        {showSearch ? <RxCross2 size={24} className='text-[#ff4d2d]' /> : <IoIosSearch size={24} className='text-[#ff4d2d]' />}
                    </div>
                )}

                {userData?.role === "owner" ? (
                    <div className='flex items-center gap-2 sm:gap-3'>
                        <button
                            className='hidden md:flex items-center gap-2 px-5 py-2 rounded-full bg-[#ff4d2d] text-white text-sm font-bold shadow-md hover:bg-orange-600 transition-all'
                            onClick={() => navigate("/add-item")}
                        >
                            <FaPlus />
                            Add Item
                        </button>
                        <button
                            className='md:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#ff4d2d] text-white shadow-md'
                            onClick={() => navigate("/add-item")}
                        >
                            <FaPlus />
                        </button>
                        <button
                            className='flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-orange-50 text-[#ff4d2d] text-sm font-bold border border-orange-100 hover:bg-orange-100 transition-all'
                            onClick={() => navigate("/my-orders")}
                        >
                            <TbReceipt2 size={18} />
                            <span className='hidden sm:inline'>Orders</span>
                        </button>
                        <NotificationBell />
                    </div>
                ) : (
                    isGuestOrUser && (
                        <div className='flex items-center gap-2 sm:gap-5'>
                            {userData && (
                                <button
                                    className='hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-[#ff4d2d] text-sm font-bold border border-orange-100 hover:bg-orange-100 transition-all'
                                    onClick={() => navigate("/my-orders")}
                                >
                                    <TbReceipt2 size={18} />
                                    Orders
                                </button>
                            )}
                            <div className='relative cursor-pointer' onClick={() => navigate("/cart")}>
                                <div className='w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-orange-50 text-[#ff4d2d] hover:bg-orange-50'>
                                    <FiShoppingCart size={20} />
                                </div>
                                {cartItems?.length > 0 && (
                                    <span className='absolute -top-1 -right-1 bg-[#ff4d2d] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white'>
                                        {cartItems.length}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                )}

                {/* Guest: Login/Signup buttons instead of profile circle */}
                {!userData ? (
                    <div className='flex items-center gap-2'>
                        <button
                            className='px-3 sm:px-4 py-2 rounded-full border border-[#ff4d2d] text-[#ff4d2d] text-sm font-bold hover:bg-orange-50 transition-all'
                            onClick={() => navigate("/signin")}
                        >
                            Login
                        </button>
                        <button
                            className='hidden sm:flex px-4 py-2 rounded-full bg-[#ff4d2d] text-white text-sm font-bold shadow-md hover:bg-orange-600 transition-all'
                            onClick={() => navigate("/signup")}
                        >
                            Sign Up
                        </button>
                    </div>
                ) : (
                    <>
                        <div
                            className='w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-[#ff4d2d] text-white font-black cursor-pointer shadow-md hover:scale-105 transition-transform'
                            onClick={() => setShowInfo(!showInfo)}
                        >
                            {userData?.fullName?.charAt(0).toUpperCase()}
                        </div>

                        {showInfo && (
                            <div className='absolute top-[85px] right-2 sm:right-4 w-56 max-w-[90vw] bg-white shadow-2xl rounded-2xl p-4 flex flex-col gap-3 border border-orange-50 z-[10000] animate-in fade-in zoom-in duration-200'>
                                <div className='pb-2 border-b border-gray-100'>
                                    <p className='text-xs text-gray-400 font-bold uppercase'>Account</p>
                                    <p className='font-bold text-gray-800 truncate'>{userData?.fullName}</p>
                                    <p className='text-[10px] text-[#ff4d2d] font-bold uppercase mt-0.5'>{userData?.role}</p>
                                </div>

                                <div className='flex flex-col gap-1'>
                                    <button className='w-full text-left py-2 px-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 sm:hidden' onClick={() => { navigate("/my-orders"); setShowInfo(false) }}>My Orders</button>
                                    <button className='w-full text-left py-2 px-3 rounded-lg hover:bg-red-50 text-sm font-bold text-red-600' onClick={handleLogOut}>Log Out</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Mobile Search Input */}
            {showSearch && isGuestOrUser && (
                <div className='absolute top-[80px] left-0 w-full p-4 bg-white shadow-lg md:hidden animate-in slide-in-from-top duration-300'>
                    <div className='flex h-[45px] bg-gray-50 border border-gray-200 rounded-lg items-center px-4 gap-2'>
                        <IoIosSearch size={22} className='text-gray-400' />
                        <input
                            type="text"
                            placeholder='Search delicious food...'
                            className='bg-transparent outline-none w-full text-sm'
                            onChange={(e) => setQuery(e.target.value)}
                            value={query}
                            autoFocus
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default Nav