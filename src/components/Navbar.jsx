import React from 'react'
import logo from '../assets/logo.png'
import { Link } from 'react-router-dom'


function Navbar() {
  return (
    <>
    <div className='h-16 flex items-center z-10 gap-4 p-2  w-full bg-[#3ABEF9] overflow-hidden justify-between '>
      <Link to='/'>
          <div className='flex items-center gap-2 mr-4'>
            <img src={logo} alt="logo" className='w-14 mix-blend-screen' />
            <h3 className='text-xl italic  sm:text-2xl font-bold text-white ' >Algo <span className='text-[#dc3434]'>Animate</span></h3>
          </div>
      </Link>
    </div>

    
    </>
  )
}

export default Navbar
