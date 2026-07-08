import axios from 'axios'
import { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setMyOrders } from '../redux/userSlice'

function useGetMyOrders() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        if (!userData) return

        const fetchOrders = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/order/my-orders`, { withCredentials: true })
                dispatch(setMyOrders(result.data))
            } catch (error) {
                console.log(error)
            }
        }

        fetchOrders()

        // Har 15 second mein auto-refresh — socket ka backup
        const interval = setInterval(fetchOrders, 15000)
        return () => clearInterval(interval)

    }, [userData?._id]) // FIX L3: _id use karo - object reference change se loop nahi hoga

}

export default useGetMyOrders