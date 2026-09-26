"use client";

import { useState } from "react";
import { Button, Dialog, Field, Input, Textarea } from "@/components/ui";

/** Naming a list is the only thing creating one asks for; the note is for later. */
export function NewList({
  open, onClose, onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const save = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim());
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New list"
      subtitle="A way to group people you want to work through together."
      width={460}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!name.trim()} onClick={save}>Create list</Button>
        </>
      }
    >
      <div className="space-y-4 p-5">
        <Field label="List name">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); }}
            placeholder="e.g. AI Product Leaders"
          />
        </Field>
        <Field label="Description" hint="Optional. A note to yourself about why this list exists.">
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Product leaders I may want to speak with while exploring PM."
          />
        </Field>
      </div>
    </Dialog>
  );
}
