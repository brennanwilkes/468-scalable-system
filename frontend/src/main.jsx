import React from 'react'
import ReactDOM from 'react-dom/client'
import { Routes, Route, BrowserRouter } from "react-router-dom"
import Home from './Pages/Home'
import User from './Pages/User'
import History from './Pages/History'

const Router = () => (
	<Routes>
		<Route path={"/"} index element={<Home />} />
		<Route path={"/MyStocks"} index element={<User />} />
		<Route path={"/History"} index element={<History />} /> 

	</Routes>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Router />
  </BrowserRouter>,
)
