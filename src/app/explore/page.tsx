"use client";
import Navbar from "@/lib/components/Navbar";
import { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import AuthGuard from "../../lib/components/AuthGuard";
import { useAppContext } from "@/lib/context/useAppContext";

export default function Dashboard() {
    const [users, setUsers] = useState<any[]>([]);
    const [lastVisibleId, setLastVisibleId] = useState<string>("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swipeDirection, setSwipeDirection] = useState<null | "left" | "right">(null);
    const [loading, setLoading] = useState(false);
    const { user: authUser } = useAppContext();
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [filters, setFilters] = useState({
        gender: "everyone",
        location: "",
        ageRange: [18, 100],
    });
    const [showFilters, setShowFilters] = useState(false);
    const handlePagination = () => {
        if (currentIndex <= users.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
        if (currentIndex >= Math.floor(users.length / 2) && lastVisibleId !== "") {
            fetchMoreUsers();
        }
    }

    const handleSwipe = (direction: "left" | "right") => {
        if (!authUser) return;
        setSwipeDirection(direction);
        const user = users[currentIndex];
        // Save interaction to database
        if (direction === "left") {
            // Not interested
            fetch(`/api/save-match`, {
                method: "POST",
                body: JSON.stringify({
                    userId: authUser.id,
                    matchedUserId: user.id,
                    status: "Not Interested"
                })
            }).then((res) => {
                console.log(res);
            }).catch((err) => {
                console.error(err);
            });
        }

        if (direction === "right") {
            // Interested
            fetch(`/api/save-match`, {
                method: "POST",
                body: JSON.stringify({
                    userId: authUser.id,
                    matchedUserId: user.id,
                    status: "Interested"
                })
            }).then((res) => {
                console.log(res);
            }).catch((err) => {
                console.error(err);
            });
        }
        
        setTimeout(() => {
          handlePagination();
          setSwipeDirection(null);
        }, 400);
      };
      
    const handlers = useSwipeable({
        onSwipedLeft: () => handleSwipe("left"),
        onSwipedRight: () => handleSwipe("right"),
        trackMouse: true
    });


    const fetchMoreUsers = async () => {
        if (isFetchingMore || !authUser) return;
        setIsFetchingMore(true);
        try {
            const url = `/api/find-users?userId=${authUser.id}&lastVisibleId=${lastVisibleId}&gender=${filters.gender}&location=${filters.location}&ageRange=${filters.ageRange}`;
            const response = await fetch(url);
            const usersData = await response.json();
            setUsers(prevUsers => [...prevUsers, ...usersData.users]);
            if (usersData.lastVisible) {
                setLastVisibleId(usersData.lastVisible);
            }
        } catch (error) {
            console.error("Error fetching more users:", error);
        } finally {
            setIsFetchingMore(false);
        }
    }

    useEffect(() => {
        fetchUsers();
    }, [authUser]);

    const fetchUsers = async (reset = false) => {
        if (!authUser) return;
        setLoading(true);
        if (reset) {
            setUsers([]);
            setCurrentIndex(0);
            setLastVisibleId("");
        }
        const url = `/api/find-users?userId=${authUser.id}&lastVisibleId=${lastVisibleId}&gender=${filters.gender}&location=${filters.location}&ageRange=${filters.ageRange}`;
        const response = await fetch(url);
        const usersData = await response.json();
        setUsers(usersData.users);
        if (usersData.lastVisible) {
            setLastVisibleId(usersData.lastVisible);
        }
        setLoading(false);
    }
    
    return (
        <>
        <AuthGuard>
        <div className="main-container">
            <Navbar />
             <h1>Explore</h1>
             <button className="btn btn-primary" onClick={() => setShowFilters(!showFilters)} style={{ marginBottom: "20px" }}>
                <i className="la la-filter"></i> Filters
             </button>
                {showFilters && (
                    <div className="filter-container">
                        <div className="form-group">
                            <label>Show me</label>
                            <select className="form-control" value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })}>
                                <option value="everyone">Everyone</option>
                                <option value="men">Men</option>
                                <option value="women">Women</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <input
                                type="text"
                                className="form-control"
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                list="location-suggestions"
                                placeholder="Type or select a location"
                            />
                            <datalist id="location-suggestions">
                                <option value="London" />
                                <option value="Manchester" />
                                <option value="Birmingham" />
                                <option value="Leeds" />
                                <option value="Glasgow" />
                                <option value="Edinburgh" />
                                <option value="Cardiff" />
                                <option value="Belfast" />
                            </datalist>
                        </div>
                        <div className="form-group">
                            <label>Age range</label>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <input
                                    type="number"
                                    className="form-control"
                                    min={18}
                                    max={filters.ageRange[1]}
                                    value={filters.ageRange[0]}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, "");
                                        setFilters({ ...filters, ageRange: [parseInt(val) || 18, filters.ageRange[1]] });
                                    }}
                                    list="min-age-options"
                                    style={{ width: "80px" }}
                                />
                                <datalist id="min-age-options">
                                    {[...Array(83)].map((_, i) => <option key={i} value={i + 18} />)}
                                </datalist>
                                <span>to</span>
                                <input
                                    type="number"
                                    className="form-control"
                                    min={filters.ageRange[0]}
                                    max={100}
                                    value={filters.ageRange[1]}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, "");
                                        setFilters({ ...filters, ageRange: [filters.ageRange[0], parseInt(val) || 100] });
                                    }}
                                    list="max-age-options"
                                    style={{ width: "80px" }}
                                />
                                <datalist id="max-age-options">
                                    {[...Array(83)].map((_, i) => <option key={i} value={i + 18} />)}
                                </datalist>
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={() => {
                            setShowFilters(false);
                            fetchUsers(true);
                        }}>Apply</button>
                    </div>
                )}
            <div className="explore-container" {...handlers}>
                {loading ? <div className="explore-item">
                    <div className="gradient-loading" style={{
                        width: "100%",
                        height: "100%",
                    }}></div>
                </div> : users?.length > 0 && currentIndex <= users.length - 1 ? (
                        <div className={`explore-item ${swipeDirection === "left" ? "swipe-left" : swipeDirection === "right" ? "swipe-right" : ""}`} key={users[currentIndex].id}>
                            <img src={users[currentIndex].profilePicture} alt="Profile" />
                            <div className="explore-item-content">
                                <h2>{users[currentIndex].name}, {users[currentIndex].birthdate ? new Date().getFullYear() - new Date(users[currentIndex].birthdate.seconds * 1000).getFullYear() : "N/A"} years old</h2>
                                <p>{users[currentIndex].aboutMe}</p>
                            </div>
                        </div>
                ) : (
                    <div className="explore-item" style={{fontSize: "24px", fontWeight: "bold", textAlign: "center", padding: "20px"}}>
                        <h3 style={{ color: "black" }}>No more users to show</h3>
                        <p style={{ color: "black"}}>Check back later for more users</p>
                    </div>
                )}

            </div>
            {/* Additional buttons to allow users to swipe left and right */}
            <div className="explore-item-buttons">
                <button className="btn btn-primary" onClick={() => handleSwipe("left")}><i className="la la-times"></i></button>
                <button className="btn btn-primary" onClick={() => handleSwipe("right")}><i className="la la-heart"></i></button>
            </div>
        </div>
        </AuthGuard>
        </>
    )
}