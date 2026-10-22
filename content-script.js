const FIELD_ATTRIBUTE = "data-application-paste-id";

const FIELD_RULES = [
  { key: "firstName", label: "First name", patterns: [/\bfirst\s*name\b/i, /\bgiven\s*name\b/i, /\bforename\b/i] },
  { key: "middleName", label: "Middle name", patterns: [/\bmiddle\s*name\b/i, /\badditional\s*name\b/i] },
  { key: "lastName", label: "Last name", patterns: [/\blast\s*name\b/i, /\bsur\s*name\b/i, /\bfamily\s*name\b/i] },
  { key: "fullName", label: "Full name", patterns: [/\bfull\s*name\b/i, /^name$/i, /\bcandidate\s*name\b/i] },
  { key: "email", label: "Email", patterns: [/\be-?mail(?:\s*address)?\b/i] },
  { key: "phoneType", label: "Phone device type", patterns: [/\bphone\s*(?:device\s*)?type\b/i] },
  { key: "phoneCountryCode", label: "Country phone code", patterns: [/\b(?:country|dial(?:ing)?|calling|isd)\s*(?:phone\s*)?code\b/i, /\bphone\s*(?:country\s*code|prefix)\b/i] },
  { key: "phone", label: "Phone", patterns: [/\bphone\b/i, /\bmobile\b/i, /\bcontact\s*(?:number|no)\b/i] },
  { key: "linkedIn", label: "LinkedIn", patterns: [/\blinked\s*in\b/i] },
  { key: "github", label: "GitHub", patterns: [/\bgithub\b/i] },
  { key: "portfolio", label: "Portfolio", patterns: [/\bportfolio\b/i, /\bpersonal\s*(?:website|site)\b/i] },
  { key: "address", label: "Street address", patterns: [/\bstreet\s*address\b/i, /\baddress\s*line\b/i, /^address$/i] },
  { key: "pincode", label: "PIN / postal code", patterns: [/\bpin\s*code\b/i, /\bpostal\s*code\b/i, /\bzip\s*code\b/i, /^zip$/i] },
  { key: "city", label: "City", patterns: [/\bcity\b/i, /\btown\b/i] },
  { key: "state", label: "State", patterns: [/\bstate\b/i, /\bprovince\b/i] },
  { key: "country", label: "Country", patterns: [/\bcountry\b/i] },
  { key: "currentCompany", label: "Current company", patterns: [/\bcurrent\s*(?:company|employer|organization)\b/i] },
  { key: "currentJobTitle", label: "Current job title", patterns: [/\bcurrent\s*(?:job\s*)?(?:title|role|designation|position)\b/i] },
  { key: "totalExperience", label: "Total experience", patterns: [/\btotal\s*(?:years?\s*(?:of\s*)?)?experience\b/i, /\byears?\s*of\s*experience\b/i] },
  { key: "currentCtc", label: "Current CTC", patterns: [/\bcurrent\s*(?:ctc|salary|compensation)\b/i] },
  { key: "expectedCtc", label: "Expected CTC", patterns: [/\bexpected\s*(?:ctc|salary|compensation)\b/i, /\bsalary\s*expectation/i] },
  { key: "noticePeriod", label: "Notice period", patterns: [/\bnotice\s*period\b/i, /\bavailability\b/i, /\bavailable\s*(?:from|to start)\b/i] },
  { key: "workAuthorized", label: "Authorized to work", patterns: [/\bauthori[sz]ed\s*to\s*work\b/i, /\blegally\s*authori[sz]ed\b/i, /\beligible\s*to\s*work\b/i, /\bwork\s*authori[sz]ation\b/i] },
  { key: "needsSponsorship", label: "Visa sponsorship", patterns: [/\brequire\b.*\bsponsorship\b/i, /\bneed\b.*\bsponsorship\b/i, /\bvisa\s*sponsorship\b/i, /\bsponsor\b.*\bemployment\b/i] },
  { key: "willingToRelocate", label: "Willing to relocate", patterns: [/\bwilling\s*to\s*relocate\b/i, /\bopen\s*to\s*relocation\b/i, /\brelocate\s*for\b/i] },
  { key: "school", label: "School / university", patterns: [/\bschool\b/i, /\buniversity\b/i, /\bcollege\b/i, /\binstitution\b/i] },
  { key: "degree", label: "Degree", patterns: [/\bdegree\b/i, /\bqualification\b/i] },
  { key: "gradYear", label: "Graduation year", patterns: [/\bgraduation\s*year\b/i, /\bgrad\s*year\b/i, /\byear\s*of\s*graduation\b/i] },
  { key: "coverLetter", label: "Cover letter", patterns: [/\bcover\s*letter\b/i] },
  { key: "whyInterested", label: "Why interested", patterns: [/\bwhy\b.*\b(?:interested|join|role|company)\b/i, /\bmotivation\b/i] },
  { key: "summary", label: "Professional summary", patterns: [/\bprofessional\s*summary\b/i, /\babout\s*(?:you|yourself|me)\b/i, /\bprofile\s*summary\b/i] },
  { key: "skills", label: "Skills", patterns: [/^(?:(?:technical|relevant|key)\s+)?skills[\s*]*$/i, /\btype to add skills\b/i] },
  { key: "experience.company", label: "Company", patterns: [/\bcompany(?:\s*name)?\b/i, /\bemployer(?:\s*name)?\b/i, /\borganization(?:\s*name)?\b/i] },
  { key: "experience.title", label: "Job title", patterns: [/\bjob\s*title\b/i, /\bdesignation\b/i, /^role$/i, /^position$/i] },
  { key: "experience.location", label: "Work location", patterns: [/\bwork\s*location\b/i, /\bemployment\s*location\b/i] },
  { key: "experience.description", label: "Role description", patterns: [/\b(?:role|job|work|experience)\s*description\b/i, /\b(?:responsibilities|duties|achievements)\b/i] },
  { key: "fieldOfStudy", label: "Field of study", patterns: [/\bfield\s*of\s*study\b/i, /\bmajor\b/i, /\bdiscipline\b/i] },
  { key: "howDidYouHear", label: "How did you hear about us?", patterns: [/\bhow\s*did\s*you\s*hear\b/i, /\bsource\b.*\bapplication\b/i] }
];

