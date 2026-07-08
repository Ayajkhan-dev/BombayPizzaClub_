import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setMyItems } from '../redux/ownerSlice'

function useGetMyItems() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/item/get-my-items`, { withCredentials: true })
                dispatch(setMyItems(result.data))
            } catch (error) {
                console.log(error)
            }
        }
        if (userData && userData.role === "owner") {
            fetchItems()
        }
    }, [userData])
}

export default useGetMyItems
