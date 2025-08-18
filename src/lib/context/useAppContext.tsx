"use client"
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getFirebaseApp } from "../firebase/client";
import { User } from "../models/user";

interface AppContextType {
    authUser: FirebaseUser | null;
    user: User | null;
    loading: boolean;
}

const AppContext = createContext<AppContextType>({
    authUser: null,
    user: null,
    loading: true,
});

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const app = getFirebaseApp();
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setAuthUser(firebaseUser);
                // Fetch the user profile from your API
                const response = await fetch(`/api/get-user?userId=${firebaseUser.uid}`);
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData as User);
                } else {
                    // Handle case where user exists in Auth but not in Firestore
                    setUser(null); 
                }
            } else {
                setAuthUser(null);
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AppContext.Provider value={{ authUser, user, loading }}>
            {children}
        </AppContext.Provider>
    )
}
