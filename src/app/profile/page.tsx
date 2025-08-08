"use client";

import Navbar from "@/lib/components/Navbar";
import { useEffect, useState } from "react";
import AuthGuard from "../../lib/components/AuthGuard";
import { useAppContext } from "@/lib/context/useAppContext";
import Swal from "sweetalert2";
import { calculateAge } from "../../lib/utils/utils";

export default function Profile() {
    const [user, setUser] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const { user: authUser } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({
        name: "",
        aboutMe: "",
        profilePictureFile: null,
        previewProfilePicture: null,
        birthdate: "",
        gender: "",
    });
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("authUser");
        window.location.href = "/";
    }

    const onSubmit = async () => {
        setIsEditing(false);

        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("aboutMe", formData.aboutMe);
        formDataToSend.append("birthdate", formData.birthdate);
        formDataToSend.append("profilePicture", formData.profilePictureFile);
        formDataToSend.append("userId", authUser.id);
        Swal.showLoading();

        try {
            const response = await fetch("/api/update-profile", {
                method: "POST",
                body: formDataToSend,
            });
            Swal.close();
            if (!response.ok) {
               throw new Error("Failed to update profile");
            }
            Swal.fire({
                title: "Success",
                text: "Profile updated successfully",
                icon: "success",
            }).then(() => {
                 // Refresh the page
                window.location.reload();
            });
        } catch (error) {
            console.error(error);
            setIsEditing(false);
            Swal.fire({
                title: "Error",
                text: "Failed to update profile",
                icon: "error",
            });
        }
    }

    useEffect(() => {
       const fetchUser = async () => {
        if (!authUser) return;
        setLoading(true);
        const user = await fetch(`/api/get-user?userId=${authUser.id}`);
        const userData = await user.json();
        console.log(userData);
        setUser(userData);
        setFormData({
            name: userData.name,
            aboutMe: userData.aboutMe,
            birthdate: userData.birthdate?.seconds ? new Date(userData.birthdate.seconds * 1000).toISOString().split("T")[0] : "",
            gender: userData.gender,
        })
        setLoading(false);
       }
       fetchUser();
    }, [authUser]);
    
    return (
    <>
        <AuthGuard/>
        <div className="main-container">
        <Navbar />
        <h1>Profile</h1>
        {loading ? (
            <div className="profile-container">
                <div className="gradient-loading" style={{
                    width: "100%",
                    height: "100%",
                }}></div>
            </div>
        ) : (
        <div className="profile-container">
            <div className="profile-header">
                {showSettings && (
                    <ProfileSettings user={user} setShowSettings={setShowSettings} />
                )}
                {!isEditing ? (
                    <div className="dropdown" style={{ position: "absolute", top: "10px", right: "10px", maxWidth: "100px" }}>
                        <button className="btn bg-gradient-secondary" type="button" id="dropdownMenuButton" onClick={() => setShowDropdown(!showDropdown)}>
                            <i className="la la-ellipsis-v" style={{ fontSize: "20px", color: "#fff" }}></i>
                        </button>
                        <div className={`dropdown-menu dropdown-menu-end ${showDropdown ? "show" : ""}`} style={{ minWidth: "100px" }}>
                            <a className="dropdown-item" href="#" onClick={() => {
                                setShowDropdown(false);
                                setIsEditing(true);
                            }}>Edit Profile</a>
                            <a className="dropdown-item" href="#" onClick={() => {
                                setShowDropdown(false);
                                setShowSettings(true);
                            }}>Settings</a>
                            <a className="dropdown-item" href="#" style={{ color: "#ff3333" }} onClick={() => {
                                setShowDropdown(false);
                                handleLogout();
                            }}>Logout</a>
                        </div>
                    </div>
                ) : (
                   <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "10px" }}>
                        {/* Cancel */}
                        <button className="btn btn-default" style={{ backgroundColor: "#fff" }} onClick={() => {
                            setIsEditing(false);
                            setFormData({
                                name: user.name,
                                aboutMe: user.aboutMe,
                                birthdate: user.birthdate?.seconds ? new Date(user.birthdate.seconds * 1000).toISOString().split("T")[0] : "",
                                profilePictureFile: null,
                                gender: user.gender,
                                previewProfilePicture: null,
                            })
                        }}>
                            <i className="la la-times" style={{ fontSize: "20px", color: "#5e72e4" }}></i>
                        </button>
                        {/* Save changes */}
                        <button className="btn btn-default" style={{ backgroundColor: "#fff" }} onClick={onSubmit}>
                            <i className="la la-check" style={{ fontSize: "20px", color: "#5e72e4" }}></i>
                        </button>
                   </div>
                )}
                <img id="profile-preview" src={formData.previewProfilePicture || user.profilePicture || null} alt={user.name} className="profile-header-image" />
                {isEditing && <div>
                    <input type="file" className="form-control" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            // Allow only 5mb max
                            if (file.size > 5 * 1024 * 1024) {
                                alert("File size must be less than 5MB");
                                return;
                            }
                            setFormData({ ...formData, profilePictureFile: file, previewProfilePicture: URL.createObjectURL(file) });
                        }
                    }} />
                </div>}
                {isEditing ? (<input type="text" className="form-control" style={{ maxWidth: "200px" }} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />) : (<h1>{user.name}</h1>)}
            </div>
            <div className="profile-body">
                <h6>Birthdate</h6>
                {isEditing ? (
                    <input 
                    type="date" 
                    className="form-control"
                    max={new Date().toISOString().split("T")[0]}
                    style={{ maxWidth: "200px" }}
                    value={formData.birthdate} 
                    onChange={(e) => {
                        const age = calculateAge(e.target.value);
                        if (age < 18) {
                            alert("You must be at least 18 years old");
                            return;
                        }
                        setFormData({ ...formData, birthdate: e.target.value })
                    }} 
                    />) : (<p>{user.birthdate?.seconds ? new Date(user.birthdate.seconds * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "N/A"}</p>)}
                <h6>About me</h6>
                {isEditing ? (<textarea value={formData.aboutMe} className="form-control" onChange={(e) => setFormData({ ...formData, aboutMe: e.target.value })} />) : (<p>{user.aboutMe}</p>)}
                <h6>Gender</h6>
                {isEditing ? (<select className="form-control" style={{ maxWidth: "200px" }} value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>) : (<p style={{ textTransform: "capitalize" }}>{user.gender}</p>)}
            </div>
            </div>
        )}
        </div>
    </>
    )
}

