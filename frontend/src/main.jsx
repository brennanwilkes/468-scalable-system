import React from 'react'
import ReactDOM from 'react-dom/client'
import { Routes, Route, BrowserRouter } from "react-router-dom"
import Home from './Home'
import './index.css'

const Router = () => (
	<Routes>
		<Route path={"/"} index element={<Home />} />
		{/* <Route path={myRoutes.LogIn} index element={<LoginPage />} />
		<Route path={myRoutes.SignUp} index element={<SignUpPage />} /> */}

	</Routes>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Router />
  </BrowserRouter>,
)
