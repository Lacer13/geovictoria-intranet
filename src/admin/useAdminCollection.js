import { useCallback, useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export function useAdminCollection(path) {
  const [items, setItems] = useState([]),
    [status, setStatus] = useState("loading"),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    setItems([]);
    setStatus("loading");
    const timeout = setTimeout(() => setStatus("error"), 12000);
    const stop = onSnapshot(
      collection(db, path),
      (snapshot) => {
        clearTimeout(timeout);
        setItems(
          snapshot.docs.map((item) => ({ ...item.data(), id: item.id })),
        );
        setStatus("ready");
      },
      () => {
        clearTimeout(timeout);
        setItems([]);
        setStatus("error");
      },
    );
    return () => {
      clearTimeout(timeout);
      stop();
    };
  }, [path, retry]);
  const upsert = useCallback(
    (item) =>
      setItems((old) => [
        ...old.filter((record) => record.id !== item.id),
        item,
      ]),
    [],
  );
  return { items, status, retry: () => setRetry((value) => value + 1), upsert };
}
export function adminDate(value) {
  const date = value?.toDate?.() || new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString("es-PE", {
        timeZone: "America/Lima",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Sin fecha disponible";
}