const WORKDAY_AUTOMATION_RULES = [
  { key: "firstName", label: "First name", pattern: /legalNameSection.firstName/i },
  { key: "middleName", label: "Middle name", pattern: /legalNameSection.middleName/i },
  { key: "lastName", label: "Last name", pattern: /legalNameSection.lastName/i },
  { key: "address", label: "Street address", pattern: /addressSection.addressLine1/i },
  { key: "city", label: "City", pattern: /addressSection.city/i },
  { key: "state", label: "State", pattern: /addressSection.countryRegion/i },
  { key: "pincode", label: "PIN / postal code", pattern: /addressSection.postalCode/i },
  { key: "country", label: "Country", pattern: /countryDropdown/i },
  { key: "phoneType", label: "Phone device type", pattern: /phone.device.type/i },
  { key: "phoneCountryCode", label: "Country phone code", pattern: /phone.*country.*code|country.*phone.*code/i },
  { key: "phone", label: "Phone number", pattern: /phone.number/i },
  { key: "experience.title", label: "Job title", pattern: /workExperience.*/i, childPattern: /jobTitle/i },
  { key: "experience.company", label: "Company", pattern: /workExperience.*/i, childPattern: /company/i },
  { key: "experience.location", label: "Work location", pattern: /workExperience.*/i, childPattern: /location/i },
  { key: "experience.current", label: "Currently work here", pattern: /currentlyWorkHere/i },
  { key: "experience.startMonth", label: "Start month", pattern: /workExperience.*/i, childPattern: /formField.startDate.*dateSectionMonth.input/i },
  { key: "experience.startYear", label: "Start year", pattern: /workExperience.*/i, childPattern: /formField.startDate.*dateSectionYear.input/i },
  { key: "experience.endMonth", label: "End month", pattern: /workExperience.*/i, childPattern: /formField.endDate.*dateSectionMonth.input/i },
  { key: "experience.endYear", label: "End year", pattern: /workExperience.*/i, childPattern: /formField.endDate.*dateSectionYear.input/i },
  { key: "experience.description", label: "Role description", pattern: /workExperience.*/i, childPattern: /description/i },
  { key: "school", label: "School / university", pattern: /education.*/i, childPattern: /school/i },
  { key: "degree", label: "Degree", pattern: /education.*/i, childPattern: /degree/i },
  { key: "fieldOfStudy", label: "Field of study", pattern: /education.*/i, childPattern: /fieldOfStudy|field.*study/i },
  { key: "gradMonth", label: "Graduation month", pattern: /education.*/i, childPattern: /formField.endDate.*dateSectionMonth.input/i },
  { key: "gradYear", label: "Graduation year", pattern: /education.*/i, childPattern: /formField.endDate.*dateSectionYear.input/i },
  { key: "website.url", label: "Website", pattern: /websitePanelSet/i },
  { key: "resume", label: "Resume", pattern: /file.upload|resume/i },
  { key: "coverLetter", label: "Cover letter", pattern: /cover/i }
];

