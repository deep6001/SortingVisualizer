import React from 'react'
import logo from '../assets/logo.png'
import { Link } from 'react-router-dom'


function Navbar() {
  return (
    <>
    <div className='h-16 flex items-center gap-4 p-2  gradint-green overflow-hidden justify-between '>
      <Link to='/'>
          <div className='flex items-center gap-2 mr-4'>
            <img src={logo} alt="logo" className='w-14 mix-blend-screen' />
            <h3 className='text-xl italic  sm:text-2xl' >Sorting Visulizer</h3>
          </div>
      </Link>
    </div>

    
    </>
  )
}

export default Navbar
