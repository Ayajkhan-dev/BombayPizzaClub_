import React, { useEffect, useRef, useState, useCallback } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io"
import { TbCurrentLocation } from "react-icons/tb"
import { IoLocationSharp } from "react-icons/io5"
import { useDispatch, useSelector } from 'react-redux'
import { setAddress, setLocation } from '../redux/mapSlice'
import { MdDeliveryDining } from "react-icons/md"
import { FaCreditCard } from "react-icons/fa"
import { FaMobileScreenButton } from "react-icons/fa6"
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { serverUrl } from '../App'
import { addMyOrder, clearCart } from '../redux/userSlice'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const SHOP_LAT = parseFloat(import.meta.env.VITE_SHOP_LAT)
const SHOP_LNG = parseFloat(import.meta.env.VITE_SHOP_LNG)
const DELIVERY_RADIUS_KM = parseFloat(import.meta.env.VITE_DELIVERY_RADIUS_KM) || 5

mapboxgl.accessToken = MAPBOX_TOKEN

// Haversine formula
function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

// Helper: convert meters to Mapbox circle-radius pixels at max zoom
function metersToPixelsAtMaxZoom(meters, latitude) {
    return meters / 0.075 / Math.cos(latitude * Math.PI / 180)
}

// Mapbox Reverse Geocoding
async function mapboxReverseGeocode(lat, lon) {
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_TOKEN}&language=en&types=address,place,locality,neighborhood`
        const res = await fetch(url)
        const data = await res.json()
        if (data.features && data.features.length > 0) {
            return data.features[0].place_name
        }
    } catch (err) {
        console.log('Reverse geocode error:', err)
    }
    return null
}

function CheckOut() {
    const { location, address } = useSelector(state => state.map)
    const { cartItems, totalAmount } = useSelector(state => state.user)
    const [addressInput, setAddressInput] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('online')
    const [rangeError, setRangeError] = useState('')
    const [isLocating, setIsLocating] = useState(false)
    const [suggestions, setSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [searchTimeout, setSearchTimeout] = useState(null)

    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)
    const markerRef = useRef(null)

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const deliveryFee = 0
    const AmountWithDeliveryFee = totalAmount

    const initialCenter = [
        location?.lon ?? SHOP_LNG,
        location?.lat ?? SHOP_LAT
    ]

    const updateMarker = useCallback((lng, lat) => {
        if (!mapRef.current) return
        if (markerRef.current) {
            markerRef.current.setLngLat([lng, lat])
        } else {
            markerRef.current = new mapboxgl.Marker({ color: '#ff4d2d', draggable: true })
                .setLngLat([lng, lat])
                .addTo(mapRef.current)

            markerRef.current.on('dragend', async () => {
                const lngLat = markerRef.current.getLngLat()
                dispatch(setLocation({ lat: lngLat.lat, lon: lngLat.lng }))
                setRangeError('')
                const addr = await mapboxReverseGeocode(lngLat.lat, lngLat.lng)
                if (addr) {
                    dispatch(setAddress(addr))
                    setAddressInput(addr)
                }
            })
        }
        mapRef.current.flyTo({ center: [lng, lat], zoom: 16, duration: 800 })
    }, [dispatch])

    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: initialCenter,
            zoom: 13,
        })

        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

        mapRef.current.on('load', () => {
            const shopMarkerEl = document.createElement('div')
            shopMarkerEl.style.cursor = 'pointer'
            shopMarkerEl.style.textAlign = 'center'
            shopMarkerEl.style.display = 'flex'
            shopMarkerEl.style.flexDirection = 'column'
            shopMarkerEl.style.alignItems = 'center'
            shopMarkerEl.innerHTML = `
    <div style="background:#ff4d2d; color:white; font-size:11px; font-weight:bold; padding:3px 7px; border-radius:8px; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.3); margin-bottom:3px;">
        🍕 Bombay Pizza Club
    </div>
    <div style="font-size:26px; line-height:1;">📍</div>