let generatedFieldId = 0;
const experienceGroupIds = new WeakMap();
let generatedGroupId = 0;
let experienceFillRunning = false;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "FILL_EXPERIENCES") {
    if (experienceFillRunning) { sendResponse({ ok: false, error: "Work experience is already being filled." }); return false; }
    experienceFillRunning = true;
    fillSavedExperiences(message.workExperiences || [], message.selections || {})
      .then(sendResponse, (error) => sendResponse({ ok: false, error: error.message }))
      .finally(() => { experienceFillRunning = false; });
    return true;
  }
  if (message?.type === "SCAN_FIELDS") {
    const fields = scanFields();
    sendResponse({ ok: true, fields, canAddExperience: Boolean(findAddExperienceButton(experienceGroups(fields))) });
    return false;
  }

  if (message?.type === "FILL_FIELD") {
    if (experienceFillRunning) { sendResponse({ ok: false, error: "Wait for work experience filling to finish." }); return false; }
    fillField(message.fieldId, message.value, false).then(sendResponse);
    return true;
  }

  if (message?.type === "FILL_FIELDS") {
    if (experienceFillRunning) { sendResponse({ ok: false, error: "Wait for work experience filling to finish." }); return false; }
    (async () => {
      const results = [];
      for (const { fieldId, value } of message.fields || []) {
        results.push(await fillField(fieldId, value, true));
      }
      sendResponse({
        ok: true,
        filled: results.filter((result) => result.ok).length,
        skipped: results.filter((result) => result.skipped).length,
        total: results.length,
        failed: results.filter((result) => !result.ok && !result.skipped).length,
        errors: results.filter((result) => result.error).map((result) => result.error),
        warnings: results.filter((result) => result.warning).map((result) => result.warning)
      });
    })();
    return true;
  }
});

