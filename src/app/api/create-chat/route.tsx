import { getFirebaseApp } from "@/lib/firebase/client";
import { getFirestore, collection, query, where, getDocs, addDoc, doc, getDoc } from "firebase/firestore";
import { chatConverter, Chat } from "@/lib/models/chat";
import { userConverter, User } from "@/lib/models/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { authUserId, chatUserId } = await req.json();

        if (!authUserId || !chatUserId) {
            return NextResponse.json({ message: "User IDs are required" }, { status: 400 });
        }

        const firebaseApp = getFirebaseApp();
        const db = getFirestore(firebaseApp);

        // Check if chat already exists
        const memberIds = [authUserId, chatUserId].sort();
        const chatsRef = collection(db, "chats").withConverter(chatConverter);
        const q = query(chatsRef, where("memberIds", "==", memberIds));
        const chatDocs = await getDocs(q);

        if (chatDocs.docs.length > 0) {
            // Chat already exists
            const existingChat = chatDocs.docs[0].data();
            return NextResponse.json({ chat: existingChat }, { status: 200 });
        } else {
            // Create new chat
            const authUserRef = doc(db, "users", authUserId).withConverter(userConverter);
            const chatUserRef = doc(db, "users", chatUserId).withConverter(userConverter);

            const authUserDoc = await getDoc(authUserRef);
            const chatUserDoc = await getDoc(chatUserRef);

            if (!authUserDoc.exists() || !chatUserDoc.exists()) {
                return NextResponse.json({ message: "One or more users not found" }, { status: 404 });
            }

            const authUserData = authUserDoc.data() as User;
            const chatUserData = chatUserDoc.data() as User;

            const newChat = new Chat({
                id: '', // Firestore will generate
                memberIds,
                members: {
                    [authUserId]: {
                        name: authUserData.name || '',
                        profilePicture: authUserData.profilePicture || '',
                    },
                    [chatUserId]: {
                        name: chatUserData.name || '',
                        profilePicture: chatUserData.profilePicture || '',
                    },
                },
                lastMessage: null,
            });
            
            const chatDocRef = await addDoc(chatsRef, newChat);
            const createdChat = await getDoc(chatDocRef.withConverter(chatConverter));
            
            return NextResponse.json({ chat: createdChat.data() }, { status: 201 });
        }
    } catch (error) {
        console.error("Failed to create chat:", error);
        return NextResponse.json({ message: "Failed to create chat" }, { status: 500 });
    }
}
