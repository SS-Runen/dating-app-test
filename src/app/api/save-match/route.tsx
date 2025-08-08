import { NextRequest, NextResponse } from "next/server";
import { getFirebaseApp } from "../../../lib/firebase/client";
import { addDoc, collection, getFirestore } from "firebase/firestore";

export async function POST(request: NextRequest) {
    const { userId, matchedUserId, status } = await request.json();

    try {
        const firebaseApp = getFirebaseApp();
        const db = getFirestore(firebaseApp);
        // Insert into user_matches collection
        const userMatchesRef = collection(db, "user_matches");
        await addDoc(userMatchesRef, {
            userId,
            matchedUserId,
            status
        });
        return NextResponse.json({ message: "Match saved" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error saving match" }, { status: 500 });
    }
}