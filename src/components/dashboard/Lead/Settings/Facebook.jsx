import React, { useEffect, useState, useMemo, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { xFetch } from "@/utility/xFetch";
import { Search } from "lucide-react";
import { Corporate } from "@/utility/TinyDB";

/* ---------- API endpoints ---------- */
const API = {
  getSubscribedForms: "/services/facebook/getSubscribedForms",
  getConceptNinjasFields: "/services/facebook/conceptninjasFields",
  subscribeFBPage: "/services/facebook/subscribeFBPage",
  updateSubscription: "/services/facebook/updateSubscription",
  deleteSubscribeForm: "/services/facebook/deleteSubscribeForm",
  getMappedFields: "/services/facebook/getMappedFields",
  getExtendedUserToken: "/services/facebook/getExtendedUserToken",
};

/* ---------- Unified Facebook Auth Button (Login + Logout) ---------- */
function FacebookAuthButton({ status, onSuccess, onLogout }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!window.FB) {
      toast.error("Facebook SDK not loaded");
      return;
    }

    setLoading(true);

    window.FB.login(
      (response) => {
        setLoading(false);

        console.log("LOGIN RESPONSE =>", response);

        if (response.status === "connected") {

          const accessToken = response.authResponse.accessToken;

          // CHECK USER INFO
          window.FB.api(
            "/me",
            { access_token: accessToken },
            (res) => {
              console.log("USER =>", res);
            }
          );

          // CHECK PERMISSIONS
          window.FB.api(
            "/me/permissions",
            { access_token: accessToken },
            (res) => {
              console.log("PERMISSIONS =>", res);
            }
          );

          // CHECK PAGES
          window.FB.api(
            "/me/accounts",
            { access_token: accessToken },
            (res) => {
              console.log("PAGES =>", res);
            }
          );

          toast.success("Logged in successfully");
          onSuccess?.();

        } else {
          toast.error("Login cancelled or failed");
        }
      },
      {
        scope:
          "public_profile,pages_show_list,pages_manage_metadata,pages_read_engagement,leads_retrieval,business_management,pages_manage_ads",
        auth_type: "rerequest",
      }
    );
  };

  const handleLogout = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast.info("Disconnected successfully");
      onLogout?.();
    }, 300);
  };

  const isConnected = status?.status === "connected";

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700 font-medium">Connected to Facebook</span>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 transition disabled:opacity-50"
        >
          {loading ? "Logging out..." : "Logout"}
        </button>
      </div>
    );
  }

  return (
    <button
      className="px-4 py-2 bg-[#1877F2] text-white rounded shadow hover:bg-[#145FCC] transition"
      onClick={handleLogin}
      disabled={loading}
    >
      {loading ? "Connecting..." : "Continue with Facebook / Instagram"}
    </button>
  );
}

/* ---------- SDK Loader Hook ---------- */
function useFacebookSDK(appId = "354120981351314", version = "v19.0") {
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (window.FB) {
      setLoaded(true);
      return;
    }

    window.fbAsyncInit = () => {
      try {
        window.FB.init({
          appId,
          autoLogAppEvents: true,
          xfbml: true,
          version,
        });
      } catch (err) {
        console.error("FB.init failed", err);
      }

      window.FB.getLoginStatus((resp) => {
        setStatus(resp);
      });
      setLoaded(true);
    };

    const id = "facebook-jssdk";
    if (document.getElementById(id)) return;

    const js = document.createElement("script");
    js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js"; // ← fixed locale
    document.head.appendChild(js);
  }, [appId, version]);

  const refreshStatus = useCallback((callback) => {
    if (!window.FB) return callback?.(null);
    window.FB.getLoginStatus((resp) => {
      setStatus(resp);
      callback?.(resp);
    });
  }, []);

  return { loaded, status, refreshStatus };
}

