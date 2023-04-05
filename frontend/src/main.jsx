import React from 'react'
import ReactDOM from 'react-dom/client'
import { Routes, Route, BrowserRouter } from "react-router-dom"
import { Provider } from 'react-redux'
import {store} from './redux/store'
import Home from './Pages/Home'
import MyStocks from './Pages/MyStocks'
import History from './Pages/History'
import Buy from './Pages/Buy'
import Sell from './Pages/Sell'
import Login from './Pages/Login'
const Router = () => (
	<Routes>
		<Route path={"/"} index element={<Home />} />
		<Route path={"/MyStocks"} index element={<MyStocks />} />
		<Route path={"/History"} index element={<History />} /> 
		<Route path={"/Buy"} index element={<Buy />} /> 
		<Route path={"/Sell"} index element={<Sell />} /> 
		<Route path={"/Login"} index element={<Login />} /> 

	</Routes>
)

ReactDOM.createRoot(document.getElementById('root')).render(
	<Provider store={store}>
  <BrowserRouter>
    <Router />
  </BrowserRouter>
  </Provider>
)
