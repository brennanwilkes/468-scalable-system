import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from "react-icons/fa";
import { Button } from './Button';
import './Navbar.css';
import { store } from '../redux/store';
import { logOut } from '../redux/slices/userSlice';

function Navbar() {
  const [click, setClick] = useState(false);
  const [button, setButton] = useState(true);

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  const showButton = () => {
    if (window.innerWidth <= 960) {
      setButton(false);
    } else {
      setButton(true);
    }
  };

  const signOut = () => {
    store.dispatch(logOut)
    window.location.href = "/Login"
  }

  useEffect(() => {
    showButton();
  }, []);

  window.addEventListener('resize', showButton);


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
          </ul>
          {button && <Button buttonStyle='btn--outline' onClick={signOut}>SIGN OUT</Button>}

        </div>
      </nav>
    </>
  );
}

export default Navbar;