/* ---------- API wrappers ---------- */
const facebookApi = {
  fetchSubscribedForms: (corporateId, pages) =>
    xFetch({
      path: API.getSubscribedForms,
      method: "POST",
      payload: { pages },
    }).catch((err) => {
      console.error("fetchSubscribedForms error:", err);
      throw err;
    }),

  fetchCNFields: () =>
    xFetch({
      path: API.getConceptNinjasFields,
      method: "GET",
    }).catch((err) => {
      console.error("fetchCNFields error:", err);
      throw err;
    }),

  subscribe: (payload) =>
    xFetch({
      path: API.subscribeFBPage,
      method: "POST",
      payload,
      isFormData: true,
    }).catch((err) => {
      console.error("subscribe error:", err);
      throw err;
    }),

  updateSubscription: (payload) =>
    xFetch({
      path: API.updateSubscription,
      method: "POST",
      payload,
      isFormData: true,
    }).catch((err) => {
      console.error("updateSubscription error:", err);
      throw err;
    }),

  deleteSubscription: (formTableId) =>
    xFetch({
      path: API.deleteSubscribeForm,
      method: "POST",
      payload: { form_table_id: formTableId },
    }).catch((err) => {
      console.error("deleteSubscription error:", err);
      throw err;
    }),

  getMappedFields: (corporateId, pageId, formId) =>
    xFetch({
      path: API.getMappedFields,
      method: "POST",
      payload: { corporateId, pageId, formId },
    }).catch((err) => {
      console.error("getMappedFields error:", err);
      throw err;
    }),

  getExtendedToken: (userToken) =>
    xFetch({
      path: `${API.getExtendedUserToken}?userToken=${userToken}`,
      method: "GET",
    }).catch((err) => {
      console.error("getExtendedToken error:", err);
      throw err;
    }),
};

