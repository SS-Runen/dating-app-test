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
    const handlePagination = () => {
        if (currentIndex <= users.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
        if (currentIndex >= Math.floor(users.length / 2) && lastVisibleId !== "") {
            fetchMoreUsers();
        }
    }

    const handleSwipe = (direction: "left" | "right") => {
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
        if (isFetchingMore) return;
        setIsFetchingMore(true);
        try {
            const response = await fetch(`/api/find-users?userId=${authUser.id}&lastVisibleId=${lastVisibleId}`);
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
        const fetchUsers = async () => {
            if (!authUser) return;
            setLoading(true);
            const response = await fetch(`/api/find-users?userId=${authUser.id}&lastVisibleId=${lastVisibleId}`);
            const usersData = await response.json();
            setUsers(usersData.users);
            if (usersData.lastVisible) {
                setLastVisibleId(usersData.lastVisible);
            }
            setLoading(false);
        }
        fetchUsers();
    }, [authUser]);
    
    return (
        <>
        <AuthGuard/>
        <div className="main-container">
            <Navbar />
             <h1>Explore</h1>
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
        </>
    )
}