import { getFirestore, collection, query, where, getDocs, limit, documentId, startAfter, QueryConstraint, doc, getDoc} from "firebase/firestore";
import { getFirebaseApp } from "../../../lib/firebase/client";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") as string;
    const pageLimit = parseInt(searchParams.get("limit") || "10");
    const lastVisibleId = searchParams.get("lastVisibleId");

    const firebaseApp = getFirebaseApp();
    const db = getFirestore(firebaseApp);

    // Get user record
    const userRef = doc(db, "/users", userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
        return Response.json({
            error: "User not found"
        }, { status: 404 });
    }
    const user = userSnapshot.data();

    // Find users that are not the current user and are not already matched
    const userMatchesRef = collection(db, "/user_matches");
    const userMatchesQuery = query(userMatchesRef, where("userId", "==", userId));
    const userMatchesSnapshot = await getDocs(userMatchesQuery);
    const userMatches = userMatchesSnapshot.docs.map((doc) => doc.data());
    const matchedUserIds = userMatches.map((match) => match.userId);

    const usersRef = collection(db, "/users");
    const removedUserIds = [...(matchedUserIds || []), userId];
    const queries: QueryConstraint[] = [
        where(documentId(), "not-in", removedUserIds),
        ...(user.showMe === "everyone" ? [] : [where("gender", "==", user.showMe === "men" ? "male" : "female")]),
        limit(pageLimit)
    ]

    if (lastVisibleId) {
        queries.push(startAfter(documentId(), lastVisibleId));
    }
    const q = query(usersRef, ...queries);
    const querySnapshot = await getDocs(q);
    
    const usersData = querySnapshot.docs.map((doc) => {
        return {
            id: doc.id,
            ...doc.data()
        }
    });
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length-1];
    return Response.json({
        users: usersData,
        lastVisible: lastVisible && usersData.length >= pageLimit ? lastVisible.id : null
    });
}