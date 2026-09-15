'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { xFetch } from '@/utility/xFetch';
import { Corporate, User } from '@/utility/TinyDB';

const TEMPLATE_PLACEHOLDER = 'Select a WhatsApp template';
const MESSAGE_FALLBACK = 'Hi $firstName';

function normalizeProvider(value) {
  return String(value || '').trim().toLowerCase();
}

// function extractWhatsAppProvider(details = {}) {
//   return (
//     details?.whatsapp_provider ||
//     details?.whatsappProvider ||
//     details?.whatsapp_vendor ||
//     details?.whatsappVendor ||
//     details?.whatsapp_api_provider ||
//     details?.whatsappApiProvider ||
//     details?.provider ||
//     Corporate?.whatsapp_provider ||
//     Corporate?.whatsappProvider ||
//     Corporate?.whatsapp_vendor ||
//     Corporate?.whatsappVendor ||
//     Corporate?.provider ||
//     ''
//   );
// }

function extractWhatsAppProvider(details = {}) {

  // check payload_template
  const payloadTemplate = details?.payload_template;

  if (payloadTemplate) {
    try {
      const parsed =
        typeof payloadTemplate === 'string'
          ? JSON.parse(payloadTemplate)
          : payloadTemplate;

      return parsed?.provider || '';
    } catch (error) {
      console.error('Failed to parse WhatsApp payload_template:', error);
    }
  }

  return '';
}

function extractTemplateBody(template = {}) {
  return (
    template?.body ||
    template?.templateText ||
    template?.template_text ||
    template?.content ||
    template?.message ||
    template?.htmlContent ||
    template?.template_body ||
    template?.templateBody ||
    template?.text ||
    MESSAGE_FALLBACK
  );
}

function extractTemplateId(template = {}, index = 0) {
  return (
    template?.templateId ||
    template?.template_id ||
    template?.id ||
    template?.whatsappTemplateId ||
    template?.whatsapp_template_id ||
    `template-${index}`
  );
}

function extractTemplateName(template = {}, index = 0) {
  return (
    template?.elementName ||
    template?.templateName ||
    template?.template_name ||
    template?.name ||
    template?.title ||
    template?.templateTitle ||
    `Template ${index + 1}`
  );
}

function extractCustomParams(template = {}) {
  const value =
    template?.customParams ||
    template?.custom_params ||
    template?.parameters ||
    template?.params ||
    [];

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return extractCustomParams({ customParams: parsed });
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => ({ name: item, value: '' }));
    }
  }

  if (!Array.isArray(value)) return [];

  return value.map((param, index) => {
    if (typeof param === 'string') {
      return { name: param.trim() || `param_${index + 1}`, value: '' };
    }

    if (param && typeof param === 'object') {
      return {
        name:
          param.name ||
          param.key ||
          param.param ||
          param.label ||
          param.variable ||
          `param_${index + 1}`,
        value: param.value || param.defaultValue || param.default_value || '',
      };
    }

    return { name: `param_${index + 1}`, value: '' };
  });
}

function normalizeTemplates(response) {
  const rows =
    Array.isArray(response?.messageTemplates) ? response.messageTemplates :
    Array.isArray(response) ? response :
    Array.isArray(response?.rows) ? response.rows :
    Array.isArray(response?.data) ? response.data :
    Array.isArray(response?.templates) ? response.templates :
    [];

  return rows.map((template, index) => ({
    raw: template,
    templateId: extractTemplateId(template, index),
    templateName: extractTemplateName(template, index),
    body: extractTemplateBody(template),
    customParams: extractCustomParams(template),
  }));
}

