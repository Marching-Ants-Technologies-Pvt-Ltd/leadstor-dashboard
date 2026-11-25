"use client";

import { useEffect, useRef, useState } from "react";
import Handsontable from "handsontable";
import { HotTable } from "@handsontable/react";
import { CopyPaste } from "handsontable/plugins/copyPaste";
import "handsontable/dist/handsontable.full.min.css";

import * as XLSX from "xlsx";

import { xFetch } from "@/utility/xFetch";
import Spinner from "@/components/common/Spinner";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/ReactToastify.min.css";
import { Corporate, Test, User } from "@/utility/TinyDB";
import { set } from "zod";

// Anything outside normal keyboard characters (emoji, Hindi, é, ₹, curly quotes, etc.)
const SPECIAL_CHAR_REGEX = /[^\x20-\x7E\t\r\n]/gu;

const findSpecialChars = (value) => {
  const matches = String(value ?? "").match(SPECIAL_CHAR_REGEX);
  return matches ? Array.from(new Set(matches)) : [];
};

const showValidationError = (message) =>
  toast.error(message, {
    autoClose: 12000,    // stays 12 seconds (default is 5)
    closeButton: true,   // cross to close it earlier
    closeOnClick: false, // clicking or selecting the text won't dismiss it
    pauseOnHover: true,  // timer pauses while the mouse is over it
    draggable: false,
  });