function scanFields() {
  const candidates = Array.from(document.querySelectorAll([
    "input",
    "textarea",
    "select",
    "[contenteditable='true']",
    "[role='combobox']",
    "button[aria-haspopup='listbox']",
    "button[aria-haspopup='tree']",
    "button[data-automation-id]"
  ].join(",")))
    .filter(isFillableField);
  const occurrences = new Map();
  const seenRadioGroups = new Set();

  const entries = candidates.map((element) => {
    const rawLabel = getFieldDescription(element);
    return { element, rawLabel, match: classifyField(element, rawLabel) };
  });
  for (const entry of entries) {
    const { element } = entry;
    if (!findExperienceContainer(element, entries)) continue;
    if (entry.match?.key === "currentCompany") entry.match = ruleFor("experience.company");
    if (entry.match?.key === "currentJobTitle") entry.match = ruleFor("experience.title");
    const signals = getFieldSignals(element);
    if (signals.some((text) => /^(?:location|city|work location|employment location)[\s*]*$/i.test(text))) {
      entry.match = ruleFor("experience.location");
    }
    for (const text of signals) {
      const date = text.match(/\b(start|end|from|to)\s*(?:date\s*)?(month|year|date)?\b/i);
      if (!date || !/\b(?:month|year|date)\b/i.test(text) && !/^(?:from|to)[\s*]*$/i.test(text)) continue;
      const side = /^(?:start|from)$/i.test(date[1]) ? "start" : "end";
      const part = /\bmonth\b/i.test(text) ? "Month" : /\byear\b/i.test(text) ? "Year" : "Date";
      // A month-only profile cannot supply a day for an HTML date input.
      entry.match = element.type === "date" ? null : { key: `experience.${side}${part}`, label: `${side} ${part.toLowerCase()}` };
      break;
    }
  }
  const groups = new Map();
  let fallbackGroup = null;
  const fallbackKeys = new Set();

  return entries.flatMap(({ element, rawLabel, match }) => {
    if (element.type === "radio") {
      const groupIdentity = element.name || element.id;
      if (groupIdentity && seenRadioGroups.has(groupIdentity)) return [];
      if (groupIdentity) seenRadioGroups.add(groupIdentity);
    }

    const occurrence = occurrences.get(match?.key) || 0;
    let experienceGroup = null;
    let experienceIndex = null;
    if (match?.key?.startsWith("experience.")) {
      let container = findExperienceContainer(element, entries);
      if (!container) {
        // Flat forms sometimes have no wrapper around each employer.
        if (!fallbackGroup || fallbackKeys.has(match.key)) {
          fallbackGroup = element;
          fallbackKeys.clear();
        }
        fallbackKeys.add(match.key);
        container = fallbackGroup;
      }
      const record = workRecordIdentity(element) || entries.filter((entry) => container.contains(entry.element))
        .map((entry) => workRecordIdentity(entry.element)).find(Boolean);
      if (record) experienceGroup = `record-${record}`;
      else {
        if (!experienceGroupIds.has(container)) experienceGroupIds.set(container, `experience-${++generatedGroupId}`);
        experienceGroup = experienceGroupIds.get(container);
      }
      if (!groups.has(experienceGroup)) {
        groups.set(experienceGroup, getExplicitExperienceIndex(container, element) ?? groups.size);
      }
      experienceIndex = groups.get(experienceGroup);
    }

    if (match) {
      occurrences.set(match.key, occurrence + 1);
    }

    if (!element.hasAttribute(FIELD_ATTRIBUTE)) {
      generatedFieldId += 1;
      element.setAttribute(FIELD_ATTRIBUTE, `${Date.now()}-${generatedFieldId}`);
    }

    return [{
      fieldId: element.getAttribute(FIELD_ATTRIBUTE),
      rawLabel: rawLabel || "Unlabelled field",
      dataKey: match?.key || null,
      displayLabel: match?.label || "Unknown field",
      occurrence,
      experienceGroup,
      experienceIndex,
      autocomplete: (element.autocomplete || "").toLowerCase().split(/\s+/).pop(),
      isCustomDropdown: isCustomDropdown(element) || isComboboxInput(element),
      hasSeparatePhoneCode: match?.key === "phone" && entries.some((entry) =>
        entry.match?.key === "phoneCountryCode" && entry.element.form === element.form),
      required: element.required ||
        element.getAttribute("aria-required") === "true" ||
        Boolean(element.closest("[aria-required='true']")) ||
        /\*/.test(rawLabel),
      fieldType: element.tagName.toLowerCase() === "select" ? "select" : (element.type || element.tagName.toLowerCase()),
      currentValue: getCurrentValue(element),
      frameUrl: window.location.href
    }];
  });
}

function isFillableField(element) {
  const excludedTypes = new Set(["hidden", "password", "submit", "reset", "image"]);
  const type = (element.type || "").toLowerCase();
  const style = window.getComputedStyle(element);
  const isVisible = element.getClientRects().length > 0 && style.visibility !== "hidden" && style.display !== "none";
  const isHiddenResumeInput = type === "file" && /file.upload|resume|\bcv\b/i.test(`${getAutomationContext(element)} ${getFieldDescription(element)}`);

  if ((element.tagName === "BUTTON" || type === "button") && !isCustomDropdown(element)) return false;
  if (element.getAttribute("role") === "combobox" && element.tagName !== "INPUT" && element.tagName !== "SELECT" && !isCustomDropdown(element)) return false;
  if (type === "checkbox" && !/currentlyWorkHere|currently\s*work|current\s*(?:job|employment)/i.test(`${getAutomationContext(element)} ${getFieldDescription(element)}`)) return false;
  return !excludedTypes.has(type) && !element.disabled && !element.readOnly && (isVisible || isHiddenResumeInput);
}

function getCurrentValue(element) {
  if (element.type === "radio") {
    const group = element.name
      ? Array.from(document.querySelectorAll(`input[type="radio"][name="${CSS.escape(element.name)}"]`))
      : [element];
    return group.find((item) => item.checked)?.value || "";
  }
  if (element.type === "file") return element.files?.[0]?.name || "";
  if (element.type === "checkbox") return element.checked ? "yes" : "";
  if (element.isContentEditable) return element.innerText || "";
  if (isCustomDropdown(element)) {
    const value = element.getAttribute("data-selected-value") ||
      element.getAttribute("aria-valuetext") ||
      element.innerText?.replace(/\s+/g, " ").trim() || "";
    return /\b(?:select one|make a selection|choose an option)\b/i.test(value) ? "" : value;
  }
  return element.value || "";
}

function getFieldDescription(element) {
  return getFieldSignals(element).join(" · ").slice(0, 220);
}

function normalizeFieldText(value) {
  return String(value || "").replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_\-.\[\]]+/g, " ").replace(/\s+/g, " ").trim();
}

