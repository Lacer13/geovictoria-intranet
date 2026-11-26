import { useCallback, useState } from "react";
import ContentManager from "../components/ContentManager";
import { useAdminCollection } from "./useAdminCollection";
import CollectionState from "./CollectionState";
import DeleteRecordDialog from "./DeleteRecordDialog";

export default function ContentSection({ kind, access }) {
  const { items, status, retry, upsert } = useAdminCollection(kind);
  const [pending, setPending] = useState(null);
  const close = useCallback(() => setPending(null), []);
  const sorted = [...items].sort((a, b) =>
    kind === "directory"
      ? String(a.department).localeCompare(String(b.department), "es")
      : String(b.timestamp).localeCompare(String(a.timestamp)),
  );
  if (status !== "ready")
    return <CollectionState status={status} retry={retry} />;
  return (
    <>
      <ContentManager
        kind={kind}
        items={sorted}
        onSavedRecord={upsert}
        onDelete={(id) => setPending(items.find((item) => item.id === id))}
        canCreate={access.permissions.includes(`${kind}.create`)}
        canEdit={access.permissions.includes(`${kind}.edit`)}
        canDelete={access.permissions.includes(`${kind}.delete`)}
      />
      {pending && (
        <DeleteRecordDialog
          path={[kind, pending.id]}
          label={pending.title || pending.name}
          onClose={close}
        />
      )}
    </>
  );
}
