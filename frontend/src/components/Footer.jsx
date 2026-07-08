import React from 'react'
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa'
import { FaLocationDot, FaPhone } from 'react-icons/fa6'
import { MdEmail } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'

function Footer() {
    const navigate = useNavigate()
    const currentYear = new Date().getFullYear()

    return (
        <footer className='w-full bg-[#1a1a1a] text-gray-300 mt-auto'>

            {/* Main Footer */}
            <div className='max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10'>

                {/* Brand Section */}
                <div className='flex flex-col gap-4 sm:col-span-2 lg:col-span-1'>
                    <h2 className='text-2xl font-extrabold text-[#ff4d2d] tracking-tight'>🍕 Bombay Pizza Club</h2>
                    <p className='text-sm text-gray-400 leading-relaxed'>
                        Lucknow's most loved pizza destination. Fresh ingredients, authentic flavors, and delivered hot to your doorstep.
                    </p>
                    {/* Social Links */}
                    <div className='flex gap-3 mt-2'>
                        <a href='https://instagram.com' target='_blank' rel='noreferrer'
                            className='w-9 h-9 rounded-full bg-[#ff4d2d]/10 flex items-center justify-center text-[#ff4d2d] hover:bg-[#ff4d2d] hover:text-white transition-all duration-200'>
                            <FaInstagram size={16} />
                        </a>
                        <a href='https://facebook.com' target='_blank' rel='noreferrer'
                            className='w-9 h-9 rounded-full bg-[#ff4d2d]/10 flex items-center justify-center text-[#ff4d2d] hover:bg-[#ff4d2d] hover:text-white transition-all duration-200'>
                            <FaFacebookF size={16} />
                        </a>
                        <a href='https://twitter.com' target='_blank' rel='noreferrer'
                            className='w-9 h-9 rounded-full bg-[#ff4d2d]/10 flex items-center justify-center text-[#ff4d2d] hover:bg-[#ff4d2d] hover:text-white transition-all duration-200'>
                            <FaTwitter size={16} />
                        </a>
                        <a href='https://youtube.com' target='_blank' rel='noreferrer'
                            className='w-9 h-9 rounded-full bg-[#ff4d2d]/10 flex items-center justify-center text-[#ff4d2d] hover:bg-[#ff4d2d] hover:text-white transition-all duration-200'>
                            <FaYoutube size={16} />
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div className='flex flex-col gap-3'>
                    <h3 className='text-white font-bold text-base mb-1 uppercase tracking-wider'>Quick Links</h3>
                    <span onClick={() => navigate('/')}
                        className='text-sm text-gray-400 hover:text-[#ff4d2d] cursor-pointer transition duration-200 w-fit'>
                        Home
                    </span>
                    <span onClick={() => navigate('/my-orders')}
                        className='text-sm text-gray-400 hover:text-[#ff4d2d] cursor-pointer transition duration-200 w-fit'>
                        My Orders
                    </span>
                    <span onClick={() => navigate('/cart')}
                        className='text-sm text-gray-400 hover:text-[#ff4d2d] cursor-pointer transition duration-200 w-fit'>
                        Cart
                    </span>
                    <span onClick={() => navigate('/signin')}
                        className='text-sm text-gray-400 hover:text-[#ff4d2d] cursor-pointer transition duration-200 w-fit'>
                        Sign In
                    </span>
                    <span onClick={() => navigate('/signup')}
                        className='text-sm text-gray-400 hover:text-[#ff4d2d] cursor-pointer transition duration-200 w-fit'>
                        Sign Up
                    </span>
                </div>

                {/* About Us */}
                <div className='flex flex-col gap-3'>
                    <h3 className='text-white font-bold text-base mb-1 uppercase tracking-wider'>About Us</h3>
                    <p className='text-sm text-gray-400 leading-relaxed'>
                        Bombay Pizza Club was founded with one mission — to bring the bold flavors of Mumbai-style pizza to the streets of Lucknow.
                    </p>
                    <p className='text-sm text-gray-400 leading-relaxed'>
                        We use freshly sourced ingredients and hand-tossed dough to craft every pizza with love.
                    </p>
                </div>

                {/* Contact Info */}
                <div className='flex flex-col gap-4'>
                    <h3 className='text-white font-bold text-base mb-1 uppercase tracking-wider'>Contact Us</h3>

                    <div className='flex items-start gap-3'>
                        <FaLocationDot size={16} className='text-[#ff4d2d] mt-1 shrink-0' />
                        <p className='text-sm text-gray-400'>
                            Mahaveer Complex Nigohan,<br />
                            Lucknow, Uttar Pradesh - 226302
                        </p>
                    </div>

                    <div className='flex items-center gap-3'>
                        <FaPhone size={14} className='text-[#ff4d2d] shrink-0' />
                        <a href='tel:+8081263936'
                            className='text-sm text-gray-400 hover:text-[#ff4d2d] transition duration-200'>
                            +91 8081263936
                        </a>
                    </div>

                    <div className='flex items-center gap-3'>
                        <MdEmail size={16} className='text-[#ff4d2d] shrink-0' />
                        <a href='mailto:bombaypizza06@gmail.com'
                            className='text-sm text-gray-400 hover:text-[#ff4d2d] transition duration-200'>
                            bombaypizza06@gmail.com
                        </a>
                    </div>

                    {/* Timings */}
                    <div className='mt-1'>
                        <p className='text-white text-sm font-semibold mb-1'>Opening Hours</p>
                        <p className='text-sm text-gray-400'>Mon – Sun: 10:00 AM – 10:00 PM</p>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className='border-t border-gray-700/50'>
                <div className='max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2'>
                    <p className='text-xs text-gray-500 text-center'>
                        © {currentYear} Bombay Pizza Club. All rights reserved.
                    </p>
                    <p className='text-xs text-gray-500 text-center'>
                        Made with ❤️ in Lucknow
                    </p>
                </div>
            </div>

        </footer>
    )
}

export default Footer