function labelText(label) {
  if (!label) return "";
  const copy = label.cloneNode(true);
  copy.querySelectorAll("input, textarea, select, button, [role='listbox']").forEach((node) => node.remove());
  return normalizeFieldText(copy.textContent);
}

function getFieldSignals(element) {
  const parts = [];
  // A radio's own label is an answer; the group's legend is the question.
  if (element.type === "radio") parts.push(labelText(element.closest("fieldset")?.querySelector(":scope > legend")));
  parts.push(element.getAttribute("aria-label"));
  for (const id of (element.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean)) {
    parts.push(labelText(document.getElementById(id)));
  }
  for (const label of element.labels || []) {
    if (label.querySelectorAll("input, textarea, select, button").length <= 1) parts.push(labelText(label));
  }
  const group = findWorkdayFieldGroup(element);
  if (group) parts.push(labelText(group.querySelector("label, legend")));
  parts.push(element.getAttribute("placeholder"), element.getAttribute("name"), element.id,
    element.getAttribute("data-automation-id"), element.getAttribute("data-qa"));
  return [...new Set(parts.map(normalizeFieldText).filter(Boolean))];
}

function classifyField(element, description) {
  const type = (element.type || "").toLowerCase();
  const autocomplete = (element.autocomplete || "").toLowerCase().split(/\s+/).pop();
  const automationContext = getAutomationContext(element);
  const signals = getFieldSignals(element);

  if (signals.some((text) => /\blocal\s+(?:given|first)\s*name/i.test(text)) ||
      /localNameSection.*firstName/i.test(automationContext)) {
    return { key: null, label: "Local given name — leave blank", patterns: [] };
  }
  if (signals.some((text) => /\blocal\s+(?:family|last|sur)\s*name/i.test(text)) ||
      /localNameSection.*lastName/i.test(automationContext)) {
    return { key: null, label: "Local family name — leave blank", patterns: [] };
  }
  if (findSkillsContainer(element)) return ruleFor("skills");

  // Country-code controls are often type=tel too. Specific hints take priority.
  if (/^country[\s*]*$/i.test(signals[0] || "") && type !== "tel" && autocomplete !== "tel-country-code" &&
      !signals.some((text) => /\b(?:phone|dial|dialing|calling|isd)\b/i.test(text)) &&
      !Array.from(element.options || []).some((option) => /\+\d{1,3}\b/.test(option.text))) return ruleFor("country");
  if (autocomplete === "tel-country-code" || signals.some((text) =>
    ruleFor("phoneCountryCode").patterns.some((pattern) => pattern.test(text)))) return ruleFor("phoneCountryCode");
  if (/^tel-(?:area-code|local|local-prefix|local-suffix|extension)$/.test(autocomplete) ||
      signals.some((text) => /\b(?:area\s*code|extension)\b/i.test(text))) return null;
  if (autocomplete === "honorific-prefix" || autocomplete === "honorific-suffix") return null;
  if (signals.some((text) => ruleFor("phoneType").patterns.some((pattern) => pattern.test(text)))) return ruleFor("phoneType");

  const workdayRule = matchWorkdayAutomationRule(automationContext);
  if (workdayRule) return workdayRule;

  if (type === "file") {
    return /\b(?:resume|cv|curriculum vitae)\b/i.test(`${description} ${element.accept || ""}`)
      ? { key: "resume", label: "Resume", patterns: [] }
      : null;
  }

  if ((type === "radio" || type === "button" || element instanceof HTMLSelectElement) &&
      /\b(?:gender|race|ethnicity|veteran|disability|sexual orientation)\b/i.test(description)) {
    return { key: "eeoDecline", label: "Optional EEO question", patterns: [] };
  }

  if (type === "email" || autocomplete === "email") return ruleFor("email");
  if (type === "tel" || autocomplete === "tel" || autocomplete === "tel-national") return ruleFor("phone");
  if (autocomplete === "given-name") return ruleFor("firstName");
  if (autocomplete === "additional-name") return ruleFor("middleName");
  if (autocomplete === "family-name") return ruleFor("lastName");
  if (autocomplete === "name") return ruleFor("fullName");
  if (autocomplete === "address-level2") return ruleFor("city");
  if (autocomplete === "address-level1") return ruleFor("state");
  if (autocomplete === "country" || autocomplete === "country-name") return ruleFor("country");
  if (autocomplete === "postal-code") return ruleFor("pincode");
  if (autocomplete === "street-address") return ruleFor("address");
  if (autocomplete === "organization") return ruleFor("experience.company");
  if (autocomplete === "organization-title") return ruleFor("experience.title");

  for (const signal of signals) {
    const text = signal.replace(/[\s*:]+$/g, "");
    const rule = FIELD_RULES.find((item) => item.patterns.some((pattern) => pattern.test(text)));
    if (rule) return rule;
    if (/^(?:title|position|role)$/i.test(text)) return ruleFor("experience.title");
    if (/^(?:description|experience|work experience|employment history)$/i.test(text) &&
        (element.tagName === "TEXTAREA" || element.isContentEditable)) return ruleFor("experience.description");
    if (/\b(?:currently\s*work|current\s*(?:job|employment))\b/i.test(text)) return { key: "experience.current", label: "Currently work here" };
  }
  return null;
}

