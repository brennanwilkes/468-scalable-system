import React from 'react'
import ReactDOM from 'react-dom/client'
import { Routes, Route, BrowserRouter } from "react-router-dom"
import Home from './Home'
import User from './User'
import History from './History'
import './index.css'

const Router = () => (
	<Routes>
		<Route path={"/"} index element={<Home />} />
		<Route path={"/User"} index element={<User />} />
		<Route path={"/History"} index element={<History />} /> 

	</Routes>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Router />
  </BrowserRouter>,
)
