import React, { useState } from "react";
import Modal from "./Modal";
import FormField from "./FormField";
import { useInvestigationStore } from "../store/useInvestigationStore";
import type { Person } from "../types";

interface EditPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  caseId: string;
}

interface EditPersonFormProps {
  person: Person;
  onClose: () => void;
}

function EditPersonForm({ person, onClose }: EditPersonFormProps) {
  const updatePerson = useInvestigationStore((s) => s.updatePerson);

  const [fullName, setFullName] = useState(person.fullName);
  const [type, setType] = useState<Person["type"]>(person.type);
  const [phone, setPhone] = useState(person.phone || "");
  const [address, setAddress] = useState(person.address || "");
  const [aliases, setAliases] = useState(
    (person.knownAliases || []).join(", "),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const aliasList = aliases
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const saved = await updatePerson(person.id, {
      fullName: fullName.trim(),
      type,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      knownAliases: aliasList.length > 0 ? aliasList : undefined,
    });

    if (!saved) return;
    setSuccessMsg("Person details updated successfully.");
    setTimeout(() => {
      onClose();
    }, 700);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMsg && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-[14px] text-green-700">
          {successMsg}
        </div>
      )}

      <FormField label="Full Name" required error={errors.fullName}>
        <input
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (errors.fullName)
              setErrors((prev) => ({ ...prev, fullName: "" }));
          }}
          placeholder="e.g. Kwame Asante"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
        />
      </FormField>

      <FormField label="Person Type" required>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as Person["type"])}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
        >
          <option value="suspect">Suspect</option>
          <option value="witness">Witness</option>
          <option value="victim">Victim</option>
          <option value="person-of-interest">Person of Interest</option>
        </select>
      </FormField>

      <FormField label="Phone Number" error={errors.phone}>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 0241111111"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
        />
      </FormField>

      <FormField label="Address" error={errors.address}>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 14 Independence Ave, Ridge, Accra"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
        />
      </FormField>

      <FormField
        label="Known Aliases"
        hint="Comma-separated names (e.g. Chief, K-Dog)"
        error={errors.aliases}
      >
        <input
          type="text"
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          placeholder="e.g. Junior, Big Man"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-4 py-2 text-[14px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}

export default function EditPersonModal({
  isOpen,
  onClose,
  person,
}: EditPersonModalProps) {
  if (!person || !isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Details: ${person.fullName}`}
    >
      <EditPersonForm key={person.id} person={person} onClose={onClose} />
    </Modal>
  );
}
