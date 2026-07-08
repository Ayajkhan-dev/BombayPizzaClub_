import axios from 'axios'
import { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch } from 'react-redux'
import { setItemsInMyCity } from '../redux/userSlice'

function useGetAllItems() {
    const dispatch = useDispatch()

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/item/get-all`, { withCredentials: true })
                dispatch(setItemsInMyCity(result.data))
            } catch (error) {
                console.log(error)
            }
        }
        // Items sabke liye fetch hone chahiye — guest ho ya logged-in user
        fetchItems()
    }, [])
}

export default useGetAllItems