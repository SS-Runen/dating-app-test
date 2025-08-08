import { NextRequest, NextResponse } from "next/server";
import { getFirebaseApp } from "../../../lib/firebase/client";
import { updateDoc, getFirestore, and, where, collection, query, getDocs, doc, deleteDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
    const { userId, matchedUserId } = await request.json();

    try {
        const firebaseApp = getFirebaseApp();
        const db = getFirestore(firebaseApp);
        const queryRef = query(collection(db, "user_matches"), and(where("userId", "==", userId), where("matchedUserId", "==", matchedUserId)));
        const matchSnapshot = await getDocs(queryRef);
        if (matchSnapshot.empty) {
            return NextResponse.json({ message: "Match not found" }, { status: 404 });
        }

        const matchDoc = matchSnapshot.docs[0];
        await updateDoc(doc(db, "user_matches", matchDoc.id), {
            status: "Not Interested"
        });

        // Delete the chat
        const memberIds = [userId, matchedUserId].sort();
        const filter = query(collection(db, "chats"), where("memberIds", "==", memberIds));
        const chatDocs = await getDocs(filter);
        if (chatDocs.docs.length > 0) {
            await deleteDoc(doc(db, "chats", chatDocs.docs[0].id));
        }

        return NextResponse.json({ message: "Unmatched user", success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error unmatching user" }, { status: 500 });
    }
}