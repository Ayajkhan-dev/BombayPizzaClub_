import React, { useEffect, useRef } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import ForgotPassword from './pages/ForgotPassword'
import useGetCurrentUser from './hooks/useGetCurrentUser'
import { useDispatch, useSelector } from 'react-redux'
import Home from './pages/Home'
import AddItem from './pages/AddItem'
import EditItem from './pages/EditItem'
import useGetAllItems from './hooks/useGetAllItems'
import useGetMyItems from './hooks/useGetMyItems'
import CartPage from './pages/CartPage'
import CheckOut from './pages/CheckOut'
import OrderPlaced from './pages/OrderPlaced'
import MyOrders from './pages/MyOrders'
import useGetMyOrders from './hooks/useGetMyOrders'
import useUpdateLocation from './hooks/useUpdateLocation'
import TrackOrderPage from './pages/TrackOrderPage'
import { Toaster } from 'react-hot-toast'
import useNotifications from './hooks/useNotifications'
import { SocketProvider } from './context/SocketContext'

export const serverUrl = import.meta.env.VITE_SERVER_URL
function App() {
    const { userData } = useSelector(state => state.user)

    useGetCurrentUser()
    useUpdateLocation()
    useGetAllItems()
    useGetMyItems()
    useGetMyOrders()
    useNotifications()

    return (
        <SocketProvider serverUrl={serverUrl} userId={userData?._id}>
            <Toaster position="top-center" reverseOrder={false} />
            <Routes>
                <Route path='/signup' element={!userData ? <SignUp /> : <Navigate to={"/"} />} />
                <Route path='/signin' element={!userData ? <SignIn /> : <Navigate to={"/"} />} />
                <Route path='/forgot-password' element={!userData ? <ForgotPassword /> : <Navigate to={"/"} />} />

                {/* Home page — open to all, no login required */}
                <Route path='/' element={<Home />} />

                {/* Cart — open to all, no login required */}
                <Route path='/cart' element={<CartPage />} />

                {/* Checkout — login required, this is the ONLY point that forces login */}
                <Route path='/checkout' element={userData ? <CheckOut /> : <Navigate to={"/signin"} />} />

                {/* Owner-only routes — still protected */}
                <Route path='/add-item' element={userData ? <AddItem /> : <Navigate to={"/signin"} />} />
                <Route path='/edit-item/:itemId' element={userData ? <EditItem /> : <Navigate to={"/signin"} />} />

                {/* Post-order / order-tracking — still protected since these need a logged-in user's data */}
                <Route path='/order-placed' element={userData ? <OrderPlaced /> : <Navigate to={"/signin"} />} />
                <Route path='/my-orders' element={userData ? <MyOrders /> : <Navigate to={"/signin"} />} />
                <Route path='/track-order/:orderId' element={userData ? <TrackOrderPage /> : <Navigate to={"/signin"} />} />
            </Routes>
        </SocketProvider>
    )
}

export default App