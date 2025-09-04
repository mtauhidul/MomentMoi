"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Input, Select, Button } from "@/components/ui";
import { Plus, X, Mail, Phone } from "lucide-react";

interface ContactInfoFormProps {
  isPreviewMode: boolean;
  contacts?: {
    id: string;
    contact_type: "email" | "phone";
    contact_value: string;
    is_primary: boolean;
  }[];
  onDataChange?: (data: {
    primaryEmail: string;
    primaryPhone: string;
    additionalContacts: Array<{
      contact_type: "email" | "phone";
      contact_value: string;
      is_primary: boolean;
    }>;
  }) => void;
}

interface ContactMethod {
  id: string;
  type: "email" | "phone";
  value: string;
  isPrimary: boolean;
}

export function ContactInfoForm({
  isPreviewMode,
  contacts,
  onDataChange,
}: ContactInfoFormProps) {
  const hasMounted = useRef(false);

  // Extract primary contacts from the contacts array
  const primaryEmailContact = contacts?.find(
    (c) => c.contact_type === "email" && c.is_primary
  );
  const primaryPhoneContact = contacts?.find(
    (c) => c.contact_type === "phone" && c.is_primary
  );
  const additionalContactsData = contacts?.filter((c) => !c.is_primary) || [];

  const [primaryEmail, setPrimaryEmail] = useState(
    primaryEmailContact?.contact_value || ""
  );
  const [primaryPhone, setPrimaryPhone] = useState(
    primaryPhoneContact?.contact_value || ""
  );
  const [additionalContacts, setAdditionalContacts] = useState<ContactMethod[]>(
    additionalContactsData.map((c) => ({
      id: c.id,
      type: c.contact_type,
      value: c.contact_value,
      isPrimary: c.is_primary,
    }))
  );

  // Update form state when contacts prop changes
  useEffect(() => {
    if (contacts) {
      const primaryEmailContact = contacts.find(
        (c) => c.contact_type === "email" && c.is_primary
      );
      const primaryPhoneContact = contacts.find(
        (c) => c.contact_type === "phone" && c.is_primary
      );
      const additionalContactsData = contacts.filter((c) => !c.is_primary);

      setPrimaryEmail(primaryEmailContact?.contact_value || "");
      setPrimaryPhone(primaryPhoneContact?.contact_value || "");
      setAdditionalContacts(
        additionalContactsData.map((c) => ({
          id: c.id,
          type: c.contact_type,
          value: c.contact_value,
          isPrimary: c.is_primary,
        }))
      );
    }
  }, [contacts]);

  // Mark component as mounted after first render
  useEffect(() => {
    hasMounted.current = true;
  }, []);

  // Notify parent when form is initially loaded with data
  useEffect(() => {
    if (contacts && onDataChange && hasMounted.current) {
      notifyParent();
    }
  }, [contacts]); // Only depend on contacts, not onDataChange to avoid infinite loop

  const addContact = () => {
    const newContact: ContactMethod = {
      id: Date.now().toString(),
      type: "email",
      value: "",
      isPrimary: false,
    };
    setAdditionalContacts([...additionalContacts, newContact]);
    setTimeout(notifyParent, 0);
  };

  const removeContact = (id: string) => {
    setAdditionalContacts(
      additionalContacts.filter((contact) => contact.id !== id)
    );
    setTimeout(notifyParent, 0);
  };

  const updateContact = (
    id: string,
    field: keyof ContactMethod,
    value: any
  ) => {
    setAdditionalContacts((prev) =>
      prev.map((contact) =>
        contact.id === id ? { ...contact, [field]: value } : contact
      )
    );
    setTimeout(notifyParent, 0);
  };

  const setPrimaryContact = (id: string) => {
    setAdditionalContacts((prev) =>
      prev.map((contact) => ({
        ...contact,
        isPrimary: contact.id === id,
      }))
    );
    setTimeout(notifyParent, 0);
  };

  // Notify parent when data changes - only when user interacts
  const notifyParent = () => {
    if (onDataChange && hasMounted.current) {
      // Combine primary contacts with additional contacts
      const allContacts = [
        // Primary email
        ...(primaryEmail
          ? [
              {
                contact_type: "email" as const,
                contact_value: primaryEmail,
                is_primary: true,
              },
            ]
          : []),
        // Primary phone
        ...(primaryPhone
          ? [
              {
                contact_type: "phone" as const,
                contact_value: primaryPhone,
                is_primary: true,
              },
            ]
          : []),
        // Additional contacts
        ...additionalContacts.map((contact) => ({
          contact_type: contact.type,
          contact_value: contact.value,
          is_primary: contact.isPrimary,
        })),
      ];

      onDataChange({
        primaryEmail,
        primaryPhone,
        additionalContacts: allContacts,
      });
    }
  };

  if (isPreviewMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {primaryEmail && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{primaryEmail}</span>
            </div>
          )}
          {primaryPhone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{primaryPhone}</span>
            </div>
          )}
          {additionalContacts.map((contact) => (
            <div key={contact.id} className="flex items-center gap-3">
              {contact.type === "email" ? (
                <Mail className="w-4 h-4 text-gray-400" />
              ) : (
                <Phone className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-gray-700">{contact.value}</span>
              {contact.isPrimary && (
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                  Primary
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Email *
          </label>
          <Input
            type="email"
            value={primaryEmail}
            onChange={(e) => {
              setPrimaryEmail(e.target.value);
              setTimeout(notifyParent, 0);
            }}
            placeholder="your@email.com"
            required
          />
        </div>

        {/* Primary Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Phone *
          </label>
          <Input
            type="tel"
            value={primaryPhone}
            onChange={(e) => {
              setPrimaryPhone(e.target.value);
              setTimeout(notifyParent, 0);
            }}
            placeholder="+357 99 123 456"
            required
          />
        </div>

        {/* Additional Contact Methods */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Additional Contact Methods
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={addContact}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </Button>
          </div>

          <div className="space-y-3">
            {additionalContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-3 p-3 border border-border rounded-lg"
              >
                <select
                  value={contact.type}
                  onChange={(e) =>
                    updateContact(
                      contact.id,
                      "type",
                      e.target.value as "email" | "phone"
                    )
                  }
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>

                <Input
                  type={contact.type === "email" ? "email" : "tel"}
                  value={contact.value}
                  onChange={(e) =>
                    updateContact(contact.id, "value", e.target.value)
                  }
                  placeholder={
                    contact.type === "email"
                      ? "email@example.com"
                      : "+357 99 123 456"
                  }
                  className="flex-1"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPrimaryContact(contact.id)}
                  className={
                    contact.isPrimary ? "bg-primary-50 text-primary-700" : ""
                  }
                >
                  {contact.isPrimary ? "Primary" : "Set Primary"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeContact(contact.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
