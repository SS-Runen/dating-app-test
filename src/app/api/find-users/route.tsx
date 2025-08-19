import { getFirestore, collection, query, where, getDocs, limit, documentId, startAfter, QueryConstraint, doc, getDoc} from "firebase/firestore";
import { getFirebaseApp } from "../../../lib/firebase/client";
import { tokenizeLocation } from "../../../lib/utils/utils";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") as string;
    const pageLimit = parseInt(searchParams.get("limit") || "10");
    const lastVisibleId = searchParams.get("lastVisibleId");
    const ageRangeParam = searchParams.get("ageRange");
    const ageRange = ageRangeParam ? ageRangeParam.split(",").map(Number) as [number, number] : undefined;
    const gender = searchParams.get("gender");
    const location = searchParams.get("location");

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
    const matchedUserIds = userMatches.map((match) => match.matchedUserId);

    const usersRef = collection(db, "/users");
    const removedUserIds = [...(matchedUserIds || []), userId];
    const queries: QueryConstraint[] = [
        where(documentId(), "!=", userId),
        ...(gender === "everyone" ? [] : [where("gender", "==", gender === "men" ? "male" : "female")]),
        limit(50)
    ]

    if (location) {
        const tokens = tokenizeLocation(location);
        if (tokens.length > 0) {
            queries.push(where("locationTokens", "array-contains", tokens[0]));
        }
    }

    if (ageRange && ageRange.length === 2 && !isNaN(ageRange[0]) && !isNaN(ageRange[1])) {
        const [minAge, maxAge] = ageRange;
        const now = new Date();
        const minBirthdate = new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate());
        const maxBirthdate = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
        queries.push(where("birthdate", ">=", minBirthdate));
        queries.push(where("birthdate", "<=", maxBirthdate));
    }

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
    }).filter((user) => !removedUserIds.includes(user.id)).slice(0, pageLimit);
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length-1];
    return Response.json({
        users: usersData,
        lastVisible: lastVisible && usersData.length >= pageLimit ? lastVisible.id : null
    });
}