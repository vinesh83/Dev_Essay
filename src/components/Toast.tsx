import { useEffect, useState } from "react";
import { BADGES } from "../lib/store";

type Msg = { id: number; text: string };
let push: (text: string) => void = () => {};
let n = 0;

export function toast(text: string) {
  push(text);
}

export function toastBadges(ids: string[]) {
  ids.forEach((id) => BADGES[id] && toast(`${BADGES[id].icon} New badge: ${BADGES[id].name}!`));
}

export function Toaster() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  useEffect(() => {
    push = (text) => {
      const id = ++n;
      setMsgs((m) => [...m, { id, text }]);
      setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== id)), 3200);
    };
  }, []);
  if (!msgs.length) return null;
  return <div className="toast">{msgs[msgs.length - 1].text}</div>;
}
