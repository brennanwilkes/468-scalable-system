import * as React from "react";
import { useState, useEffect } from "react";
import "./Login.css";
import TextField from "@mui/material/TextField";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useLoginMutation, useCreateAccountMutation, useAddMutation, useGetDisplaySummaryQuery } from "../rtkQuery/api";
import { store } from "../redux/store";
import { setUserName, setLoggedIn, setAmount, setAllOwnedStocks } from "../redux/slices/userSlice";
// import API from "../api";

const propsData = {
    group15: {
        fullWidth: true,
        label: "Username",
    },
    rectangle10: {
        fullWidth: true,
        label: "Password",
    },
};

const App = () => {
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const [postLogin, loginResult] = useLoginMutation()
    const [postAccount, creationResult] = useCreateAccountMutation()
    const [postAdd, addResult] = useAddMutation()
    const [summaryUsername, setSummaryUsername] = useState("")
    const {data: summaryData, error: summaryError, isLoading: summaryIsLoading} = useGetDisplaySummaryQuery(summaryUsername);

    const login = () => {
        if(username == "" || password == "") {
            setError("Please fill in all fields")
            return;
        }
        postLogin({userId: username, password});
        
    }

    const setLoginState = (amount, stocksOwned) => {
        store.dispatch(setUserName(username));
        store.dispatch(setLoggedIn(true));
        store.dispatch(setAmount(amount));
        store.dispatch(setAllOwnedStocks(stocksOwned));
        navigate('/');
    }

    useEffect(() => {
        if(loginResult.status === 'rejected') {
            postAccount({userId: username, password});
        } else if (loginResult.status === 'fulfilled') {
            setSummaryUsername(username);
        }
    }, [loginResult])

    useEffect(() => {
        if(creationResult.status === 'rejected'){
            setError("Username or password is incorrect")
        } else if (creationResult.status === 'fulfilled') {
            postAdd({userId: username, amount: 10000})
        }
    }, [creationResult])

    useEffect(() => {
        if(addResult.status === 'rejected'){
            setError("Error adding money to account. Please login with a different account")
        } else if (addResult.status === 'fulfilled') {
            setLoginState(10000, []);
        }
    }, [addResult])

    useEffect(() => {
        if(summaryData) {
            setLoginState(summaryData.data.funds, summaryData.data.stocksOwned);
        }
    }, [summaryData])


    return (
        <div className="sign-in">
            <div className="rectangle-3">
                <span className="sign-in-1">Sign in</span>
                <TextField  variant="standard"
                    className="group-15-instance"
                    {...propsData.group15}
                    placeholder="Username"
                    
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    sx={{
                        "width": "55%",
                        "color": "#ffffff",
                        'justifyContent': 'center',
                        "margin": "7px 0px 1.1rem",
                        "& .MuiInput-root": {
                          "borderBottom": "1px solid #ffffff !important"
                        },
 

                    }}
                />
                <TextField variant="standard"
                    className="group-15-instance"
                    {...propsData.rectangle10}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    sx={{
                        'width': '55%',
                        'margin': '0px 0px 0.7rem',
                        'justifyContent': 'center',
                        "& .MuiInputBase-root": {
                            "borderRadius": "50px",
                            "height": "90%"
                        }
                    }}
                />
                <button onClick={login} className="login-btn login-btn--medium login-btn--outline" id="sigin-button" size="medium">Sign In</button>         
                {/* <Button variant="contained" onClick={(e) => onSubmit(e)} className="button" id="sigin-button" size="medium" sx={{
                    'borderRadius': '50px',
                    'backgroundColor': '#397598',
                    'color': '#d7ecf5',
                    'borderColor': '#397598',
                    ":hover": {
                        bgcolor: "#578DAD",
                        color: "#d7ecf5"
                    }
                }}>Sign In</Button> */}
                {
                    error !== "" && <div className="error" style={{color: 'red'}}>{error}</div>
                }
            </div>

        </div >
    );
};
export default App;