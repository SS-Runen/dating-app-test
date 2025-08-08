import { useRef, useState } from "react";
import { signInWithGoogle, signInWithMobileNumber } from "../firebase/client";
import OTPForm from "./OTPForm";
import { validatePhoneNumber } from "../utils/utils";

export default function Login(props: any) {
    const [phone, setPhone] = useState("");
    const [displayOTP, setDisplayOTP] = useState(false);
    const [otp, setOTP] = useState("");
    const [loading, setLoading] = useState(false);
    const [displayCreateAccount, setDisplayCreateAccount] = useState(false);
    const confirmation = useRef<any>(null);

    const handleLogin = () => {
        setLoading(true);
        signInWithMobileNumber(phone).then((result: any) => {
            confirmation.current = result;
            setDisplayOTP(true);
            setLoading(false);
        }).catch((error: any) => {
            console.error(error);
            setLoading(false);
            alert("Failed to sign in with phone number.");
        });
    }

    const handleOTPChange = (event: any) => {
        const parsedValue = parseInt(event.target.value);
        if (isNaN(parsedValue)) {
            event.target.value = "";
            return;
        }

        // Valid value proceed to next input
        if (parsedValue) {
            setOTP(otp + parsedValue.toString());
            const nextInput = event.target.nextElementSibling;
            if (nextInput) {
                (nextInput as HTMLInputElement)?.focus();
            }
        }
    }
    
    const handleOTPKeyUp = (event: any) => {
        const target = event.target;
        const key = event.key?.toLowerCase();
        if (key === "backspace" || key === "delete") {
            target.value = "";
            setOTP(otp.slice(0, -1));
            const previousInput = target.previousElementSibling;
            if (previousInput) {
                (previousInput as HTMLInputElement)?.focus();
            }
        }
    }

    return (
        <div className="login-form">
            <h2 style={{ color: "#fff" }}>Welcome back!</h2>
            <span style={{ color: "#fff" }}>Sign in to continue</span>
            <form>
                <div className="form-group">
                    <label htmlFor="phone" style={{ color: "#fff" }}>Phone number</label>
                    <input type="text" style={{ borderColor: phone.length && !validatePhoneNumber(phone) ? "red" : "" }} className="form-control" id="phone" placeholder="+63" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
            </form>
            {displayOTP && <OTPForm otp={otp} handleOTPChange={handleOTPChange} handleOTPKeyUp={handleOTPKeyUp} loading={loading} onVerify={() => {
                setLoading(true);
                confirmation.current.confirm(otp).then(async (result: any) => {
                   setLoading(false);
                   setDisplayOTP(false);
                   // Check if user exists
                   const response = await fetch(`/api/get-user?userId=${result.user.uid}`, {
                       method: "GET",
                   })
                   if (response.status === 404) {
                       // User does not exist, show create account
                       setDisplayCreateAccount(true);
                       setLoading(false);
                       return;
                   }
                   const data = await response.json();
                   localStorage.setItem("authUser", JSON.stringify(data));
                   window.location.href = "/explore";
               }).catch((error: any) => {
                   console.error(error);
                   setLoading(false);
                   alert("Failed to verify OTP.");
               });
            }} />}
        <div id="recaptcha-container" style={{ display: "none" }}></div>
        {displayCreateAccount && (
            <div className="modal-number-form">
            <div className="modal-number-form-content" style={{ height: "auto", width: "50%" }}>
                <h3>No account found</h3>
                <p>Please create an account to continue</p>
                <button className="btn btn-primary" type="button" style={{ width: "100%"}} onClick={() => {
                    setDisplayCreateAccount(false);
                    props.handleShowCreateAccount();
                }}>Create account</button>
            </div>
            </div>
        )}
            <button className="btn btn-primary" type="button" style={{ width: "100%"}} onClick={handleLogin} disabled={!validatePhoneNumber(phone) || loading}>{loading ? "Logging in..." : "Login"}</button>
            {/* Or login with Google */}
            <div className="or-divider">
                <span>Or</span>
            </div>
            <button className="btn btn-outline-primary" type="button" style={{ width: "100%", backgroundColor: "#fff"}} onClick={() => {
                setLoading(true);
                signInWithGoogle().then(async(result) => {
                    const response = await fetch(`/api/get-user?userId=${result.user.uid}`, {
                        method: "GET",
                    })
                    if (response.status === 404) {
                        // User does not exist, show create account
                        setDisplayCreateAccount(true);
                        setLoading(false);
                        return;
                    }
                    const data = await response.json();
                    localStorage.setItem("authUser", JSON.stringify(data));
                    window.location.href = "/explore";
                }).catch((error) => {
                    console.error(error);
                    alert("Failed to sign in with Google");
                    setLoading(false);
                })
            }} disabled={loading}>{loading ? "Logging in..." : "Login with Google"}</button>
            <p>By logging in, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a></p>
            <span>Don't have an account? <button type="button" className="btn btn-link" style={{ margin: 0 }} onClick={props.handleShowCreateAccount}>Create an account</button></span>
        </div>
    )
}