function matchWorkdayAutomationRule(context) {
  if (!context) return null;
  return WORKDAY_AUTOMATION_RULES.find((rule) => {
    if (!rule.pattern.test(context)) return false;
    return !rule.childPattern || rule.childPattern.test(context);
  }) || null;
}

function getAutomationContext(element) {
  const values = [];
  let current = element;
  for (let depth = 0; current && depth < 16; depth += 1, current = current.parentElement) {
    const automationId = current.getAttribute?.("data-automation-id");
    if (automationId) values.unshift(automationId);
  }
  return [...values, element.id || "", element.name || ""].join(" ");
}

function findWorkdayFieldGroup(element) {
  let current = element.parentElement;
  for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
    if (current.querySelectorAll("input:not([type='hidden']), textarea, select, button").length > 1) return null;
    if (current.querySelector("label, legend")) {
      return current;
    }
  }
  return null;
}

function findExperienceContainer(element, entries) {
  const isWork = (entry) => entry.match?.key?.startsWith("experience.") || ["currentCompany", "currentJobTitle"].includes(entry.match?.key);
  const workEntries = entries.filter(isWork);
  let container = null;
  for (let node = element.parentElement; node && node !== document.body && node.tagName !== "FORM"; node = node.parentElement) {
    const inside = workEntries.filter((entry) => node.contains(entry.element));
    const companies = inside.filter((entry) => ["experience.company", "currentCompany"].includes(entry.match.key)).length;
    const titles = inside.filter((entry) => ["experience.title", "currentJobTitle"].includes(entry.match.key)).length;
    if (companies > 1 || titles > 1) break;
    const hint = `${node.getAttribute("data-automation-id") || ""} ${node.id} ${node.className} ${node.querySelector(":scope > legend, :scope > h2, :scope > h3, :scope > h4")?.textContent || ""}`;
    const explicit = /work.?experience|employment|work.?history|experience.?card/i.test(hint) && !/formField/i.test(hint);
    if (entries.some((entry) => node.contains(entry.element) && entry.match && !isWork(entry) &&
      !(explicit && entry.match.key === "city"))) break;
    // IDs such as workExperience-4-startDate identify a field, not a job card.
    const heading = node.querySelector(":scope > legend, :scope > h2, :scope > h3, :scope > h4")?.textContent || "";
    if (explicit && /^(?:work\s*)?experience\s*\d*\s*$/i.test(heading.trim())) return node;
    if (inside.length > 1 && (companies || titles)) container = node;
  }
  return container;
}

function getExplicitExperienceIndex(container, element) {
  const heading = container.querySelector(":scope > legend, :scope > h2, :scope > h3, :scope > h4")?.textContent || "";
  // Internal Workday IDs (4, 16, ...) are opaque record keys, not company numbers.
  const numbered = heading.match(/(?:work\s*experience|employment|work\s*history)[\s_-]*(\d+)/i);
  if (numbered) return Math.max(0, Number(numbered[1]) - 1);
  const indexed = `${element.name || ""} ${element.id}`.match(/(?:workExperiences?|employment|experience)\[(\d+)\]/i);
  return indexed ? Number(indexed[1]) : null;
}

function workRecordIdentity(element) {
  const own = `${element.id || ""} ${element.name || ""} ${element.getAttribute("aria-labelledby") || ""}`;
  const match = own.match(/\bworkExperience[-_](\d+)(?=[-_\s.]|$)/i);
  if (match) return `workExperience-${match[1]}`;
  for (let node = element.parentElement; node && node.tagName !== "FORM"; node = node.parentElement) {
    const id = node.getAttribute("data-automation-id") || "";
    if (/^workExperience[-_]\d+$/i.test(id)) return id;
  }
  return null;
}