`
            new mapboxgl.Marker({ element: shopMarkerEl })
                .setLngLat([SHOP_LNG, SHOP_LAT])
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 })
                        .setHTML('<strong>🍕 Bombay Pizza Club</strong><br/>We are here!')
                )
                .addTo(mapRef.current)

            mapRef.current.addSource('delivery-radius', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [SHOP_LNG, SHOP_LAT]
                    }
                }
            })

            mapRef.current.addLayer({
                id: 'delivery-radius-fill',
                type: 'circle',
                source: 'delivery-radius',
                paint: {
                    'circle-radius': {
                        stops: [
                            [0, 0],
                            [20, metersToPixelsAtMaxZoom(DELIVERY_RADIUS_KM * 1000, SHOP_LAT)]
                        ],
                        base: 2
                    },
                    'circle-color': '#ff4d2d',
                    'circle-opacity': 0.1,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ff4d2d',
                    'circle-stroke-opacity': 0.5
                }
            })

            if (location?.lat && location?.lon) {
                updateMarker(location.lon, location.lat)
            }
        })

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
                markerRef.current = null
            }
        }
    }, [])

    useEffect(() => {
        if (location?.lat && location?.lon && mapRef.current) {
            if (mapRef.current.loaded()) {
                updateMarker(location.lon, location.lat)
            } else {
                mapRef.current.on('load', () => updateMarker(location.lon, location.lat))
            }
        }
    }, [location?.lat, location?.lon, updateMarker])

    useEffect(() => {
        if (address) setAddressInput(address)
    }, [address])

    const handleAddressInput = (e) => {
        const val = e.target.value
        setAddressInput(val)
        setRangeError('')

        if (searchTimeout) clearTimeout(searchTimeout)

        if (val.length < 3) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }

        const timeout = setTimeout(async () => {
            try {
                const proximity = (!isNaN(SHOP_LNG) && !isNaN(SHOP_LAT))
                    ? `&proximity=${SHOP_LNG},${SHOP_LAT}`
                    : ''
                const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${MAPBOX_TOKEN}&language=en&country=IN&types=address,place,locality,neighborhood,poi${proximity}&autocomplete=true`
                const res = await fetch(url)
                const data = await res.json()
                if (data.features) {
                    setSuggestions(data.features)
                    setShowSuggestions(true)
                }
            } catch (err) {
                console.log('Autocomplete error:', err)
            }
        }, 300)

        setSearchTimeout(timeout)
    }

    const handleSelectSuggestion = (feature) => {
        const [lng, lat] = feature.center
        const addr = feature.place_name
        dispatch(setLocation({ lat, lon: lng }))
        dispatch(setAddress(addr))
        setAddressInput(addr)
        setSuggestions([])
        setShowSuggestions(false)
        setRangeError('')
    }

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setRangeError('आपका browser geolocation support नहीं करता।')
            return
        }
        setIsLocating(true)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude
                dispatch(setLocation({ lat, lon: lng }))
                setRangeError('')
                const addr = await mapboxReverseGeocode(lat, lng)
                if (addr) {
                    dispatch(setAddress(addr))
                    setAddressInput(addr)
                }
                setIsLocating(false)
            },
            (err) => {
                console.log(err)
                setRangeError('Location नहीं मिली। कृपया address manually enter करें।')
                setIsLocating(false)
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    }

    const handlePlaceOrder = async () => {
        setRangeError('')

        if (!location?.lat || !location?.lon) {
            setRangeError('कृपया पहले अपनी delivery location set करें।')
            return
        }

        if (!isNaN(SHOP_LAT) && !isNaN(SHOP_LNG)) {
            const distanceKm = haversineDistance(SHOP_LAT, SHOP_LNG, location.lat, location.lon)
            if (distanceKm > DELIVERY_RADIUS_KM) {
                setRangeError(`आपकी location delivery range से बाहर है। Orders केवल shop से ${DELIVERY_RADIUS_KM} km के अंदर place किए जा सकते हैं।`)
                return
            }
        }

        try {
            const result = await axios.post(`${serverUrl}/api/order/place-order`, {
                paymentMethod,
                deliveryAddress: {
                    text: addressInput,
                    latitude: location.lat,
                    longitude: location.lon
                },
                totalAmount: AmountWithDeliveryFee,
                cartItems
            }, { withCredentials: true })

            if (paymentMethod === 'cod') {
                dispatch(addMyOrder(result.data))
                // Order confirm ho gaya — cart clear karo taaki purane items dobara na dikhein
                dispatch(clearCart())
                navigate('/order-placed')
            } else {
                openRazorpayWindow(result.data.orderId, result.data.razorOrder)
            }
        } catch (error) {
            const msg = error?.response?.data?.message
            if (msg) setRangeError(msg)
            console.log(error)
        }
    }

    const openRazorpayWindow = (orderId, razorOrder) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: razorOrder.amount,
            currency: 'INR',
            name: 'Bombay Pizza Club',
            description: 'Food Delivery Website',
            order_id: razorOrder.id,
            config: {
                display: {
                    blocks: {
                        upi: {
                            name: "Pay via UPI",
                            instruments: [
                                { method: "upi" }
                            ]
                        },
                        other: {
                            name: "Other Payment Methods",
                            instruments: [
                                { method: "card" },
                                { method: "netbanking" },
                                { method: "wallet" }
                            ]
                        }
                    },
                    sequence: ["block.upi", "block.other"],
                    preferences: { show_default_blocks: false }
                }
            },
            handler: async (response) => {
                try {
                    const result = await axios.post(`${serverUrl}/api/order/verify-payment`, {
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                        orderId
                    }, { withCredentials: true })
                    dispatch(addMyOrder(result.data))
                    // Online payment verify hone ke baad bhi cart clear karo
                    dispatch(clearCart())
                    navigate('/order-placed')
                } catch (err) {
                    console.log(err)
                }
            }
        }
        new window.Razorpay(options).open()
    }

    return (
        <div className='min-h-screen bg-[#fff9f6] flex items-center justify-center p-6'>
            <div className='absolute top-[20px] left-[20px] z-[10]' onClick={() => navigate('/')}>
                <IoIosArrowRoundBack size={35} className='text-[#ff4d2d]' />
            </div>

            <div className='w-full max-w-[900px] bg-white rounded-2xl shadow-xl p-6 space-y-6'>
                <h1 className='text-2xl font-bold text-gray-800'>Checkout</h1>

                <section>
                    <h2 className='text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800'>
                        <IoLocationSharp className='text-[#ff4d2d]' /> Delivery Location
                    </h2>

                    <div className='relative flex gap-2 mb-3'>
                        <div className='flex-1 relative'>
                            <input
                                type='text'
                                className='w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]'
                                placeholder='अपना delivery address type करें...'
                                value={addressInput}
                                onChange={handleAddressInput}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                autoComplete='off'
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className='absolute z-[9999] top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto'>
                                    {suggestions.map((feature) => (
                                        <li
                                            key={feature.id}
                                            className='px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-0'
                                            onMouseDown={() => handleSelectSuggestion(feature)}
                                        >
                                            <span className='font-medium'>{feature.text}</span>
                                            <span className='text-gray-400 text-xs block truncate'>{feature.place_name}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center disabled:opacity-60'
                            onClick={getCurrentLocation}
                            disabled={isLocating}
                            title='Current Location'
                        >
                            <TbCurrentLocation size={17} />
                        </button>
                    </div>

                    {rangeError && (
                        <div className='mb-3 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm font-medium'>
                            {rangeError}
                        </div>
                    )}

                    <div className='rounded-xl border overflow-hidden'>
                        <div ref={mapContainerRef} className='h-64 w-full' />
                    </div>
                    <p className='text-xs text-gray-400 mt-1'>🍕 = Bombay Pizza Club &nbsp;|&nbsp; Orange circle = {DELIVERY_RADIUS_KM}km delivery range &nbsp;|&nbsp; Map पर pin drag करके भी location adjust कर सकते हैं।</p>
                </section>

                <section>
                    <h2 className='text-lg font-semibold mb-3 text-gray-800'>Payment Method</h2>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div
                            className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition ${paymentMethod === 'cod' ? 'border-[#ff4d2d] bg-orange-50 shadow' : 'border-gray-200 hover:border-gray-300'}`}
                            onClick={() => setPaymentMethod('cod')}
                        >
                            <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
                                <MdDeliveryDining className='text-green-600 text-xl' />
                            </span>
                            <div>
                                <p className='font-medium text-gray-800'>Cash On Delivery</p>
                                <p className='text-xs text-gray-500'>Pay when your food arrives</p>
                            </div>
                        </div>
                        <div
                            className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition ${paymentMethod === 'online' ? 'border-[#ff4d2d] bg-orange-50 shadow' : 'border-gray-200 hover:border-gray-300'}`}
                            onClick={() => setPaymentMethod('online')}
                        >
                            <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-100'>
                                <FaMobileScreenButton className='text-purple-700 text-lg' />
                            </span>
                            <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
                                <FaCreditCard className='text-blue-700 text-lg' />
                            </span>
                            <div>
                                <p className='font-medium text-gray-800'>UPI / Credit / Debit Card</p>
                                <p className='text-xs text-gray-500'>Pay Securely Online</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className='text-lg font-semibold mb-3 text-gray-800'>Order Summary</h2>
                    <div className='rounded-xl border bg-gray-50 p-4 space-y-2'>
                        {cartItems.map((item, index) => (
                            <div key={index} className='flex justify-between text-sm text-gray-700'>
                                <span>{item.name} x {item.quantity}</span>
                                <span>₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                        <hr className='border-gray-200 my-2' />
                        <div className='flex justify-between font-medium text-gray-800'>
                            <span>Subtotal</span>
                            <span>₹{totalAmount}</span>
                        </div>
                        <div className='flex justify-between text-gray-700'>
                            <span>Delivery Fee</span>
                            <span className='text-green-600 font-medium'>Free</span>
                        </div>
                        <div className='flex justify-between text-lg font-bold text-[#ff4d2d] pt-2'>
                            <span>Total</span>
                            <span>₹{AmountWithDeliveryFee}</span>
                        </div>
                    </div>
                </section>

                <button
                    className='w-full bg-[#ff4d2d] hover:bg-[#e64526] text-white py-3 rounded-xl font-semibold disabled:opacity-60'
                    onClick={handlePlaceOrder}
                    disabled={isLocating}
                >
                    {paymentMethod === 'cod' ? 'Place Order' : 'Pay & Place Order'}
                </button>
            </div>
        </div>
    )
}

export default CheckOut