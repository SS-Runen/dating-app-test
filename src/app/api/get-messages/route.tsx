import { getFirebaseApp } from "@/lib/firebase/client";
import { getFirestore, collection, query, orderBy, limit, getDocs, startAfter, Timestamp } from "firebase/firestore";
import { messageConverter } from "@/lib/models/chat";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const lastVisibleTimestamp = searchParams.get('lastVisible');

    if (!chatId) {
        return NextResponse.json({ message: "Chat ID is required" }, { status: 400 });
    }

    try {
        const firebaseApp = getFirebaseApp();
        const db = getFirestore(firebaseApp);

        const messagesRef = collection(db, `chats/${chatId}/messages`).withConverter(messageConverter);
        
        let q;
        if (lastVisibleTimestamp) {
            const lastVisibleDate = new Date(JSON.parse(lastVisibleTimestamp));
            q = query(messagesRef, orderBy("createdAt", "desc"), startAfter(Timestamp.fromDate(lastVisibleDate)), limit(25));
        } else {
            q = query(messagesRef, orderBy("createdAt", "desc"), limit(25));
        }

        const querySnapshot = await getDocs(q);
        const messages = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Firestore Timestamp to a serializable format
            return {
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            };
        });
        
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        const nextLastVisible = lastDoc ? (lastDoc.data().createdAt as Timestamp).toDate().toISOString() : null;

        return NextResponse.json({ messages, lastVisible: nextLastVisible }, { status: 200 });
    } catch (error) {
        console.error("Failed to get messages:", error);
        return NextResponse.json({ message: "Failed to get messages" }, { status: 500 });
    }
}