function ProfileSettings({user, setShowSettings}: {user: any, setShowSettings: (show: boolean) => void}) {
    const [ageRange, setAgeRange] = useState([18, 100]);
    const [showMe, setShowMe] = useState("everyone");

    useEffect(() => {
        setShowMe(user.showMe);
    }, [user]);

    const onSubmit = async () => {
        setShowSettings(false);

        try {
            Swal.showLoading();
            const response = await fetch("/api/update-settings", {
                method: "POST",
                body: JSON.stringify({ showMe, userId: user.id }),
            });
            Swal.close();
            if (!response.ok) {
                throw new Error("Failed to update settings");
            }
            Swal.fire({
                title: "Success",
                text: "Settings updated successfully",
                icon: "success",
            }).then(() => {
                window.location.reload();
            });
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: "Error",
                text: "Failed to update settings",
            })
        }
    }

    return (
        <div className="modal-profile-settings">
            <div className="modal-profile-settings-content">
                    <h1>Settings</h1>
                    {/* Close button */}
                    <button className="btn btn-default" style={{ backgroundColor: "#fff", position: "absolute", top: "10px", right: "10px", }} onClick={() => setShowSettings(false)}>
                        <i className="la la-times" style={{ fontSize: "20px", color: "#5e72e4" }}></i>
                    </button>
                <div className="line-divider"></div>
                <div className="settings-group">
                    <h6>Show me</h6>
                    <select className="form-control" style={{ maxWidth: "200px" }} value={showMe} onChange={(e) => setShowMe(e.target.value)}>
                        <option value="everyone">Everyone</option>
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                    </select>
                </div>
                {/* TODO: Add age range */}
                {/* <div className="settings-group">
                    <h6>Age range</h6>
                    <div className="form-group">
                    </div>
                </div> */}
                <button className="btn btn-primary" onClick={onSubmit}>
                    Save Changes
                </button>
            </div>
        </div>
    )
}