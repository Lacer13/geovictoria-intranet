import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

export function useAccessDirectory() {
  const [members, setMembers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [status, setStatus] = useState("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    setStatus("loading");
    setMembers([]);
    setProfiles([]);
    let membersReady = false,
      profilesReady = false,
      failed = false;
    const timeout = setTimeout(() => setStatus("error"), 12000);
    const ready = () => {
      if (!failed && membersReady && profilesReady) {
        clearTimeout(timeout);
        setStatus("ready");
      }
    };
    const fail = () => {
      failed = true;
      clearTimeout(timeout);
      setMembers([]);
      setProfiles([]);
      setStatus("error");
    };
    const stopMembers = onSnapshot(
      collection(db, "administrators"),
      (snapshot) => {
        setMembers(
          snapshot.docs
            .map((item) => ({ ...item.data(), id: item.id }))
            .sort((a, b) =>
              a.role === "owner"
                ? -1
                : b.role === "owner"
                  ? 1
                  : a.email.localeCompare(b.email),
            ),
        );
        membersReady = true;
        ready();
      },
      fail,
    );
    const stopProfiles = onSnapshot(
      collection(db, "accessProfiles"),
      (snapshot) => {
        setProfiles(
          snapshot.docs
            .map((item) => ({ ...item.data(), id: item.id }))
            .sort((a, b) => a.name.localeCompare(b.name, "es")),
        );
        profilesReady = true;
        ready();
      },
      fail,
    );
    return () => {
      clearTimeout(timeout);
      stopMembers();
      stopProfiles();
    };
  }, [retry]);
  return {
    members,
    profiles,
    status,
    retry: () => setRetry((value) => value + 1),
  };
}
