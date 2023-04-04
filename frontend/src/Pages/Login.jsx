import * as React from "react";
import { useState } from "react";
import "./Login.css";
import TextField from "@mui/material/TextField";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
// import API from "../api";


const App = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const navigateHome = () => {
      navigate('/');
    }
    // const onSubmit = async (e) => {
    //     //console.log(email + " " + password)
    //     let result = await logIn(email, password)
    // }
    // const logIn = async (email, password) => {
    //     try {
    //         let result = await API.get(
    //             "api/login?username=" + email + "&password=" + password
    //         );
    //         if (result.status === 500)
    //             alert("Incorrect password")
    //         else{
    //             localStorage.setItem('username', email);
    //             navigate(myRoutes.JobsListed)
    //         }
    //     } catch (err) {
    //         console.error(err);
    //     }
    // };
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
    return (
        <div className="sign-in">
            <div className="rectangle-3">
                <span className="sign-in-1">Sign in</span>
                <TextField  variant="standard"
                    className="group-15-instance"
                    {...propsData.group15}
                    placeholder="Username"
                    
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                <button onClick={navigateHome} className="login-btn login-btn--medium login-btn--outline" id="sigin-button" size="medium">Sign In</button>         
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
            </div>

        </div >
    );
};
export default App;