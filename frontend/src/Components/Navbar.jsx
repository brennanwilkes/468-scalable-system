import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from "react-icons/fa";
import './Navbar.css';

function Navbar() {
  const [click, setClick] = useState(false);

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  return (
    <>
      <nav className='navbar'>
        <div className='navbar-container'>
          <Link to='/' className='navbar-logo' onClick={closeMobileMenu}>
            Day Trading System
          </Link>
          <div className='menu-icon' onClick={handleClick}>
            {click ? (<FaTimes style={{ color: 'white' }} />) : (<FaBars style={{ color: 'white' }} />)}
          </div>
          <ul className={click ? 'nav-menu active' : 'nav-menu'}>
            <li className='nav-item'>
              <Link to='/' className='nav-links' onClick={closeMobileMenu}>
                All Stocks
              </Link>
            </li>
            <li className='nav-item'>
              <Link to='/MyStocks' className='nav-links'
                onClick={closeMobileMenu}
              >
                My Stocks
              </Link>
            </li>
            <li className='nav-item'>
              <Link
                to='/History'
                className='nav-links'
                onClick={closeMobileMenu}
              >
                History
              </Link>
            </li>

            <li>
            </li>
          </ul>

        </div>
      </nav>
    </>
  );
}

export default Navbar;