function isCustomDropdown(element) {
  const automationId = element.getAttribute("data-automation-id") || "";
  if (element.tagName === "INPUT" || element.tagName === "SELECT") return false;
  if (element.querySelector("input, select, textarea")) return false;
  return (element.tagName === "BUTTON" || element.getAttribute("role") === "combobox") && (
    element.getAttribute("role") === "combobox" ||
    element.getAttribute("aria-haspopup") === "listbox" ||
    element.getAttribute("aria-haspopup") === "tree" ||
    /dropdown|prompt/i.test(automationId) ||
    /countryRegion|phone-device-type|degree|school|fieldOfStudy|ethnicity|gender|hispanicOrLatino|veteranStatus|languageProficiency/i.test(automationId)
  );
}

function ruleFor(key) {
  return FIELD_RULES.find((rule) => rule.key === key);
}

async function fillField(fieldId, value, onlyIfEmpty = false) {
  const selector = `[${FIELD_ATTRIBUTE}="${CSS.escape(fieldId)}"]`;
  const element = document.querySelector(selector);

  if (!element) {
    return { ok: false, error: "The field is no longer available. Scan the page again." };
  }

  try {
    if (findSkillsContainer(element) && element.tagName === "INPUT") {
      return await fillSkillsField(element, String(value || ""));
    }
    if (onlyIfEmpty && getCurrentValue(element)) {
      return { ok: false, skipped: true };
    }
    if (!isFillableField(element)) throw new Error("This field is hidden or unavailable now. Scan the page again.");
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.focus({ preventScroll: true });
    const changedElement = await setElementValue(element, value);
    changedElement.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    changedElement.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    if (typeof changedElement.blur === "function") changedElement.blur();
    changedElement.style.outline = "2px solid #2563eb";
    changedElement.style.outlineOffset = "2px";
    window.setTimeout(() => {
      changedElement.style.outline = "";
      changedElement.style.outlineOffset = "";
    }, 1200);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || "Could not fill this field." };
  }
}

async function setElementValue(element, value) {
  if (element.type === "file") {
    if (!value?.base64) throw new Error("No resume is saved in your profile.");
    const response = await fetch(value.base64);
    const blob = await response.blob();
    const file = new File([blob], value.name || "resume.pdf", { type: value.type || blob.type });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    element.files = transfer.files;
    return element;
  }

  if (element.type === "radio") {
    const radios = element.name
      ? Array.from(document.querySelectorAll(`input[type="radio"][name="${CSS.escape(element.name)}"]`))
      : [element];
    const targetValue = String(value || "").trim().toLowerCase();
    const declineWords = ["decline to", "prefer not", "do not wish", "don't wish", "choose not"];
    const target = radios.find((radio) => {
      const optionText = getRadioOptionText(radio);
      if (targetValue === "prefer not to answer") {
        return declineWords.some((word) => optionText.includes(word));
      }
      if (targetValue === "yes" || targetValue === "no") {
        return new RegExp(`\\b${targetValue}\\b`, "i").test(optionText);
      }
      return optionText.includes(targetValue);
    });
    if (!target) throw new Error(`No “${value}” option was found.`);
    if (!target.checked) target.click();
    return target;
  }

  if (element.type === "checkbox") {
    const shouldCheck = value === true || /^(?:yes|true|current)$/i.test(String(value || ""));
    if (element.checked !== shouldCheck) element.click();
    return element;
  }

  if (isCustomDropdown(element) || isComboboxInput(element)) {
    await setCustomDropdownValue(element, String(value || ""));
    return element;
  }

  if (element instanceof HTMLSelectElement) {
    const option = chooseDropdownOption(Array.from(element.options), value,
      classifyField(element, getFieldDescription(element))?.key === "phoneCountryCode");
    if (!option) throw new Error(`No “${value}” option was found.`);
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
    if (setter) setter.call(element, option.value); else element.value = option.value;
    return element;
  }

  if (element.isContentEditable) {
    element.focus();
    element.textContent = String(value ?? "");
    return element;
  }

  const prototype = element instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  if (setter) {
    setter.call(element, String(value ?? ""));
  } else {
    element.value = String(value ?? "");
  }
  return element;
}