async function tryFetchFirst(paths, options) {
  let lastError = null;

  for (const path of paths) {
    try {
      return await xFetch({ ...options, path });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to complete request');
}

export default function SendWhatsAppModal({
  isOpen,
  onClose,
  ids = [],
  candidates = [],
  mobileNumbers = [],
  corporateId,
}) {
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [customParams, setCustomParams] = useState([]);
  const [message, setMessage] = useState(MESSAGE_FALLBACK);
  const [provider, setProvider] = useState('');
  const [providerLabel, setProviderLabel] = useState('WhatsApp');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingProvider, setIsLoadingProvider] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const selectedRecipients = useMemo(() => {
    const unique = new Map();

    (Array.isArray(candidates) ? candidates : []).forEach((candidate) => {
      const invitationId = candidate?.invitationId ?? candidate?.id;
      const mobile = String(candidate?.mobile || '').trim();
      const altMobile = String(candidate?.altMobile || '').trim();
      const key = String(invitationId ?? mobile ?? altMobile ?? Math.random());

      if (!unique.has(key)) {
        unique.set(key, {
          invitationId,
          name: `${candidate?.firstName || ''} ${candidate?.lastName || ''}`.trim(),
          mobile,
          altMobile,
        });
      }
    });

    return Array.from(unique.values());
  }, [candidates]);

  const selectedInvitationIds = useMemo(
    () => (Array.isArray(ids) ? ids.filter(Boolean) : []),
    [ids]
  );

  const selectedMobiles = useMemo(() => {
    const rawMobiles = Array.isArray(mobileNumbers) ? mobileNumbers : [];
    const candidateMobiles = selectedRecipients.flatMap((candidate) => [
      candidate.mobile,
      candidate.altMobile,
    ]);

    return Array.from(
      new Set(
        [...rawMobiles, ...candidateMobiles]
          .map((value) => String(value || '').trim())
          .filter(Boolean)
      )
    );
  }, [mobileNumbers, selectedRecipients]);

  useEffect(() => {
    if (!isOpen) return;

    setTemplateId('');
    setTemplateName('');
    setCustomParams([]);
    setMessage(MESSAGE_FALLBACK);
    setTemplates([]);
    setProvider('');
    setProviderLabel('WhatsApp');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadContext = async () => {
      setIsLoadingProvider(true);
      setIsLoadingTemplates(true);

      try {
        const corporateDetails = await xFetch({
          path: `/services/profile/fetchWhatsAppOverride?time=${Date.now()}`,
        });

        const detectedProvider = extractWhatsAppProvider(corporateDetails);
        const normalizedProvider = normalizeProvider(detectedProvider);

        if (cancelled) return;

        setProvider(normalizedProvider);
        setProviderLabel(detectedProvider ? String(detectedProvider) : 'WhatsApp');

        const providerIsWati = normalizedProvider === 'wati';
        const templatePaths = providerIsWati
          ? [
              '/services/profile/fetchWatiTemplates',
              '/services/profile/getWhatsAppTemplates',
            ]
          : [
              '/services/profile/getWhatsAppTemplates',
            ];

        const response = await tryFetchFirst(templatePaths, {
          method: 'GET',
        });

        const normalizedTemplates = normalizeTemplates(response);

        if (cancelled) return;

        setTemplates(normalizedTemplates);
      } catch (error) {
        console.error('Failed to load WhatsApp context:', error);
        if (!cancelled) {
          setTemplates([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProvider(false);
          setIsLoadingTemplates(false);
        }
      }
    };

    loadContext();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!templateId) return;

    const selectedTemplate = templates.find((template) => String(template.templateId) === String(templateId));
    if (!selectedTemplate) return;

    setTemplateName(selectedTemplate.templateName);
    setCustomParams(selectedTemplate.customParams || []);
    setMessage(selectedTemplate.body || MESSAGE_FALLBACK);
  }, [templateId, templates]);

  if (!isOpen) return null;

  const hasSelection = selectedInvitationIds.length > 0 || selectedMobiles.length > 0;
  const canSend = hasSelection && templateId && message.trim() && !isSending;

  const handleTemplateChange = (e) => {
    const value = e.target.value;
    setTemplateId(value);

    if (!value) {
      setTemplateName('');
      setCustomParams([]);
      setMessage(MESSAGE_FALLBACK);
      return;
    }

    const selectedTemplate = templates.find((template) => String(template.templateId) === String(value));
    setTemplateName(selectedTemplate?.templateName || '');
    setCustomParams(selectedTemplate?.customParams || []);
    setMessage(selectedTemplate?.body || MESSAGE_FALLBACK);
  };

  const updateCustomParam = (index, value) => {
    setCustomParams((prev) =>
      prev.map((param, i) =>
        i === index ? { ...param, value } : param
      )
    );
  };

  const resolvedMessage = useMemo(() => {
    if (!message) return MESSAGE_FALLBACK;

    let output = message;
    customParams.forEach((param, index) => {
      const value = String(param?.value || '').trim();
      const name = String(param?.name || `param_${index + 1}`).trim();

      output = output
        .replaceAll(`{{${name}}}`, value)
        .replaceAll(`{{ ${name} }}`, value)
        .replaceAll(`{{${index + 1}}}`, value)
        .replaceAll(`{{ ${index + 1} }}`, value);
    });

    return output;
  }, [message, customParams]);

  const sendWhatsApp = async () => {
    if (!hasSelection) {
      toast.error('Select at least one candidate');
      return;
    }

    if (!templateId) {
      toast.error('Please choose a WhatsApp template');
      return;
    }

    if (!resolvedMessage.trim()) {
      toast.error('Please enter a WhatsApp message');
      return;
    }

    const loadingToast = toast.loading('Sending WhatsApp message...', {
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
      hideProgressBar: true,
    });

    setIsSending(true);

    try {
      const payload = {
        corporateId: corporateId || Corporate?._id || '',
        userId: User?._id || '',
        provider: provider || 'leadstor',
        type: 'WhatsApp',
        channel: 'whatsapp',
        templateId,
        elementName: templateName,
        templateName,
        content: resolvedMessage.trim(),
        message: resolvedMessage.trim(),
        ids: selectedInvitationIds,
        invitationIds: selectedInvitationIds,
        mobiles: selectedMobiles,
        mobileNumbers: selectedMobiles,
        candidates: selectedRecipients,
        customParams: customParams.map((param) => String(param?.value || '').trim()),
        customParamsNamed: customParams,
      };

      const response = await tryFetchFirst([
        '/services/invite/sendWhatsAppNotification',
      ], {
        method: 'POST',
        payload,
      });

      const success =
        response?.status === true ||
        response?.status === 'success' ||
        response?.status === 'OK' ||
        response?.sent > 0 ||
        response?.message_id ||
        response?.success === true;

      if (!success) {
        throw new Error(response?.message || response?.desc || 'Failed to send WhatsApp message');
      }

      toast.success('WhatsApp message sent successfully');
      onClose?.();
    } catch (error) {
      console.error('WhatsApp send failed:', error);
      toast.error(error?.message || 'Failed to send WhatsApp message');
    } finally {
      setIsSending(false);
      toast.dismiss(loadingToast);
    }
  };

  const drawerStyle = {
    position: 'fixed',
    top: 0,
    right: isOpen ? 0 : '-440px',
    width: 440,
    height: '100vh',
    background: 'white',
    zIndex: 1001,
    transition: 'right 0.3s ease',
    boxShadow: '-2px 0 20px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transition: 'all 0.3s ease',
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={drawerStyle}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Send WhatsApp Message</h2>
            <p className="text-xs text-gray-500 mt-1">
              Provider: {providerLabel || 'WhatsApp'}
            </p>
          </div>
          <button
            className="text-gray-600 hover:text-gray-800 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
            onClick={onClose}
            disabled={isSending}
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-gray-700">Selected Candidates</div>
            <div className="mt-2 text-sm text-gray-600">
              {selectedInvitationIds.length} invite(s) and {selectedMobiles.length} mobile(s) selected
            </div>

            <div className="mt-3 max-h-28 overflow-y-auto space-y-2">
              {selectedRecipients.length === 0 ? (
                <div className="text-xs text-red-600">No candidate rows are currently selected.</div>
              ) : (
                selectedRecipients.map((candidate, index) => (
                  <div key={`${candidate.invitationId || candidate.mobile || index}`} className="rounded-lg bg-white px-3 py-2 border border-gray-200 text-xs text-gray-700">
                    <div className="font-medium">
                      {candidate.name || `Candidate ${index + 1}`}
                    </div>
                    <div className="mt-1 text-gray-500">
                      ID: {candidate.invitationId || '-'}
                      {candidate.mobile ? ` | Mobile: ${candidate.mobile}` : ''}
                      {candidate.altMobile ? ` | Alt: ${candidate.altMobile}` : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Template <span className="text-red-500">*</span>
            </label>
            <select
              value={templateId}
              onChange={handleTemplateChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              disabled={isLoadingProvider || isLoadingTemplates || isSending}
            >
              <option value="">{isLoadingTemplates ? 'Loading templates...' : TEMPLATE_PLACEHOLDER}</option>
              {templates.map((template) => (
                <option key={template.templateId} value={template.templateId}>
                  {template.templateName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
              placeholder="Write your WhatsApp message here..."
              disabled={isSending}
            />
            <p className="mt-2 text-xs text-gray-500">
              Template content loads automatically. You can adjust the message or fill the template variables below.
            </p>
          </div>

          {customParams.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-sm font-medium text-gray-700 mb-3">Template Variables</div>
              <div className="space-y-3">
                {customParams.map((param, index) => (
                  <div key={`${param?.name || 'param'}-${index}`}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {param?.name || `Variable ${index + 1}`}
                    </label>
                    <input
                      type="text"
                      value={param?.value || ''}
                      onChange={(e) => updateCustomParam(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      placeholder={`Enter value for ${param?.name || `variable ${index + 1}`}`}
                      disabled={isSending}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-dashed border-green-300 bg-green-50 p-4">
            <div className="text-xs font-medium text-green-700 mb-1">Message Preview</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{resolvedMessage || MESSAGE_FALLBACK}</div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 bg-white flex gap-3">
          <button
            onClick={onClose}
            disabled={isSending}
            className="flex-1 py-3 px-6 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={sendWhatsApp}
            disabled={!canSend}
            className={`flex-1 py-3 px-6 rounded-xl text-white font-medium transition ${
              canSend ? 'bg-green-600 hover:bg-green-700' : 'bg-green-400 cursor-not-allowed'
            }`}
          >
            {isSending ? 'Sending...' : 'Send WhatsApp'}
          </button>
        </div>
      </div>
    </>
  );
}