/* ---------- Subscribe / Edit Modal ---------- */
function SubscribeModal({
  isOpen,
  onClose,
  fbPages = [],
  initialData = null,
  corporateId,
  corporateType,
  onSaved,
}) {
  const [pageSelection, setPageSelection] = useState("");
  const [formsForPage, setFormsForPage] = useState([]);
  const [formSelection, setFormSelection] = useState("");
  const [cnFields, setCnFields] = useState([]);
  const [fieldMap, setFieldMap] = useState({});
  const [course, setCourse] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [loadingFields, setLoadingFields] = useState(false);
  const [formQuestions, setFormQuestions] = useState([]);

  // Load CN fields once
  useEffect(() => {
    facebookApi.fetchCNFields().then((d) => {
      if (Array.isArray(d)) {
        setCnFields(d);
      } else if (d && typeof d === "object") {
        const formatted = Object.entries(d).map(([id, name]) => ({ id, name }));
        setCnFields(formatted);
      } else {
        setCnFields([]);
      }
    });
  }, []);

  // Reset form + Load initial data for Edit mode
  useEffect(() => {
    if (!isOpen) return;

    // Reset everything
    setPageSelection("");
    setFormSelection("");
    setFormsForPage([]);
    setFieldMap({});
    setCourse("");
    setTargetLocation("");
    setLoadingFields(false);

    if (initialData) {
      const { pageId, pageAccessToken, formId, course: c, target_location } = initialData;

      setCourse(c || "");
      setTargetLocation(target_location || "");

      const pageVal = JSON.stringify({
                        pageId,
                        pageAccessToken,
                      });
      setPageSelection(pageVal);

      loadFormsForPage(pageVal).then(() => {
        const formVal = JSON.stringify({
                          pageId,
                          pageAccessToken,
                          formId,
                        });
        setFormSelection(formVal);
        loadFormFields(formVal, true);        // ← Use the unified function
      });
    }
  }, [isOpen, initialData]);

  // Helper to safely parse form value
  const parseFormValue = (val) => {
    if (!val) {
      return {
        pageId: null,
        pageAccessToken: null,
        formId: null,
      };
    }

    try {
      return JSON.parse(val);
    } catch (e) {
      console.error("Invalid form value", e);

      return {
        pageId: null,
        pageAccessToken: null,
        formId: null,
      };
    }
  };

  const loadFormsForPage = async (val) => {
    if (!val) return [];

    const { pageId, pageAccessToken } = JSON.parse(val);

    if (!window.FB) return [];

    return new Promise((resolve) => {
      window.FB.api(
        `/${pageId}/leadgen_forms?access_token=${pageAccessToken}&limit=200`,
        (response) => {
          console.log("FORMS RESPONSE =>", response);

          const list = Array.isArray(response?.data)
            ? response.data
            : [];

          setFormsForPage(list);
          resolve(list);
        }
      );
    });
  };

  // Unified function to load fields (used for both New & Edit)
  const loadFormFields = async (formVal, isEditMode = false) => {
    if (!formVal) return;

    const { pageId, pageAccessToken, formId } = parseFormValue(formVal);
    if (!formId || !pageAccessToken) return;

    setLoadingFields(true);
    setFieldMap({});

    try {
      let mappedArray = [];

      if (isEditMode) {
        const mappedRes = await facebookApi.getMappedFields(corporateId, pageId, formId).catch(() => []);
        mappedArray = Array.isArray(mappedRes) ? mappedRes : (mappedRes?.data || []);
      }

      const fbResponse = await new Promise((resolve, reject) => {
        window.FB.api(
          `/${formId}?fields=id,name,questions`,
          { access_token: pageAccessToken },
          (response) => {
            if (response?.error) reject(new Error(response.error.message));
            else resolve(response);
          }
        );
      });

      const questions = Array.isArray(fbResponse?.questions) ? fbResponse.questions : [];

      const defaultMap = {};
      questions.forEach((q) => {
        if (q?.key) defaultMap[q.key] = "";
      });

      // Only apply mappings when editing
      if (isEditMode) {
        mappedArray.forEach((m) => {
          if (m?.form_field_key && defaultMap.hasOwnProperty(m.form_field_key)) {
            defaultMap[m.form_field_key] = String(m.cn_field_id || "");
          }
        });
      }

      setFieldMap(defaultMap);
      setFormQuestions(questions);
    } catch (err) {
      console.error("[loadFormFields] Error:", err);
      toast.error("Failed to load form fields");
      setFieldMap({});
      setFormQuestions([]);
    } finally {
      setLoadingFields(false);
    }
  };

  const onPageChange = (e) => {
    const val = e.target.value;
    setPageSelection(val);
    setFormSelection("");
    setFieldMap({});
    setFormsForPage([]);
    loadFormsForPage(val);
  };

  const onFormChange = (e) => {
    const val = e.target.value;
    setFormSelection(val);
    loadFormFields(val, false);
  };

  const onFieldMapChange = (key, val) => {
    setFieldMap((prev) => ({ ...prev, [key]: val }));
  };

  const buildSubscriptionFormData = () => {
    const { pageId, pageAccessToken: pageToken } = parseFormValue(pageSelection);
    const { formId } = parseFormValue(formSelection);

    const payload = {
      corporateId,
      pageId,
      pageAccessToken: pageToken,
      formId,
      course: course || "",
      target_location: targetLocation || "",
    };

    if (initialData?.subscriptionId) {
      payload.subscriptionId = initialData.subscriptionId;
    }

    if (initialData?.formTableId) {
      payload.formTableId = initialData.formTableId;
    }

    Object.keys(fieldMap).forEach((fbFieldKey) => {
      if (fieldMap[fbFieldKey] && fieldMap[fbFieldKey] !== "") {
        payload[fbFieldKey] = fieldMap[fbFieldKey];
      }
    });

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    return { payload, formData };
  };

  const submit = async () => {
    if (!pageSelection || !formSelection) {
      toast.error("Please select page and form before subscribing");
      return;
    }

    const { payload, formData } = buildSubscriptionFormData();

    console.log("Final Payload being sent:", payload);

    try {
      const result = initialData
        ? await facebookApi.updateSubscription(formData)
        : await facebookApi.subscribe(formData);

      console.log("Server Response:", result);

      if (result && result.status === "OK") {
        toast.success(initialData ? "Subscription updated successfully" : "Subscribed successfully");
        onSaved?.();
        onClose();
      } else {
        toast.error(result?.msg || "Something went wrong");
      }
    } catch (err) {
      console.error("Submit failed:", err);
      toast.error("Network error while saving");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            {initialData ? "Update Subscription" : "Subscribe to Facebook Form"}
          </h3>
          <button onClick={onClose} className="text-3xl text-gray-400 hover:text-gray-600">×</button>
        </div>

        <div className="space-y-6">
          {/* Page Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Page</label>
            <select
              value={pageSelection}
              onChange={onPageChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Page</option>
              {fbPages.map((p) => (
                <option
                    key={p.id}
                    value={JSON.stringify({
                      pageId: p.id,
                      pageAccessToken: p.access_token,
                    })}
                  >
                    {p.name}
                  </option>
              ))}
            </select>
          </div>

          {/* Form Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lead Form</label>
            <select
              value={formSelection}
              onChange={onFormChange}
              disabled={!pageSelection}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select Form</option>
              {formsForPage.map((f) => (
                <option
                    key={f.id}
                    value={JSON.stringify({
                      ...JSON.parse(pageSelection),
                      formId: f.id,
                    })}
                  >
                    {f.name}
                  </option>
              ))}
            </select>
          </div>

          {/* Field Mapping */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Field Mapping</h4>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-72 overflow-auto">
              {loadingFields ? (
                <div className="text-center py-8 text-gray-500">Loading questions from Facebook...</div>
              ) : Object.keys(fieldMap).length === 0 ? (
                <div className="text-center py-8 text-amber-700 bg-amber-50 rounded-lg">
                  <p className="font-medium">No questions found in this form</p>
                  <p className="text-sm mt-2">Make sure the Instant Form has fields (Name, Email, Phone, etc.)</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Facebook Field</th>
                      <th className="text-left py-2">Map to Concept Ninjas Field</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(fieldMap).map((k) => (
                      <tr key={k} className="border-t">
                        <td className="py-3 pr-4 font-medium">
                          {formQuestions.find((q) => q.key === k)?.label || k}
                        </td>
                        <td className="py-3">
                          <select
                            value={fieldMap[k] || ""}
                            onChange={(e) => onFieldMapChange(k, e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">— Select Field —</option>
                            {cnFields.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Optional Fields */}
          {(corporateType === 100 || corporateType === 500 || corporateType === 800) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course (Optional)</label>
              <input
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                placeholder="Enter course name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Location (Optional)</label>
            <input
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
              placeholder="Enter location"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {initialData ? "Update Subscription" : "Subscribe Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function FacebookLeadManager() {
  const { loaded, status, refreshStatus } = useFacebookSDK();
  const [pages, setPages] = useState([]);
  const [subscribed, setSubscribed] = useState([]);
  const [search, setSearch] = useState("");
  const [pageIdx, setPageIdx] = useState(1);
  const pageSize = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const corporateId = Corporate?._id || "";
  const corporateType = Corporate?.type || 0;

  // Core data fetching function
  const fetchFacebookData = useCallback(async () => {
    if (!loaded || status?.status !== "connected" || !window.FB) {
      setPages([]);
      setSubscribed([]);
      return;
    }

    let token = status.authResponse?.accessToken;

    try {
      const ext = await facebookApi.getExtendedToken(token).catch(() => null);
      if (ext?.access_token) token = ext.access_token;

      // Fetch pages
      const pageRes = await new Promise((resolve) => {
        window.FB.api(`/me/accounts?access_token=${token}`, (res) => {
          console.log(res);
          resolve(res);
        });
      });

      const fbPages = Array.isArray(pageRes?.data) ? pageRes.data : [];
      setPages(fbPages);

      // Fetch subscribed forms
      const subs = await facebookApi.fetchSubscribedForms(corporateId, fbPages);
      setSubscribed(Array.isArray(subs) ? subs : []);
    } catch (err) {
      console.error("Fetch Facebook data failed:", err);
      setSubscribed([]);
    }
  }, [loaded, status?.status, status?.authResponse?.accessToken, corporateId]);

  // Auto-fetch on mount + status change
  useEffect(() => {
    if (loaded) {
      fetchFacebookData();
    }
  }, [loaded, status?.status, fetchFacebookData]);

  // Handle successful login
  const handleLoginSuccess = useCallback(() => {
    refreshStatus((resp) => {
      if (resp?.status === "connected") {
        fetchFacebookData();
      }
    });
  }, [refreshStatus, fetchFacebookData]);

  // Handle logout → reset everything
  const handleLogout = useCallback(() => {
    setPages([]);
    setSubscribed([]);
    setEditData(null);
    setModalOpen(false);
    // Optional: force status refresh
    refreshStatus();
  }, [refreshStatus]);

  const refreshList = useCallback(() => {
    fetchFacebookData();
    toast.info("Refreshing subscriptions...");
  }, [fetchFacebookData]);

  const openSubscribe = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditData({
      pageId: row.page_id,
      subscriptionId: row.subscription_id,
      pageAccessToken: row.page_access_token,
      formId: row.form_id,
      formTableId: row.form_table_id,
      course: row.course,
      target_location: row.target_location,
    });
    setModalOpen(true);
  };

  const doDelete = async (row) => {
    if (!confirm("Delete this subscription?")) return;

    try {
      const res = await facebookApi.deleteSubscription(row.form_table_id);
      if (res?.msg === "success") {
        toast.success("Subscription deleted");
        refreshList();
      } else {
        toast.error(res?.msg || "Delete failed");
      }
    } catch (err) {
      toast.error("Network error while deleting");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subscribed;
    return subscribed.filter(
      (r) =>
        (r.form_name || "").toLowerCase().includes(q) ||
        (r.page_name || "").toLowerCase().includes(q)
    );
  }, [search, subscribed]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((pageIdx - 1) * pageSize, pageIdx * pageSize);

  return (
    <div className="p-4">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={openSubscribe}
            disabled={status?.status !== "connected"}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
          >
            + Subscribe New Form
          </button>
          <button
            onClick={refreshList}
            disabled={status?.status !== "connected"}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition disabled:opacity-50"
          >
            Refresh List
          </button>
        </div>

        <FacebookAuthButton
          status={status}
          onSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageIdx(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Not connected message */}
      {loaded && status?.status !== "connected" && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          Please connect your Facebook / Instagram account to view and manage form subscriptions.
        </div>
      )}

      {/* Table */}
      <div className="bg-white border rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Page Name</th>
              <th className="p-3 text-left">Form ID</th>
              <th className="p-3 text-left">Form Name</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  {status?.status === "connected" ? "No subscriptions found" : "Not connected"}
                </td>
              </tr>
            ) : (
              pageItems.map((row, i) => (
                <tr key={row.form_table_id || i} className="border-t hover:bg-gray-50">
                  <td className="p-3">{(pageIdx - 1) * pageSize + i + 1}</td>
                  <td className="p-3">{row.page_name || "—"}</td>
                  <td className="p-3">{row.form_id || "—"}</td>
                  <td className="p-3">{row.form_name || "—"}</td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEdit(row)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => doDelete(row)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
            <div>Showing {pageItems.length} of {filtered.length}</div>
            <div className="flex gap-2">
              <button
                disabled={pageIdx === 1}
                onClick={() => setPageIdx((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-3 py-1 font-medium">
                Page {pageIdx} of {Math.ceil(filtered.length / pageSize)}
              </span>
              <button
                disabled={pageIdx >= Math.ceil(filtered.length / pageSize)}
                onClick={() => setPageIdx((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <SubscribeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          fbPages={pages}
          initialData={editData}
          corporateId={corporateId}
          corporateType={corporateType}
          onSaved={refreshList}
        />
      )}
    </div>
  );
}