function getRadioOptionText(radio) {
  const parts = [radio.value || "", radio.getAttribute("aria-label") || ""];
  if (radio.labels?.length) {
    parts.push(...Array.from(radio.labels).map((label) => label.innerText || ""));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim().toLowerCase();
}

function isComboboxInput(element) {
  return element.tagName === "INPUT" && (
    element.getAttribute("role") === "combobox" ||
    element.hasAttribute("aria-autocomplete") ||
    element.getAttribute("aria-haspopup") === "listbox"
  );
}

async function setCustomDropdownValue(element, value) {
  if (!value) throw new Error("No saved value is available for this dropdown.");

  element.focus();
  if (isCustomDropdown(element)) {
    element.click();
  } else {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(element, value); else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    element.dispatchEvent(new KeyboardEvent("keydown", { key: value.slice(-1) || "a", bubbles: true }));
  }

  let options = await waitForDropdownOptions(element, element.tagName === "INPUT" ? 1600 : 500);
  const isPhoneCode = classifyField(element, getFieldDescription(element))?.key === "phoneCountryCode";
  let option = chooseDropdownOption(options, value, isPhoneCode);
  if (!option && isCustomDropdown(element)) {
    const searchInput = findVisibleDropdownSearch(element);
    if (searchInput) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      if (setter) setter.call(searchInput, value); else searchInput.value = value;
      searchInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      options = await waitForDropdownOptions(element, 1600);
      option = chooseDropdownOption(options, value, isPhoneCode);
    }
  }

  if (!option) throw new Error(`No “${value}” option was found. Choose it manually.`);
  option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, composed: true }));
  option.click();
}

async function waitForDropdownOptions(element, timeoutMs) {
  const endTime = Date.now() + timeoutMs;
  do {
    const options = findDropdownOptions(element);
    if (options.length) return options;
    await new Promise((resolve) => window.setTimeout(resolve, 80));
  } while (Date.now() < endTime);
  return [];
}

function findDropdownOptions(element) {
  const roots = findDropdownRoots(element);
  return roots.flatMap((root) => Array.from(root.querySelectorAll("[role='option'], li")))
    .filter((option) => {
      const style = window.getComputedStyle(option);
      return option.getClientRects().length > 0 && style.visibility !== "hidden" && style.display !== "none";
    });
}

function findVisibleDropdownSearch(element) {
  return findDropdownRoots(element)
    .flatMap((root) => Array.from(root.querySelectorAll("input[type='text'], input[type='search'], input[role='combobox']")))
    .find((input) => input.getClientRects().length > 0);
}

function findDropdownRoots(element) {
  const controlledId = element.getAttribute("aria-controls");
  const controlled = controlledId ? document.getElementById(controlledId) : null;
  if (controlled) return [controlled];

  const listboxes = Array.from(document.querySelectorAll("[role='listbox'], [role='tree']"))
    .filter((root) => root.getClientRects().length > 0);
  return listboxes.length ? listboxes : [];
}

function chooseDropdownOption(options, value, isPhoneCode = false) {
  const wanted = normalizeOptionText(value);
  if (!wanted) return null;
  const described = options.filter((option) => !option.disabled && option.getAttribute("aria-disabled") !== "true")
    .map((option) => ({ option, text: normalizeOptionText(option.innerText || option.textContent), value: normalizeOptionText(option.value) }))
    .filter((item) => item.text || item.value);
  const exact = described.find((item) => item.text === wanted || item.value === wanted);
  if (exact) return exact.option;
  if (isPhoneCode) {
    const dialCode = (text) => text.match(/\+(\d{1,3})(?!\d)/)?.[1] || (/^\d{1,3}$/.test(text) ? text : "");
    const code = dialCode(wanted);
    if (!code) return null;
    const matches = described.filter((item) => dialCode(item.text) === code || dialCode(item.value) === code);
    const country = wanted.replace(/\+?\d+|[()]/g, "").trim();
    const named = country ? matches.filter((item) => item.text.includes(country)) : [];
    return named.length === 1 ? named[0].option : matches.length === 1 ? matches[0].option : null;
  }
  const matches = described.filter((item) => {
    if (wanted === "prefer not to answer") return /decline to|prefer not|do not wish|don't wish|choose not/.test(item.text);
    if (wanted === "yes" || wanted === "no") return new RegExp(`^${wanted}\\b`).test(item.text);
    return wanted.length >= 3 && item.text.length >= 3 && (item.text.startsWith(`${wanted} `) || item.text.startsWith(`${wanted} (`));
  });
  return matches.length === 1 ? matches[0].option : null;
}

function normalizeOptionText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}
