import React from 'react'
import { useSelector } from 'react-redux'
import UserDashboard from '../components/UserDashboard'
import OwnerDashboard from '../components/OwnerDashboard'
import DeliveryBoy from '../components/DeliveryBoy'
import Footer from '../components/Footer'

function Home() {
    const { userData } = useSelector(state => state.user)

    // Guest (not logged in) or normal "user" role → show product listing
    const showUserDashboard = !userData || userData.role === "user"

    return (
        <div className='w-full min-h-screen pt-[100px] flex flex-col bg-[#fff9f6] overflow-x-hidden'>
            <div className='flex-1 flex flex-col items-center'>
                {showUserDashboard && <UserDashboard />}
                {userData?.role === "owner" && <OwnerDashboard />}
                {userData?.role === "deliveryBoy" && <DeliveryBoy />}
            </div>
            {/* Footer guest aur normal user dono ko dikhega - owner/delivery boy ko nahi */}
            {showUserDashboard && <Footer />}
        </div>
    )
}

export default Home