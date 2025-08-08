"use client"
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AppContextType {
    user: any;
    isAuthenticated: boolean;
    setUser: (user: any) => void;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const AppContext = createContext<AppContextType>({
    user: null,
    isAuthenticated: false,
    setUser: (user: any) => {},
    setIsAuthenticated: (isAuthenticated: boolean) => {},
})

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const authUser = localStorage.getItem("authUser");
        console.log("authUser", authUser);
        if (authUser) {
            setUser(JSON.parse(authUser));
            setIsAuthenticated(true);
        }
    }, []);

    return (
        <AppContext.Provider value={{ user, isAuthenticated, setUser, setIsAuthenticated }}>
            {children}
        </AppContext.Provider>
    )
}
