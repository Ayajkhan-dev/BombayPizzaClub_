import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentAddress, setCurrentCity, setCurrentState } from '../redux/userSlice'
import { setAddress, setLocation } from '../redux/mapSlice'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

async function mapboxReverseGeocode(lat, lon) {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_TOKEN}&language=en&types=place,locality,neighborhood,address`
    const res = await fetch(url)
    const data = await res.json()
    if (!data.features || data.features.length === 0) return null

    const feature = data.features[0]
    const context = feature.context || []

    const getCtx = (type) => context.find(c => c.id.startsWith(type))?.text || ''

    const city = getCtx('place') || getCtx('locality') || feature.text || ''
    const state = getCtx('region') || ''
    const address = feature.place_name || ''

    return { city, state, address }
}

function useGetCity() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const latitude = position.coords.latitude
                const longitude = position.coords.longitude
                dispatch(setLocation({ lat: latitude, lon: longitude }))
                try {
                    const geo = await mapboxReverseGeocode(latitude, longitude)
                    if (geo) {
                        dispatch(setCurrentCity(geo.city))
                        dispatch(setCurrentState(geo.state))
                        dispatch(setCurrentAddress(geo.address))
                        dispatch(setAddress(geo.address))
                    }
                } catch (err) {
                    console.log('useGetCity reverse geocode error:', err)
                }
            },
            (err) => console.log('useGetCity GPS error:', err),
            { enableHighAccuracy: true, maximumAge: 0 }
        )
    }, [userData])
}

export default useGetCity