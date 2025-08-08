"use client";

import { useEffect, useState } from "react";

export default function AuthGuard(props: any) {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        setLoading(true);
        const authUser = localStorage.getItem("authUser");
        if (!authUser) {
            window.location.href = "/";
            return;
        }
        setUser(JSON.parse(authUser));
        setLoading(false);
    }, []);

    return (
    <>
    {/* Loading spinner */}
    {loading && <div className="auth-guard">
        {/* <h1>Loading...</h1> */}
        <h1>
            <i className="la la-circle-notch spin la-2x text-primary"></i>
          </h1>
    </div> }
    </>
    )
}