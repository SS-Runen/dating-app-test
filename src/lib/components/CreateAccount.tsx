"use client";

import { useEffect, useRef, useState } from "react";
import { signInWithGoogle, signInWithMobileNumber } from "../firebase/client";
import { calculateAge, validatePhoneNumber } from "../utils/utils";
import OTPForm from "./OTPForm";

export default function CreateAccount(props: any) {
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewProfilePicture, setPreviewProfilePicture] = useState<string | null>(null);
    const [birthdate, setBirthdate] = useState(new Date().toISOString().split("T")[0]);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [displayMobileNumber, setDisplayMobileNumber] = useState(false);
    const [displayOTP, setDisplayOTP] = useState(false);
    const [displayCreateAccount, setDisplayCreateAccount] = useState(false);
    const [otp, setOTP] = useState("");
    const [aboutMe, setAboutMe] = useState("");
    const confirmation = useRef<any>(null);
    const [userCredentials, setUserCredentials] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [gender, setGender] = useState("male");
    const [showMe, setShowMe] = useState("everyone");

    useEffect(() => {
        return () => {
            if (previewProfilePicture) {
                URL.revokeObjectURL(previewProfilePicture);
            }
        };
    }, [previewProfilePicture]);

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
    <div className="create-account-form">
        <h2 style={{ color: "#fff" }}>Create account</h2>
        {displayMobileNumber && (
            // Modal number form
        <div className="modal-number-form">
            <div className="modal-number-form-content" style={{ height: "auto" }}>
        <form>
            <div className="form-group">
            <label htmlFor="phone">Phone number</label>
            <input type="text" style={{ borderColor: phone.length && !validatePhoneNumber(phone) ? "red" : "" }} className="form-control" id="phone" placeholder="+63" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="button" style={{ width: "100%"}} onClick={() => {
                setLoading(true);
                signInWithMobileNumber(phone).then((confirm) => {
                    setLoading(false);
                    confirmation.current = confirm;
                    setDisplayMobileNumber(false);
                    setDisplayOTP(true);
                }).catch((error) => {
                    setLoading(false);
                    console.error(error);
                    alert("Failed to sign in with phone number.");
                });
            }} disabled={!validatePhoneNumber(phone) || loading}>{loading ? "Sending OTP..." : "Next"}</button>
        </form>
        </div>
        </div>)
        }
        <div id="recaptcha-container" style={{ display: "none" }}></div>
        {displayOTP && <OTPForm otp={otp} handleOTPChange={handleOTPChange} handleOTPKeyUp={handleOTPKeyUp} loading={loading} onVerify={() => {
            setLoading(true);
            confirmation.current.confirm(otp).then(async (result: any) => {
               setLoading(false);
               setUserCredentials(result);
               setDisplayOTP(false);
               // Check if user already exists
               const response = await fetch(`/api/get-user?userId=${result.user.uid}`, {
                   method: "GET",
               })
               if (!response.ok) {
                   setDisplayCreateAccount(true);
                   return;
               }
               const data = await response.json();
               localStorage.setItem("authUser", JSON.stringify(data));
               window.location.href = "/explore";
           }).catch((error: any) => {
               console.error(error);
               setLoading(false);
               alert("Failed to verify OTP");
           });
        }} />}
        {
            displayCreateAccount && (
                // Modal create account form
                <div className="modal-number-form">
                    <div className="modal-number-form-content">
                        <form>
                            <div className="form-group" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            {previewProfilePicture && 
                                    <img
                                    id="profile-preview" 
                                    src={previewProfilePicture}
                                    alt="Profile Picture" 
                                    style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "50%" }} 
                                    />
                            }
                                <label htmlFor="profile-picture">Profile picture</label>
                                <input type="file" className="form-control" id="profile-picture" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        // Allow only 5mb max
                                        if (file.size > 5 * 1024 * 1024) {
                                            alert("File size must be less than 5MB");
                                            return;
                                        }
                                        setProfilePicture(file);
                                        setPreviewProfilePicture(URL.createObjectURL(file));
                                    }
                                }} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="name">Full name</label>
                                <input type="text" className="form-control" id="name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="gender">Gender</label>
                                <select className="form-control" id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="showMe">Show me</label>
                                <select className="form-control" id="showMe" value={showMe} onChange={(e) => setShowMe(e.target.value)}>
                                    <option value="men">Men</option>
                                    <option value="women">Women</option>
                                    <option value="everyone">Everyone</option>
                                </select>
                            </div>
                            {/* Birthdate */}
                            <div className="form-group">
                                <label htmlFor="birthdate">Birthdate</label>
                                <input type="date" className="form-control" id="birthdate" value={birthdate} max={new Date().toISOString().split("T")[0]} onChange={(e) => {
                                    // Validate if 18 years old
                                    const age = calculateAge(e.target.value);
                                    if (age < 18) {
                                        alert("You must be at least 18 years old");
                                        return;
                                    }
                                    setBirthdate(e.target.value);
                                }} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="about-me">About me</label>
                                <textarea className="form-control" id="about-me" placeholder="About me" value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} />
                            </div>
                            <button 
                            disabled={!name || !gender || !showMe || !birthdate || !aboutMe || !profilePicture || loading}
                            className="btn btn-primary" 
                            type="button" 
                            style={{ width: "100%"}} 
                            onClick={() => {
                                const formData = new FormData();
                                formData.append("name", name);
                                formData.append("gender", gender);
                                formData.append("aboutMe", aboutMe);
                                formData.append("birthdate", birthdate);
                                formData.append("showMe", showMe);
                                if (profilePicture) {
                                    const blob = new Blob([profilePicture], { type: profilePicture.type });
                                    formData.append("profilePicture", blob, profilePicture.name);
                                }
                                formData.append("uid", userCredentials.user.uid);
                                setLoading(true);
                                fetch("/api/register", {
                                    method: "POST",
                                    body: formData
                                }).then(async (res) => {
                                    if (!res.ok) {
                                        setLoading(false);
                                        throw new Error(res.statusText);
                                    }
                                    const data = await res.json();
                                    localStorage.setItem("authUser", JSON.stringify(data.user));
                                    setLoading(false);
                                    setDisplayCreateAccount(false);
                                    window.location.href = "/explore";
                                    return;
                                }).catch((error) => {
                                    setLoading(false);
                                    console.error(error);
                                    alert("Failed to create account");
                                });
                            }}>
                                {loading ? "Creating account..." : "Create account"}
                            </button>
                        </form>
                    </div>
                </div>
            )
        }
        <button className="btn btn-primary" type="button" style={{ width: "100%"}} onClick={() => setDisplayMobileNumber(true)}>Continue with phone number</button>
        <button className="btn btn-outline-primary" type="button" style={{ width: "100%", backgroundColor: "#fff" }} onClick={() => {
            signInWithGoogle().then(async (result) => {
                setUserCredentials(result);
                 // Check if user already exists
                const response = await fetch(`/api/get-user?userId=${result.user.uid}`, {
                    method: "GET",
                })
                if (response.status === 404) {
                    setDisplayCreateAccount(true);
                    return;
                }
                const data = await response.json();
                localStorage.setItem("authUser", JSON.stringify(data));
                window.location.href = "/explore";
            }).catch((error) => {
                console.error(error);
                alert("Failed to sign in with Google");
            });
        }}>Continue with Google</button>
        <p style={{ color: "#fff" }}>By continuing, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a></p>
        <span style={{ color: "#fff" }}>Already have an account?<button type="button" className="btn btn-link" style={{ margin: 0 }} onClick={props.handleShowLogin}>Login</button></span>
      </div>
    )
}