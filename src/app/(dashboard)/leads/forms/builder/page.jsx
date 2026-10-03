"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { xFetch } from "@/utility/xFetch";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.min.css";
import { Star, Copy, Plus, ArrowUp, ArrowDown, Trash2, Eye, Save, Settings as SettingsIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";

const COLUMN_FILTER = ["firstName", "emailId", "mobile", "course", "location"];

function emptyField() {
  return { _key: crypto.randomUUID(), label: "", name: "NA", input_type: "NA", placeholder: "", isRequired: "" };
}

export default function FormBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [buttonText, setButtonText] = useState("Submit");
  const [fields, setFields] = useState([emptyField()]);
  const [isPaid, setIsPaid] = useState("FREE");
  const [formFooter, setFormFooter] = useState("Show");
  const [columns, setColumns] = useState([]);
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [view, setView] = useState("form");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (!token) return;

    xFetch({ path: `/services/widget/getEntryFields?token=${encodeURIComponent(token)}` })
      .then((res) => {
        console.log("FETCHED FIELDS:", res?.fields);
        if (!res?.status) { toast.error(res?.desc || "Invalid form"); return; }
        setTitle(res.form_title || "");
        setDescription(res.description || "");
        setButtonText(res.submit_btn || "Submit");
        setIsPaid(res.is_paid ? "PAID" : "FREE");
        setFormFooter(res.footerCredit || "Show");
        if (Array.isArray(res.fields) && res.fields.length > 0) {
          setFields(res.fields.map((f) => ({ ...f, _key: crypto.randomUUID() })));
        }
      })
      .catch(() => toast.error("Failed to load form"))
      .finally(() => setLoading(false));

    xFetch({ path: "/services/profile/columns" })
      .then((data) => {
        const filtered = (data || [])
          .filter((c) => COLUMN_FILTER.includes(c.dataField))
          .map((c) => ({ value: c.dataField === "emailId" ? "email" : c.dataField, label: c.displayName || c.fieldName }));
        setColumns(filtered);
      })
      .catch(() => setColumns([]));

    xFetch({ path: "/services/widget/checkPaymentGatewayEnabled" })
      .then((res) => setPaymentEnabled(!!res?.enabled))
      .catch(() => setPaymentEnabled(false));
  }, [token]);

  const updateField = (key, patch) => setFields((prev) => prev.map((f) => (f._key === key ? { ...f, ...patch } : f)));

  const addFieldAfter = (key) => setFields((prev) => {
    const idx = prev.findIndex((f) => f._key === key);
    const next = [...prev];
    next.splice(idx + 1, 0, emptyField());
    return next;
  });

  const duplicateFieldAfter = (key) => setFields((prev) => {
    const idx = prev.findIndex((f) => f._key === key);
    const dup = { ...prev[idx], _key: crypto.randomUUID() };
    const next = [...prev];
    next.splice(idx + 1, 0, dup);
    return next;
  });

  const deleteField = (key) => setFields((prev) => prev.filter((f) => f._key !== key));

  const moveField = (key, dir) => setFields((prev) => {
    const idx = prev.findIndex((f) => f._key === key);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= prev.length) return prev;
    const next = [...prev];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    return next;
  });

  const toggleRequired = (key) => setFields((prev) =>
    prev.map((f) => (f._key === key ? { ...f, isRequired: f.isRequired === "required" ? "" : "required" } : f))
  );

  const handleSave = () => {
    console.log("FIELDS STATE:", fields);
    let courseUsed = false, requiredFieldAdded = false, emptyCheck = true, duplicateCheck = true;
    const usedColumns = [];

    for (const f of fields) {
      if (f.name === "NA" || f.input_type === "NA" || f.label === "" || f.placeholder === "") emptyCheck = false;
      if (usedColumns.includes(f.name)) duplicateCheck = false; else usedColumns.push(f.name);
      if ((f.name === "email" || f.name === "mobile") && f.isRequired === "required") requiredFieldAdded = true;
      if (f.name === "course") courseUsed = true;
    }

    if (isPaid === "PAID" && !courseUsed) {
      toast.error("Add a course/service field to collect payment through this form, or disable payment after form submission.");
      return;
    }
    if (!requiredFieldAdded) {
      toast.error("Email Id or Mobile/Phone field is mandatory and must be marked required.");
      return;
    }
    if (!emptyCheck) {
      toast.error(`Fill all labels, placeholders, input types & columns.${!duplicateCheck ? " Also, a column can't be used on multiple fields." : ""}`);
      return;
    }
    if (!duplicateCheck) {
      toast.error("A column can't be assigned to multiple fields.");
      return;
    }
    if (!title || !description) {
      toast.error("Form title & description are required.");
      return;
    }

    const formData = {
      title, description,
      button_text: buttonText || "Submit",
      fields: fields.map(({ _key, ...f }) => f),
      is_paid: isPaid,
      form_footer: formFooter,
    };

    setSaving(true);
    xFetch({ path: "/services/widget/updateFormInfo", method: "POST", payload: new URLSearchParams({ token, data: JSON.stringify(formData) }), isFormData: true })      .then((res) => toast[res?.status ? "success" : "error"](res?.desc || "Something went wrong"))
      .catch(() => toast.error("Failed to save form"))
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this form?")) return;
    setDeleting(true);
      xFetch({ path: "/services/widget/deleteMyForm", method: "POST", payload: new URLSearchParams({ token }), isFormData: true })      .then((res) => { if (res?.status) setDeleted(true); else toast.error(res?.desc || "Failed to delete form"); })
      .catch(() => toast.error("Failed to delete form"))
      .finally(() => setDeleting(false));
  };

  const handlePaidToggle = () => {
    if (isPaid === "FREE" && !paymentEnabled) {
      toast.error("Add a payment method in profile settings to enable payment on this form.");
      return;
    }
    setIsPaid((prev) => (prev === "PAID" ? "FREE" : "PAID"));
  };

  const embedCode = `<script type="text/javascript" data-integrity="${token}" src="${process.env.NEXT_PUBLIC_LEADSTOR_REST}/form-widget/composer.js"></script>`;

    if (deleted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[hsl(var(--destructive)/0.1)] flex items-center justify-center">
            <Trash2 size={20} className="text-[hsl(var(--destructive))]" />
          </div>
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">Form deleted</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
            This form is permanently removed. Entries already submitted through it remain on your lead dashboard.
          </p>
          <button onClick={() => router.push("/leads/settings")} className="text-sm font-medium text-[hsl(var(--primary))] hover:underline">
            Back to My Forms
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-sm text-[hsl(var(--muted-foreground))]">Loading form…</div>;
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#f5f6f8]">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[hsl(var(--border))] shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push("/leads/settings")} className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))]" title="Back to My Forms">
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-medium text-[hsl(var(--foreground))] truncate">{title || "Form Builder"}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => router.push(`/leads/forms/preview?token=${encodeURIComponent(token)}`)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]">
              <Eye size={15} /> Preview
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-60">
              <Save size={15} /> {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setView(view === "form" ? "settings" : "form")} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${view === "settings" ? "bg-[hsl(var(--muted))] border-[hsl(var(--border))]" : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"}`}>
              <SettingsIcon size={15} /> {view === "form" ? "Settings" : "Editor"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {view === "form" ? (
          <div className="space-y-5">
            <div className="bg-white rounded-lg border border-[hsl(var(--border))] p-4 space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Form title"
                className="w-full text-lg font-semibold border-0 p-0 focus:outline-none placeholder:text-[hsl(var(--muted-foreground))]"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Form description"
                className="w-full text-sm text-[hsl(var(--muted-foreground))] border-0 p-0 focus:outline-none placeholder:text-[hsl(var(--muted-foreground))]"
              />
            </div>

            <div className="space-y-3">
              {fields.map((f, idx) => {
                const columnLabel = columns.find((c) => c.value === f.name)?.label;
                return (
                  <div key={f._key} className="bg-white rounded-lg border border-[hsl(var(--border))] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[hsl(var(--muted)/0.5)] border-b border-[hsl(var(--border))]">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-[hsl(var(--foreground))]">Field {idx + 1}</span>
                        {columnLabel && (
                          <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-medium">
                            {columnLabel}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleRequired(f._key)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          f.isRequired === "required"
                            ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                            : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                        }`}
                        title="Toggle required"
                      >
                        <Star size={12} fill={f.isRequired === "required" ? "currentColor" : "none"} />
                        {f.isRequired === "required" ? "Required" : "Optional"}
                      </button>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={f.label}
                          onChange={(e) => updateField(f._key, { label: e.target.value })}
                          placeholder="Field label"
                          className="border border-[hsl(var(--border))] rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                        />
                        <select
                          value={f.input_type}
                          onChange={(e) => updateField(f._key, { input_type: e.target.value })}
                          className="border border-[hsl(var(--border))] rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                        >
                          <option value="NA">Select input type</option>
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="number">Number</option>
                          <option value="textarea">Textarea</option>
                          <option value="select">Dropdown</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={f.placeholder}
                          onChange={(e) => updateField(f._key, { placeholder: e.target.value })}
                          placeholder="Placeholder text"
                          className="border border-[hsl(var(--border))] rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                        />
                        <select
                          value={f.name}
                          onChange={(e) => updateField(f._key, { name: e.target.value })}
                          className="border border-[hsl(var(--border))] rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                        >
                          <option value="NA">Select column</option>
                          {columns.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>

                      <div className="flex items-center gap-1 pt-1 text-[hsl(var(--muted-foreground))]">
                        <button onClick={() => addFieldAfter(f._key)} className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]" title="Add field below"><Plus size={15} /></button>
                        <button onClick={() => duplicateFieldAfter(f._key)} className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]" title="Duplicate field"><Copy size={15} /></button>
                        <button onClick={() => moveField(f._key, -1)} className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]" title="Move up"><ArrowUp size={15} /></button>
                        <button onClick={() => moveField(f._key, 1)} className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]" title="Move down"><ArrowDown size={15} /></button>
                        <button onClick={() => deleteField(f._key)} className="p-1.5 rounded-md hover:bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] ml-auto" title="Delete field"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-lg border border-[hsl(var(--border))] p-4">
              <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Submit button text</label>
              <input
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Submit"
                className="w-full border border-[hsl(var(--border))] rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-white rounded-lg border border-[hsl(var(--border))] divide-y divide-[hsl(var(--border))]">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">Payment after form submission</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Requires a course/service field and a configured payment method</p>
                </div>
                <button
                  onClick={handlePaidToggle}
                  className={`w-10 h-6 rounded-full flex items-center transition-colors shrink-0 ml-4 ${isPaid === "PAID" ? "bg-[hsl(var(--primary))] justify-end" : "bg-[hsl(var(--muted))] justify-start"}`}
                >
                  <span className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
                </button>
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">ConceptNinjas footer</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Shown at the bottom of the public form</p>
                </div>
                <button
                  onClick={() => setFormFooter((prev) => (prev === "Hide" ? "Show" : "Hide"))}
                  className={`w-10 h-6 rounded-full flex items-center transition-colors shrink-0 ml-4 ${formFooter !== "Hide" ? "bg-[hsl(var(--primary))] justify-end" : "bg-[hsl(var(--muted))] justify-start"}`}
                >
                  <span className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[hsl(var(--border))] p-4">
              <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-1">Embed this form on your website</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">Paste this code between the body tags of your page, wherever you want the form to appear.</p>
              <code className="block bg-[hsl(var(--muted))] p-3 rounded-md text-xs font-mono break-all text-[hsl(var(--foreground))]">{embedCode}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(embedCode); toast.success("Copied to clipboard"); }}
                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
              >
                <Copy size={14} /> Copy to clipboard
              </button>
            </div>

            <div className="bg-white rounded-lg border border-[hsl(var(--destructive)/0.3)] p-4">
              <p className="text-sm font-medium text-[hsl(var(--destructive))] mb-1">Delete this form</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">This is permanent. Entries already submitted through it remain on your lead dashboard.</p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-sm rounded-md bg-[hsl(var(--destructive))] text-white hover:opacity-90 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete form"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}