import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";

import { PortalContext } from "./portal";

function useCollection(name, sort, count) {
  const [state, setState] = useState({ data: [], status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      if (active) setState((previous) => ({ ...previous, status: "error" }));
    }, 8000);
    const constraints = [];
    if (sort) constraints.push(orderBy(sort, "desc"));
    if (count) constraints.push(limit(count));
    const unsubscribe = onSnapshot(
      query(collection(db, name), ...constraints),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!active || (snapshot.metadata.fromCache && snapshot.empty)) return;
        clearTimeout(timeout);
        setState({
          data: snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
          status: "ready",
        });
      },
      () => {
        clearTimeout(timeout);
        if (active) setState((previous) => ({ ...previous, status: "error" }));
      },
    );
    return () => {
      active = false;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [name, sort, count, attempt]);
  return {
    ...state,
    retry: () => {
      setState((previous) => ({ ...previous, status: "loading" }));
      setAttempt((v) => v + 1);
    },
  };
}

export function PortalProvider({ children }) {
  const news = useCollection("news", "timestamp", 30);
  const leaderboard = useCollection("leaderboard", "score", 5);
  const directory = useCollection("directory");
  return (
    <PortalContext.Provider value={{ news, leaderboard, directory }}>
      {children}
    </PortalContext.Provider>
  );
}
