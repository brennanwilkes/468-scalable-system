import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import {FaHistory, FaUserAlt, FaChartLine} from "react-icons/fa";
import "./Navbar.css";
import { NavLink } from "react-router-dom";

function App() {
  const [windowDimension, setWindowDimension] = useState(null);

  useEffect(() => {
    setWindowDimension(window.innerWidth);
  }, []);

  useEffect(() => {
    function handleResize() {
      setWindowDimension(window.innerWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowDimension <= 640;

  return (
    <Styles.Wrapper>
      <CSSReset />

      {isMobile ? (
        <nav className = "mobile-nav">
          <ul className = "mobile-items">
            <li className="mobile-item">
              <NavLink to="/" className={({ isActive }) => (isActive ? "link-active" : "link")} >
              <span className="icon">
                <FaChartLine size={18}/>
              </span>
              </NavLink>
            </li>
            <li className="mobile-item">
            <NavLink to="/User" className={({ isActive }) => (isActive ? "link-active" : "link")} >
              <span className="icon">
              <FaUserAlt size={16}/>
              </span>
              </NavLink>
            </li>
            <li className="mobile-item">
            <NavLink to="/History" className={({ isActive }) => (isActive ? "link-active" : "link")} >
              <span className="icon">
              <FaHistory size={16}/>                
              </span>
            </NavLink>
            </li>
          </ul>

        </nav>
  
      ) : (
        <Navbar.Wrapper>
        <Navbar.Logo>Logo</Navbar.Logo>
        <Navbar.Items>
          <Navbar.Item>Home</Navbar.Item>
          <Navbar.Item>Blog</Navbar.Item>
          <Navbar.Item>About</Navbar.Item>
        </Navbar.Items>
      </Navbar.Wrapper>
      )}
    </Styles.Wrapper>
  );
}


const Styles = {
  Wrapper: styled.main`
    display: flex;
    background-color: #eeeeee;
    height: 100vh;
  `
};

const Navbar = {
  Wrapper: styled.nav`
    flex: 1;

    align-self: flex-start;

    padding: 1rem 3rem;

    display: flex;
    justify-content: space-between;
    align-items: center;

    background-color: white;
  `,
  Logo: styled.h1`
    border: 1px solid gray;
    padding: 0.5rem 1rem;
  `,
  Items: styled.ul`
    display: flex;
    list-style: none;
  `,
  Item: styled.li`
    padding: 0 1rem;
    cursor: pointer;
  `
};

const CSSReset = createGlobalStyle`
  *,
  *::before, 
  *::after {
    margin: 0; 
    padding: 0;
    box-sizing: inherit;
  }

  html {
    font-size: 62.5%; /*1rem = 10px*/
    box-sizing: border-box;      
  }  

  body {
    font-size: 1.4rem;
    font-family: sans-serif;
  }
`;

export default App;