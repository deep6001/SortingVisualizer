// src/App.js
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AllSorting2 from './components/AllSorting2';
import {Outlet, Route,Routes} from 'react-router-dom'
import AllSearching from './components/AllSearching';

const App = () => {
  
  return (
    <>
    <Navbar/>
    <Outlet/>
    <Routes>
        <Route path="/" element={<AllSorting2 />} />
        <Route path="/search" element={<AllSearching/>} />
    </Routes>

    </>
  );
};

export default App;