export default function AddLeadDynamic({ onClose, onRefreshTable }) {
  const corporate = Corporate || {};
  const test = Test || {};
  const user = User || {};

  const corporateId = corporate?._id;
  const testId = test?._id || null;

  const tableRef = useRef(null);

  const [fields, setFields] = useState([]); // dynamic columns metadata from /services/profile/columns or fallback
  const [data, setData] = useState([{}]); // array-of-objects rows (Handsontable will accept objects when columns.data is set)

  // dropdown sets used for validation
  const [sources, setSources] = useState([]);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [associatedCenters, setAssociatedCenters] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [loading, setLoading] = useState(false);
  const duplicateHighlightRef = useRef({});

  // register plugin client-side only
  useEffect(() => {
    try {
      Handsontable.plugins.registerPlugin(CopyPaste);
    } catch (e) {
      // plugin may be already registered; ignore
    }
  }, []);

  useEffect(() => {
    loadFields();
    loadDropdowns();
  }, []);

  async function loadFields() {
    try {
      const res = await xFetch({ path: "/services/profile/columns" });

      if (res && Array.isArray(res)) {
        // Remove unwanted items
        let filtered = res.filter(
          (f) => !["action", "updateTime", "leadProbability","courseMode"].includes(f.dataField)
        );

        // Ensure lastName exists; inject if missing (as requested earlier)
        const hasLastName = filtered.some((f) => String(f.dataField).toLowerCase() === "lastname");
        if (!hasLastName) {
          const lastNameField = {
            fieldId: "randornum",
            fieldName: "Last Name",
            displayName: "Last Name",
            dataField: "lastName",
            dataFormatter: "blankFormatter",
            fieldType: "text",
          };
          filtered.splice(1, 0, lastNameField); // insert at 2nd position
        }

        setFields(filtered);

        // create empty row mapped to filtered fields
        const empty = {};
        filtered.forEach((f) => {
          empty[f.dataField] = "";
        });

        setData([empty]);
      } else {
        toast.error("Unable to load fields. Using fallback.");
        const fallback = [
          { dataField: "firstName", displayName: "First Name" },
          { dataField: "lastName", displayName: "Last Name" },
          { dataField: "email", displayName: "Email Id" },
          { dataField: "mobile", displayName: "Mobile" },
        ];
        setFields(fallback);
        setData([fallback.reduce((a, f) => ((a[f.dataField] = ""), a), {})]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading fields");
    }
  }

  async function loadDropdowns() {
    try {
      const [src, crs, sts, usrs, ctgs, asct, pref, stl] = await Promise.all([
        xFetch({ path: `/services/profile/getSources?corporateId=${corporateId}` }),
        xFetch({ path: `/services/profile/getCourseAndFee?corporateId=${corporateId}` }),
        xFetch({ path: `/services/profile/getStatuses?corporateId=${corporateId}` }),
        xFetch({ path: `/services/profile/getUsers?corporateId=${corporateId}` }),
        xFetch({ path: `/services/profile/getCategories?corporateId=${corporateId}` }),
        xFetch({ path: `/services/profile/getAssociatedCenters?corporateId=${corporateId}` }),
        xFetch({ path: `/services/profile/getPreferredCourse?corporateId=${corporateId}` }),
        xFetch({ path: `/services/profile/getStudyLevel?corporateId=${corporateId}` }),
      ]);

      setSources(src || []);
      setCourses(crs || []);
      setStatuses(sts || []);
      setUsers(usrs || []);
      setCategories(ctgs || []);
      setAssociatedCenters(asct || []);
      setAdditionalInfo(pref || []);
      setQualifications(stl || []);
    } catch {
      toast.error("Failed loading dropdown values");
    }
  }

  // ---------- ADD ROW (fixed) ----------
  // Append an empty row to the `data` state and load into HOT.
  const addRow = () => {
    // Build empty row shape from fields
    const emptyRow = {};
    if (!fields || fields.length === 0) {
      // if fields not loaded, insert a generic row
      emptyRow["firstName"] = "";
      emptyRow["lastName"] = "";
      emptyRow["email"] = "";
      emptyRow["mobile"] = "";
    } else {
      fields.forEach((f) => {
        emptyRow[f.dataField] = "";
      });
    }

    setData((prev) => {
      const next = [...prev, emptyRow];
      // Immediately reflect in HOT instance
      const hot = tableRef.current?.hotInstance;
      try {
        if (hot) {
          hot.loadData(next);
          // focus/select the first cell of the new row (last row)
          const lastRowIndex = next.length - 1;
          // select first visible column (0)
          setTimeout(() => {
            try {
              hot.selectCell(lastRowIndex, 0);
              hot.render();
            } catch (e) {
              // ignore selection errors
            }
          }, 50);
        }
      } catch (e) {
        console.warn("Failed to loadData/selectCell after addRow:", e);
      }
      return next;
    });
  };

  /* ------------------------
     HANDSONTABLE COLUMNS
  ------------------------ */

  function getColumnDefinition(field) {
    switch (field.dataField) {
      case "source":
        return {
          data: field.dataField,
          type: "autocomplete",
          source: sources.map((s) => s.source),
          strict: false,
          allowInvalid: true,
        };

      case "category":
        return {
          data: field.dataField,
          type: "autocomplete",
          source: categories.map((c) => c.category),
          strict: false,
          allowInvalid: true,
        };

      case "associatedCenters":
        return {
          data: field.dataField,
          type: "autocomplete",
          source: associatedCenters.map((ac) => ac.associatedCenter),
          strict: false,
          allowInvalid: true,
        };

      case "additional_info":
        return {
          data: field.dataField,
          type: "autocomplete",
          source: additionalInfo.map((ac) => ac.course),
          strict: false,
          allowInvalid: true,
        };

      case "qualification":
        return {
          data: field.dataField,
          type: "autocomplete",
          source: qualifications.map((ac) => ac.qualification),
          strict: false,
          allowInvalid: true,
        };
        
      
      case "course":
        return {
          data: field.dataField,
          type: "autocomplete",
          source: courses.map((c) => c.course),
          strict: false,
        };

      case "status":
        return {
          data: field.dataField,
          type: "autocomplete",
          source: statuses.map((s) => s.status),
          strict: false,
        };

      case "assignedUserId":
        return {
          data: field.dataField,
          type: "autocomplete",
          source: users.map((u) => u.name),
          strict: false,
        };
      
      // changes
      case "createdDate":
      return {
        data: field.dataField,
        type: "text",
        validator: function(value, callback) {
          callback(normalizeEnquiryTime(value).ok);
        },
        allowInvalid: false,
      };
      default:
        return {
          data: field.dataField,
          type: field.dataType || "text",
        };
    }
  }

  const getOwnerIdByName = (name) => {
    if (!name) return "";
    const match = users.find(
      (u) => u.name?.toLowerCase() === String(name).toLowerCase()
    );
    return match?.id || "";
  };

  // hotColumns uses `data` keys so loading array-of-objects will work correctly
  const hotColumns = fields.map((f) => {
    const fld = {};
    fld.data = f.dataField;
    if (f.fieldType && String(f.fieldType).toLowerCase() === "dropdown") {
      fld.type = "dropdown";
      fld.source = f.options || [];
    } else if (f.fieldType && String(f.fieldType).toLowerCase() === "autocomplete") {
      fld.type = "autocomplete";
      fld.source = f.options || [];
    } else {
      // allow override by getColumnDefinition for known fields
      const def = getColumnDefinition(f);
      fld.type = def.type || "text";
      if (def.source) fld.source = def.source;
    }
    fld.width = 160;
    return fld;
  });

  const columns = fields.map((f) => ({
    width: 150,
    ...getColumnDefinition(f),
  }));

  const colHeaders = fields.map(
    (f) => f.displayName || f.fieldName
  );
  /* ---------- Helpers: validators like old code ---------- */

  // More robust email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const makeMobileRegex = () => {
    const cc = corporate?.country_code || "IN";
    if (cc !== "IN") {
      return /^(.+)?$/im; // relaxed (fallback)
    } else {
      return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
    }
  };

  const isValidEmail = (v) => {
    if (!v || v === "") return true; // empty is allowed (will be caught by duplicate check if both email & mobile empty)
    const trimmed = String(v).trim();
    if (trimmed.length > 254) return false;
    return emailRegex.test(trimmed);
  };

  /* ---------- Utilities ---------- */

  const getHeaderNames = () => fields.map((f) => f.fieldName ?? f.displayName);
  const getFieldOrder = () => fields.map((f) => f.dataField);

  const findIndexForHeader = (names, predicate) => {
    for (let i = 0; i < names.length; i++) {
      const t = String(names[i] || "").toLowerCase();
      if (predicate(t)) return i;
    }
    return -1;
  };

  const chunkArray = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  /* ---------- Excel Import (XLSX) ---------- */

  const ENQUIRY_TIME_FORMAT_MESSAGE =
    "Enquiry Time must be DD-MM-YY HH:MM or DD-MM-YY HH:MM:SS";

  const normalizeEnquiryTime = (value) => {
    if (value === null || value === undefined || String(value).trim() === "") {
      return { ok: true, value: "" };
    }

    const trimmed = String(value).trim();
    const match = trimmed.match(
      /^(\d{2})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/
    );

    if (!match) {
      return { ok: false, value: trimmed };
    }

    const [, day, month, year, hour, minute, second = "00"] = match;
    const dayNum = Number(day);
    const monthNum = Number(month);
    const fullYear = 2000 + Number(year);
    const hourNum = Number(hour);
    const minuteNum = Number(minute);
    const secondNum = Number(second);
    const parsed = new Date(fullYear, monthNum - 1, dayNum, hourNum, minuteNum, secondNum);

    const isValidDate =
      parsed.getFullYear() === fullYear &&
      parsed.getMonth() === monthNum - 1 &&
      parsed.getDate() === dayNum &&
      parsed.getHours() === hourNum &&
      parsed.getMinutes() === minuteNum &&
      parsed.getSeconds() === secondNum;

    if (!isValidDate) {
      return { ok: false, value: trimmed };
    }

    return { ok: true, value: `${day}-${month}-${year} ${hour}:${minute}:${second}` };
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info("Reading Excel…");

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

      if (!rows.length) {
        toast.error("The sheet is empty!");
        return;
      }

      const sheetHeaders = Object.keys(rows[0]).map((h) => h.trim().toLowerCase());
      const hasEmail = sheetHeaders.some((h) => h.includes("mail"));
      const hasMobile = sheetHeaders.some((h) => h.includes("mobile") || h.includes("phone"));

      if (!hasEmail && !hasMobile) {
        toast.error('Excel must contain an "Email" or "Mobile" column.');
        return;
      }

      // Build rows mapped to your fields (array of objects)
      const newRows = [];

      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const obj = {};

        fields.forEach((f) => {
          const df = f.dataField;
          const candidates = [f.displayName, f.fieldName, f.dataField]
            .filter(Boolean)
            .map((s) => String(s).toLowerCase());

          let matchedHeader = null;
          for (const hdr of Object.keys(row)) {
            const lower = hdr.toLowerCase();
            if (candidates.some((c) => lower.includes(c))) {
              matchedHeader = hdr;
              break;
            }
          }

          const rawValue = matchedHeader ? row[matchedHeader] : "";
          if (df === 'createdDate') {
            const normalized = normalizeEnquiryTime(rawValue);
            if (!normalized.ok) {
              toast.error(
                `Row ${rowIndex + 2}: Invalid Enquiry Time "${normalized.value}". ${ENQUIRY_TIME_FORMAT_MESSAGE}`
              );
              throw new Error("INVALID_ENQUIRY_TIME");
            }
            obj[df] = normalized.value;
          } else {
            obj[df] = rawValue;
          }
        });
        newRows.push(obj);
      }

      // Load into Handsontable as array-of-objects (columns have data keys)
      const hot = tableRef.current?.hotInstance;
      if (hot) {
        hot.loadData(newRows);
      }

      // Sync React state (important for submit)
      setData(newRows.length ? newRows : [fields.reduce((a, f) => ((a[f.dataField] = ""), a), {})]);

      toast.success("Excel imported! Please review before submitting.");
    } catch (err) {
      if (err?.message === "INVALID_ENQUIRY_TIME") {
        return;
      }
      console.error(err);
      toast.error("Failed to import Excel.");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  // Normalize mobile: remove whitespace, parentheses, dashes, dots; keep leading + if present
  const normalizeMobile = (raw) => {
    if (!raw) return "";
    const str = String(raw).trim();
    if (!str) return "";

    let hadPlus = str.startsWith("+");
    let digits = str.replace(/[^\d]/g, "");

    // Optional: remove leading 0 only if it looks like Indian local number
    if (!hadPlus && digits.startsWith("0") && digits.length === 11) {
      digits = digits.slice(1);
    }

    return hadPlus ? "+" + digits : digits;
  };

  const isValidMobile = (raw, countryCode = "IN") => {
    if (!raw || String(raw).trim() === "") return true;

    const cleaned = normalizeMobile(raw);
    if (!cleaned) return false;

    const pureDigits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;

    // Accept 8–15 digits (very common international rule of thumb)
    return pureDigits.length >= 8 && pureDigits.length <= 15;
  };

  /**
 * Validates all rows in the Handsontable grid before submission.
 * - Checks required fields (e.g., First Name)
 * - Ensures at least one of Email or Mobile is provided and valid
 * - Validates format of Email and Mobile
 * - Validates dropdown/autocomplete fields against allowed values
 * - Highlights invalid cells with red background
 * 
 * @returns {Promise<{ ok: boolean, message?: string, emails: string[], phones: string[], raw: any[] }>}
 */
  const validateHotData = async () => {
    const hot = tableRef.current?.hotInstance;
    if (!hot) {
      return { ok: false, message: "Table instance not ready" };
    }

    const headerNames = getHeaderNames(); // array of display names / field names
      console.log(headerNames);
    // Robust column index detection (case-insensitive partial matching)
    const findCol = (keywords) => {
      const lowerKeywords = keywords.map(k => k.toLowerCase());
      return findIndexForHeader(headerNames, (t) =>
        lowerKeywords.some(kw => t.toLowerCase().includes(kw))
      );
    };

    // const emailCol   = findCol(["email", "mail", "e-mail"]);
    // const mobileCol  = findCol(["mobile", "phone", "contact", "number", "cell", "whatsapp"]);
    // const firstNameCol = findCol(["first name", "firstname", "first"]);
    // const lastNameCol  = findCol(["last name", "lastname", "last"]);
    // const sourceCol    = findCol(["source"]);
    // const courseCol    = findCol(["course"]);
    // const ownerCol     = findCol(["owner", "assigned", "assigned user", "user"]);
    // const statusCol    = findCol(["status"]);

    // 1. Create a lookup: dataField → semantic column type
    const columnTypes = {};

    fields.forEach((field, colIndex) => {
      const df = field?.dataField?.toLowerCase();

      if (!df) return;

      if (df.includes("email") || df === "email") {
        columnTypes.email = colIndex;
      }
      else if (["mobile", "phone"].includes(df)) {
        columnTypes.mobile = colIndex;
      }
      else if (["firstname", "first_name", "fname", "first"].some(k => df.includes(k))) {
        columnTypes.firstName = colIndex;
      }
      else if (["lastname", "last_name", "lname", "last"].some(k => df.includes(k))) {
        columnTypes.lastName = colIndex;
      }
      else if (df.includes("source")) {
        columnTypes.source = colIndex;
      }
      else if (df.includes("category")) {
        columnTypes.category = colIndex;
      }
      else if (df.includes("associatedCenter")) {
        columnTypes.associatedCenter = colIndex;
      }
      else if (df.includes("course") || df === "preferredcourse" || df === "additionalinfo") {
        // ────────────── important part ──────────────
        columnTypes.course = colIndex;
      }
      else if (["owner", "assignedto", "assigned_user", "userid", "assigned"].some(k => df.includes(k))) {
        columnTypes.owner = colIndex;
      }
      else if (df.includes("status")) {
        columnTypes.status = colIndex;
      }
      else if (df === "createddate") {
        columnTypes.createdDate = colIndex;
      }
    });

    // 2. Now use these instead of findCol()
    const emailCol    = columnTypes.email    ?? -1;
    const mobileCol   = columnTypes.mobile   ?? -1;
    const firstNameCol = columnTypes.firstName ?? -1;
    const lastNameCol  = columnTypes.lastName ?? -1;
    const sourceCol    = columnTypes.source   ?? -1;
    const categoryCol = columnTypes.category ?? -1;
    const associatedCenterCol = columnTypes.associatedCenter ?? -1;
    const courseCol    = columnTypes.course   ?? -1;
    const ownerCol     = columnTypes.owner    ?? -1;
    const statusCol    = columnTypes.status   ?? -1;
    const createdDateCol = columnTypes.createdDate ?? -1;

    const raw = hot.getSourceData(); // array of objects (since data is array-of-objects)

    // Clear all previous validation highlights
    for (let r = 0; r < raw.length; r++) {
      for (let c = 0; c < fields.length; c++) {
        hot.setCellMeta(r, c, "className", "");
      }
    }
    hot.render();

    // Special character check (these rows break the import)
    const specialRows = [];
    for (let r = 0; r < raw.length; r++) {
      const row = raw[r] || {};
      const badCells = [];
      fields.forEach((f, c) => {
        const found = findSpecialChars(row[f.dataField]);
        if (found.length > 0) {
          badCells.push({ label: f.fieldName ?? f.displayName ?? f.dataField, chars: found });
          hot.setCellMeta(r, c, "className", "htInvalid");
        }
      });
      if (badCells.length > 0) specialRows.push({ row: r + 1, badCells });
    }

    if (specialRows.length > 0) {
      hot.render();
      return {
        ok: false,
        message: (
          <div>
            <strong>{specialRows.length} row(s) contain special characters</strong>
            <div>
              Emoji, non-English letters or symbols are not supported. Please correct
              the highlighted cells and import again.
            </div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18, textAlign: "left", maxHeight: 240, overflowY: "auto" }}>
              {specialRows.slice(0, 10).map(({ row, badCells }) => (
                <li key={row}>
                  Row {row}: {badCells.map((b) => `${b.label} (${b.chars.join(" ")})`).join(", ")}
                </li>
              ))}
              {specialRows.length > 10 && <li>...and {specialRows.length - 10} more row(s)</li>}
            </ul>
          </div>
        ),
      };
    }

    const emails = [];
    const phones = [];
    const countryCode = (corporate?.country_code || "IN").toUpperCase();

    for (let r = 0; r < raw.length; r++) {
      const row = raw[r];

      // Skip completely empty rows
      if (Object.values(row).every(v => !String(v ?? "").trim())) {
        continue;
      }

      // 2. Get raw values
      const emailRaw  = emailCol  >= 0 ? String(row[fields[emailCol]?.dataField]  ?? "").trim() : "";
      const mobileRaw = mobileCol >= 0 ? String(row[fields[mobileCol]?.dataField] ?? "").trim() : "";

      // Normalize mobile early
      const mobileNorm = normalizeMobile(mobileRaw);

      const hasValidEmail  = emailRaw !== "" && isValidEmail(emailRaw);
      const hasValidMobile = mobileNorm !== "" && isValidMobile(mobileNorm, countryCode);

      // 3. At least one of email or mobile must be valid
      if (!hasValidEmail && !hasValidMobile) {
        if (emailCol  >= 0) hot.setCellMeta(r, emailCol,  "className", "htInvalid");
        if (mobileCol >= 0) hot.setCellMeta(r, mobileCol, "className", "htInvalid");
        hot.render();
        return {
          ok: false,
          message: `Row ${r + 1}: Either a valid Email or a valid Mobile number must be provided`,
        };
      }
      console.log({ emailRaw, mobileRaw, mobileNorm, hasValidEmail, hasValidMobile });
      // 4. If email is provided → must be valid
      if (emailRaw !== "" && !isValidEmail(emailRaw)) {
        hot.setCellMeta(r, emailCol, "className", "htInvalid");
        hot.render();
        return {
          ok: false,
          message: `Row ${r + 1}: Invalid Email format → ${emailRaw}`,
        };
      }

      // 5. If mobile is provided → must be valid
      if (mobileRaw !== "" && !isValidMobile(mobileRaw, countryCode)) {
        hot.setCellMeta(r, mobileCol, "className", "htInvalid");
        hot.render();
        return {
          ok: false,
          message: `Row ${r + 1}: Invalid Mobile format → ${mobileRaw}\n(For India: 10 digits starting with 6-9)`,
        };
      }

      // Collect valid values for duplicate check
      if (hasValidEmail)  emails.push(emailRaw.toLowerCase());
      if (hasValidMobile) phones.push(mobileNorm);

      if (createdDateCol >= 0) {
        const dateField = fields[createdDateCol]?.dataField;
        const enquiryTimeRaw = row[dateField] ?? "";
        const normalized = normalizeEnquiryTime(enquiryTimeRaw);

        if (!normalized.ok) {
          hot.setCellMeta(r, createdDateCol, "className", "htInvalid");
          hot.render();
          return {
            ok: false,
            message: `Row ${r + 1}: Invalid Enquiry Time "${normalized.value}". ${ENQUIRY_TIME_FORMAT_MESSAGE}`,
          };
        }

        if (String(enquiryTimeRaw ?? "").trim() !== normalized.value) {
          hot.setDataAtCell(r, createdDateCol, normalized.value, "normalizeEnquiryTime");
          row[dateField] = normalized.value;
        }
      }

      // 6. Optional: Validate dropdown / autocomplete fields
      // if (sourceCol >= 0) {
      //   const val = String(row[fields[sourceCol]?.dataField] ?? "").trim();
      //   if (val && !sources.some(s => s.source?.toLowerCase() === val.toLowerCase())) {
      //     hot.setCellMeta(r, sourceCol, "className", "htInvalid");
      //     hot.render();
      //     return {
      //       ok: false,
      //       message: `Row ${r + 1}: Invalid Source → ${val}`,
      //     };
      //   }
      // }

      // if (courseCol >= 0) {
      //   const val = String(row[fields[courseCol]?.dataField] ?? "").trim();
      //   if (val && !courses.some(c => c.course?.toLowerCase() === val.toLowerCase())) {
      //     hot.setCellMeta(r, courseCol, "className", "htInvalid");
      //     hot.render();
      //     return {
      //       ok: false,
      //       message: `Row ${r + 1}: Invalid Course → ${val}`,
      //     };
      //   }
      // }

      if (ownerCol >= 0) {
        const val = String(row[fields[ownerCol]?.dataField] ?? "").trim();
        if (val && !users.some(u => u.name?.toLowerCase() === val.toLowerCase())) {
          hot.setCellMeta(r, ownerCol, "className", "htInvalid");
          hot.render();
          return {
            ok: false,
            message: `Row ${r + 1}: Invalid Assigned User / Owner → ${val}`,
          };
        }
      }

      if (statusCol >= 0) {
        const val = String(row[fields[statusCol]?.dataField] ?? "").trim();
        if (val && !statuses.some(s => s.status?.toLowerCase() === val.toLowerCase())) {
          hot.setCellMeta(r, statusCol, "className", "htInvalid");
          hot.render();
          return {
            ok: false,
            message: `Row ${r + 1}: Invalid Status → ${val}`,
          };
        }
      }
    }

    // All rows passed validation
    return {
      ok: true,
      emails,
      phones,
      raw,
    };
  };

  async function checkDuplicatesBackend(emails = [], phones = []) {
    if ((!emails || emails.length === 0) && (!phones || phones.length === 0)) {
      return { ok: true, message: "Nothing to check", items: [] };
    }
    try {
      // Normalize phones: ensure all are 10-digit format for consistent duplicate checking
      const normalizedPhones = phones.map(p => {
        let digits = String(p).replace(/\D/g, "");
        // Remove leading 91 if present
        if (digits.startsWith("91") && digits.length === 12) {
          digits = digits.slice(2);
        }
        // Remove leading 0 if present
        if (digits.startsWith("0")) {
          digits = digits.slice(1);
        }
        return digits;
      });

      const payload = { 
        emails: emails.join(","), 
        phones: normalizedPhones.join(","), 
        testId: testId || "" 
      };

      const res = await xFetch({ 
        method: "POST", 
        path: "/services/invite/checkDuplicatesOnManualImport", 
        payload 
      });
      
      if (!res) {
        return { ok: false, message: "Duplicate check failed - no response from server", items: [] };
      }
      
      if (res.error) {
        return { ok: false, message: res.error || "Duplicates error", items: res.items || [] };
      }
      
      return { 
        ok: true, 
        message: res.message || "Duplicates checked", 
        items: res.items || [],
        duplicateEmails: res.duplicateEmails || [],
        duplicatePhones: res.duplicatePhones || []
      };
    } catch (err) {
      console.error("Duplicate check failed", err);
      return { ok: false, message: "Unable to check duplicates - server error", items: [] };
    }
  }

  const highlightDuplicateInTable = (duplicates = [], emailColIndex, phoneColIndex) => {
    const hot = tableRef.current?.hotInstance;
    if (!hot || !duplicates || duplicates.length === 0) return 0;

    let matched = 0;
    const duplicateRows = new Set();
    const nextHighlightMap = {};
    const raw = hot.getData();

    // Create a Set for faster lookup
    const duplicateSet = new Set(duplicates.map(d => String(d).toLowerCase()));

    for (let r = 0; r < raw.length; r++) {
      const row = raw[r];
      
      // Check email
      if (emailColIndex >= 0) {
        const email = typeof row === "object" && !Array.isArray(row) 
          ? String(row[fields[emailColIndex]?.dataField] ?? "").trim().toLowerCase()
          : String(row[emailColIndex] ?? "").trim().toLowerCase();
        
        if (email && duplicateSet.has(email)) {
          matched++;
          duplicateRows.add(r);
          nextHighlightMap[`${r}:${emailColIndex}`] = true;
          hot.setCellMeta(r, emailColIndex, "className", "htInvalid");
        }
      }
      
      // Check phone
      if (phoneColIndex >= 0) {
        const rawPhone = typeof row === "object" && !Array.isArray(row)
          ? String(row[fields[phoneColIndex]?.dataField] ?? "")
          : String(row[phoneColIndex] ?? "");
        
        // Normalize phone for comparison
        let phoneDigits = String(rawPhone).replace(/\D/g, "");
        if (phoneDigits.startsWith("91") && phoneDigits.length === 12) {
          phoneDigits = phoneDigits.slice(2);
        }
        if (phoneDigits.startsWith("0")) {
          phoneDigits = phoneDigits.slice(1);
        }
        
        if (phoneDigits && duplicateSet.has(phoneDigits)) {
          matched++;
          duplicateRows.add(r);
          nextHighlightMap[`${r}:${phoneColIndex}`] = true;
          hot.setCellMeta(r, phoneColIndex, "className", "htInvalid");
        }
      }
    }
    duplicateHighlightRef.current = nextHighlightMap;
    hot.render();
    return matched;
  };

  const preparePayloadChunks = (rawData) => {
    const chunks = [];
    const chunkSize = 150;

    // convert objects to arrays according to field order if needed
    const order = getFieldOrder();
    const filtered = rawData
      .map((row) => (Array.isArray(row) ? row : order.map((k) => row[k] ?? "")))
      .filter((rowArr) => !rowArr.every((c) => c === null || c === undefined || String(c).trim() === ""));

    for (let i = 0; i < filtered.length; i += chunkSize) {
      chunks.push(filtered.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const waitForNextPaint = () =>
    new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

  const processManualImport = async (c) => {
      const hot = tableRef.current?.hotInstance;
      if (!hot) {
        toast.error("Table not ready!");
        return;
      }

      // Step 1: Validation (existing logic)
      const validation = await validateHotData();
      if (!validation.ok) {
        showValidationError(validation.message);
        return;
      }

      const rawRows = validation.raw;

      // Step 2: Remove completely empty rows
      const cleanedRows = rawRows.filter((row) =>
        Object.values(row).some((v) => String(v).trim() !== "")
      );

      if (cleanedRows.length === 0) {
        toast.error("No valid rows to import!");
        return;
      }

      // Step 3: Convert to "dataField → value" objects
      const contacts = cleanedRows.map((row) => {
        const obj = {};
        fields.forEach((f) => {
          const rawValue = row[f.dataField] ?? "";
          obj[f.dataField] =
            f.dataField === "createdDate"
              ? normalizeEnquiryTime(rawValue).value
              : rawValue;

          if (f.dataField === "assignedUserId") {
            obj[f.dataField] = getOwnerIdByName(row[f.dataField] ?? "");
          }

        });
        return obj;
      });

      // Step 4: Chunking contacts (like previous logic)
      const CHUNK_SIZE = 100;
      const chunks = [];
      for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
        chunks.push(contacts.slice(i, i + CHUNK_SIZE));
      }

      // Step 5: Submit each chunk to Add Enquiry API
      let successCount = 0;
      let totalSent = 0;
      
      for (let i = 0; i < chunks.length; i++) {
        
        const chunk = chunks[i];
        totalSent += chunk.length;
        const toDefer = totalSent > 600;

        const formData = new FormData();
        formData.append("contacts", btoa(JSON.stringify(chunk)));
        formData.append("testId", testId || "");
        formData.append("manual", true);
        formData.append("toDefer", toDefer);
        formData.append("owner", User?._id || "");
        formData.append("roleName", User?.role || "");

        setLoading(true);
        try {
          const res = await xFetch({
            path: "/services/invite/sendTestInvitationEmail",
            method: "POST",
            payload: formData,
            isFormData:true,
          });

          if (res?.status == 'success') {
            successCount += chunks[i].length;
            toast.success(`Uploaded chunk ${i + 1}/${chunks.length}`);
            toast.success(`Successfully imported ${successCount} Leads`);
            onRefreshTable?.();
            onClose?.();

          } else {
            toast.error(`Chunk ${i + 1} failed`);
          }
        } catch (err) {
          console.error("Chunk Upload Error", err);
          toast.error(`Chunk ${i + 1} failed!`);
        } finally {
          setLoading(false); // 👉 STOP LOADER ALWAYS
        }
      }
  }

  const submitLeads = async () => {
    try {
      const hot = tableRef.current?.hotInstance;
      if (!hot) {
        toast.error("Table not ready");
        return;
      }

      const validation = await validateHotData();
      if (!validation.ok) {
        showValidationError(validation.message);
        return;
      }

      const headerNames = getHeaderNames();
      const emailCol = findIndexForHeader(headerNames, (t) => t.includes("mail"));
      const phoneCol = findIndexForHeader(headerNames, (t) => t.includes("bile") || t.includes("hone"));

      const { emails = [], phones = [], raw } = validation;
      
      // Always run duplicate check if we have emails or phones
      const dupRes = await checkDuplicatesBackend(emails, phones);
      
      if (!dupRes.ok) {
        // Server error or validation failed
        const duplicates = dupRes.items || [];
        if (duplicates.length > 0) {
          // Duplicates found - highlight and ask user
          const matchedCount = highlightDuplicateInTable(duplicates, emailCol, phoneCol);
          const msg = dupRes.message || `${matchedCount} duplicate(s) found.`;

          // Let Handsontable paint the red cells before the native confirm dialog blocks the UI.
          await waitForNextPaint();

          const ok = window.confirm(`${msg} Would you like to proceed and import anyway?`);
          if (!ok) {
            toast.info("Import aborted due to duplicates.");
            return;
          }
        } else {
          // Actual error - no duplicates but check failed
          toast.error(dupRes.message || "Duplicate check failed");
          return;
        }
      }

      const rawData = hot.getData();
      const chunks = preparePayloadChunks(rawData);

      if (chunks.length === 0) {
        toast.error("No valid rows to upload.");
        return;
      }

      await processManualImport(chunks);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to add enquiries");
    }
  };

  // When `data` (array of objects) changes we load into HOT so UI stays in sync
  useEffect(() => {
    const hot = tableRef.current?.hotInstance;
    if (hot && Array.isArray(data)) {
      try {
        hot.loadData(data);
      } catch (e) {
        console.warn("hot.loadData failed in useEffect:", e);
      }
    }
  }, [data, fields]);

  const downloadTemplate = async () => {
    try {
      toast.info("Preparing template…");

      const res = await xFetch({
        path: "/services/invite/exportTemplate",
        method: "POST",
        payload: {
          columns: colHeaders,
        },
        responseType: "blob",
      });

      if (!res) {
        toast.error("Failed to download file");
        return;
      }

      const blob = new Blob([res], { type: "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Leads-Enquiry-Template-${Corporate?._id}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Error downloading template");
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 px-4 py-3 flex flex-col">

      <ToastContainer position="top-right" />

      {/* MAIN CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm 
                p-4 flex flex-col">

        {/* HEADER + ACTIONS */}
        <div className="flex items-start justify-between mb-2 shrink-0">

          {/* TITLE */}
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Add Enquiry
            </h2>
            <p className="text-[11px] text-slate-500">
              Fast multi-lead entry. Use Tab to move across fields quickly.
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Note: Enquiry Time format must be DD-MM-YY HH:MM or DD-MM-YY HH:MM:SS
              (Example: 10-06-26 11:07:00)
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Back */}
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-full text-xs
                bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              ← Back
            </button>

            {/* Download Excel */}
            <button
              onClick={downloadTemplate}
              className="px-3 py-1 rounded-full text-xs font-medium
                bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
            >
              ⬇ Download Excel
            </button>

            {/* Import Excel */}
            <label
              className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer
                bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
            >
              ⬆ Import Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportExcel}
              />
            </label>

            {/* Add Row */}
            <button
              onClick={addRow}
              className="px-3 py-1 rounded-full text-xs font-medium
                bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
            >
              ＋ Add Row
            </button>

            {/* Save */}
            <button
              onClick={submitLeads}
              disabled={loading}
              className="px-4 py-1 rounded-full text-xs font-semibold
                bg-blue-600 text-white hover:bg-blue-700
                disabled:opacity-60 transition"
            >
              {loading ? "Saving..." : "Save Enquiries"}
            </button>

          </div>
        </div>

        {/* TABLE CONTAINER (RESPONSIVE HEIGHT) */}
        <div
            className="
              border border-slate-200 rounded-xl overflow-hidden
              h-[calc(100vh-260px)]
              min-h-[300px]
              max-h-[75vh]
              
              sm:h-[calc(100vh-240px)]
              md:h-[calc(100vh-220px)]
              lg:h-[calc(100vh-200px)]
              xl:h-[calc(100vh-180px)]
            "
          >
          <HotTable
            ref={tableRef}
            className="custom-hot"
            data={data}
            colHeaders={colHeaders}
            columns={columns}
            rowHeaders={true}
            licenseKey="non-commercial-and-evaluation"
            afterValidate={(isValid, value, row, prop) => {
              if (!isValid && prop === "createdDate") {
                toast.error(`${ENQUIRY_TIME_FORMAT_MESSAGE} e.g. 18-06-26 14:30:00`);
              }
            }}
            copyPaste={{
              copyPasteEnabled: true,
              rowsLimit: 10000,
              columnsLimit: fields.length || 100
            }}
            pasteMode="shift_down"
            manualColumnResize
            manualRowResize
            contextMenu={[
              "copy",
              "paste",
              "remove_row",
              "row_above",
              "row_below",
              "insert_row"
            ]}
            fillHandle={true}
            stretchH="all"
            minSpareRows={0}
            allowInsertRow={false}
            autoWrapRow={false}
            autoWrapCol={false}
            afterRenderer={(td, row, col) => {
              if (!td) return;
              const key = `${row}:${col}`;
              const shouldHighlight = !!duplicateHighlightRef.current[key];

              td.classList.toggle("htInvalid", shouldHighlight);
            }}
            afterChange={(changes) => {
              if (!changes) return;
              const hot = tableRef.current?.hotInstance;
              if (!hot) return;

              changes.forEach(([row, prop]) => {
                const colIndex =
                  typeof prop === "number" ? prop : hot.propToCol(prop);
                hot.setCellMeta(row, colIndex, "className", "");
                delete duplicateHighlightRef.current[`${row}:${colIndex}`];
              });

              hot.render();
            }}
          />
        </div>
      </div>

      {/* HANDSONTABLE STYLES */}
      <style jsx>{`
        :global(.htInvalid) {
          background: #ffe6e6 !important;
        }

        :global(.custom-hot .ht_clone_top th),
        :global(.custom-hot th) {
          background: #f8fafc !important;
          color: #475569 !important;
          font-size: 12px !important;
          font-weight: 600;
        }

        :global(.custom-hot td) {
          background: #ffffff !important;
          font-size: 12px !important;
        }
      `}</style>
    </div>
  );

}
