import React, { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import scooterImg from '../assets/scooter.png'
import homeImg from '../assets/home.png'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

function DeliveryBoyTracking({ data }) {
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)
    const deliveryMarkerRef = useRef(null)
    const customerMarkerRef = useRef(null)
    const lineLayerAdded = useRef(false)

    const deliveryLat = data.deliveryBoyLocation.lat
    const deliveryLon = data.deliveryBoyLocation.lon
    const customerLat = data.customerLocation.lat
    const customerLon = data.customerLocation.lon

    // Create custom HTML marker element
    const createMarkerEl = (imgSrc, size = 40) => {
        const el = document.createElement('div')
        el.style.width = `${size}px`
        el.style.height = `${size}px`
        el.style.backgroundImage = `url(${imgSrc})`
        el.style.backgroundSize = 'cover'
        el.style.backgroundRepeat = 'no-repeat'
        el.style.backgroundPosition = 'center'
        el.style.borderRadius = '50%'
        el.style.border = '2px solid white'
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
        return el
    }

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || !deliveryLat || !deliveryLon) return

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [deliveryLon, deliveryLat],
            zoom: 15,
        })

        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

        mapRef.current.on('load', () => {
            // Delivery boy marker
            deliveryMarkerRef.current = new mapboxgl.Marker({ element: createMarkerEl(scooterImg) })
                .setLngLat([deliveryLon, deliveryLat])
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Delivery Boy'))
                .addTo(mapRef.current)

            // Customer marker
            if (customerLat && customerLon) {
                customerMarkerRef.current = new mapboxgl.Marker({ element: createMarkerEl(homeImg) })
                    .setLngLat([customerLon, customerLat])
                    .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Your Location'))
                    .addTo(mapRef.current)
            }

            // Draw route line between delivery boy and customer
            if (customerLat && customerLon) {
                mapRef.current.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [deliveryLon, deliveryLat],
                                [customerLon, customerLat]
                            ]
                        }
                    }
                })

                mapRef.current.addLayer({
                    id: 'route',
                    type: 'line',
                    source: 'route',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#ff4d2d', 'line-width': 3, 'line-dasharray': [2, 2] }
                })

                lineLayerAdded.current = true

                // Fit map to show both markers
                const bounds = new mapboxgl.LngLatBounds()
                bounds.extend([deliveryLon, deliveryLat])
                bounds.extend([customerLon, customerLat])
                mapRef.current.fitBounds(bounds, { padding: 60 })
            }
        })

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
                deliveryMarkerRef.current = null
                customerMarkerRef.current = null
                lineLayerAdded.current = false
            }
        }
    }, [])

    // Update delivery boy marker position when live location changes
    useEffect(() => {
        if (!mapRef.current || !deliveryMarkerRef.current || !deliveryLat || !deliveryLon) return

        deliveryMarkerRef.current.setLngLat([deliveryLon, deliveryLat])

        // Update route line
        if (lineLayerAdded.current && mapRef.current.getSource('route') && customerLat && customerLon) {
            mapRef.current.getSource('route').setData({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [deliveryLon, deliveryLat],
                        [customerLon, customerLat]
                    ]
                }
            })
        }
    }, [deliveryLat, deliveryLon])

    if (!deliveryLat || !deliveryLon) {
        return (
            <div className='w-full h-[400px] mt-3 rounded-xl flex items-center justify-center bg-gray-100'>
                <p className='text-gray-500 text-sm'>Delivery boy location unavailable</p>
            </div>
        )
    }

    return (
        <div className='w-full h-[400px] mt-3 rounded-xl overflow-hidden shadow-md'>
            <div ref={mapContainerRef} className='w-full h-full' />
        </div>
    )
}

export default DeliveryBoyTracking