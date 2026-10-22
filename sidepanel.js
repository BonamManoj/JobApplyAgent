const PROFILES_STORAGE_KEY = "applicationProfilesV2";
const ACTIVE_PROFILE_KEY = "activeApplicationProfileId";
const LEGACY_STORAGE_KEY = "applicationProfile";
const state = {
  profiles: [],
  activeProfileId: null,
  profile: {},
  detectedFields: [],
  activeTabId: null,
  scannedTabId: null,
  scanSequence: 0,
  experienceSelections: new Map()
};

const elements = {
  tabs: Array.from(document.querySelectorAll(".tab")),
  panels: Array.from(document.querySelectorAll(".panel")),
  profileSelect: document.querySelector("#profile-select"),
  addProfile: document.querySelector("#add-profile"),
  scanButton: document.querySelector("#scan-button"),
  fillAllButton: document.querySelector("#fill-all-button"),
  fillExperiencesButton: document.querySelector("#fill-experiences-button"),
  fieldList: document.querySelector("#detected-fields"),
  emptyState: document.querySelector("#empty-state"),
  scanSummary: document.querySelector("#scan-summary"),
  message: document.querySelector("#message"),
  profileForm: document.querySelector("#profile-form"),
  saveStatus: document.querySelector("#save-status"),
  workExperienceList: document.querySelector("#work-experience-list"),
  addExperience: document.querySelector("#add-experience"),
  resumeFile: document.querySelector("#resume-file"),
  resumeInfo: document.querySelector("#resume-info"),
  removeResume: document.querySelector("#remove-resume"),
  eeoDecline: document.querySelector("#eeo-decline")
};

initialize();

async function initialize() {
  bindEvents();
  await loadProfiles();
  await scanPage();
}

function bindEvents() {
  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  elements.profileSelect.addEventListener("change", switchProfile);
  elements.addProfile.addEventListener("click", addProfile);
  elements.addExperience.addEventListener("click", () => {
    const experiences = readWorkExperiences();
    experiences.push(blankExperience());
    renderWorkExperiences(experiences);
  });
  elements.scanButton.addEventListener("click", scanPage);
  elements.fillAllButton.addEventListener("click", fillAllRecognized);
  elements.fillExperiencesButton.addEventListener("click", fillAllExperiences);
  elements.profileForm.addEventListener("submit", saveProfile);
  elements.removeResume.addEventListener("click", removeSavedResume);

  chrome.tabs.onActivated.addListener(() => scanPage());
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (tabId === state.activeTabId && changeInfo.status === "complete") scanPage();
  });
}

async function loadProfiles() {
  const stored = await chrome.storage.local.get([
    PROFILES_STORAGE_KEY,
    ACTIVE_PROFILE_KEY,
    LEGACY_STORAGE_KEY
  ]);

  if (Array.isArray(stored[PROFILES_STORAGE_KEY]) && stored[PROFILES_STORAGE_KEY].length) {
    state.profiles = stored[PROFILES_STORAGE_KEY].map(normalizeProfile);
  } else {
    const seed = deepClone(globalThis.DEFAULT_PROFILES?.[0] || createBlankProfile("Profile 1", "profile-1"));
    state.profiles = [mergeLegacyProfile(seed, stored[LEGACY_STORAGE_KEY])];
  }

  const requestedId = stored[ACTIVE_PROFILE_KEY];
  state.activeProfileId = state.profiles.some((profile) => profile.id === requestedId)
    ? requestedId
    : state.profiles[0].id;
  state.profile = state.profiles.find((profile) => profile.id === state.activeProfileId);

  renderProfileSelector();
  populateProfileForm();
  await persistProfiles();
}

function mergeLegacyProfile(seed, legacy) {
  if (!legacy || typeof legacy !== "object") return normalizeProfile(seed);

  const lineBasedKeys = new Set([
    "companies", "jobTitles", "workLocations", "workStartDates",
    "workEndDates", "workDescriptions"
  ]);
  for (const [key, value] of Object.entries(legacy)) {
    if (lineBasedKeys.has(key)) continue;
    const seedIsBlank = seed[key] === "" || seed[key] === null || seed[key] === undefined;
    if (seedIsBlank && value !== "" && value !== null && value !== undefined) seed[key] = value;
  }

  const migratedExperiences = migrateLegacyExperiences(legacy);
  if (!seed.workExperiences?.length && migratedExperiences.length) seed.workExperiences = migratedExperiences;
  return normalizeProfile(seed);
}

function migrateLegacyExperiences(legacy) {
  const companies = splitLines(legacy.companies);
  const titles = splitLines(legacy.jobTitles);
  const locations = splitLines(legacy.workLocations);
  const starts = splitLines(legacy.workStartDates);
  const ends = splitLines(legacy.workEndDates);
  const descriptions = splitBlocks(legacy.workDescriptions);
  const length = Math.max(companies.length, titles.length, locations.length, starts.length, ends.length, descriptions.length);

  return Array.from({ length }, (_, index) => ({
    company: companies[index] || "",
    title: titles[index] || "",
    location: locations[index] || "",
    startDate: normalizeMonthValue(starts[index]),
    endDate: /^current$/i.test(ends[index] || "") ? "" : normalizeMonthValue(ends[index]),
    current: /^current$/i.test(ends[index] || ""),
    description: descriptions[index] || ""
  })).filter((experience) => Object.values(experience).some(Boolean));
}

function normalizeProfile(profile, index = 0) {
  const migrated = { ...(profile || {}) };
  const normalized = {
    ...migrated,
    id: migrated.id || `profile-${Date.now()}-${index}`,
    profileName: migrated.profileName || `Profile ${index + 1}`,
    workExperiences: Array.isArray(migrated.workExperiences)
      ? migrated.workExperiences.map((experience) => ({ ...blankExperience(), ...experience }))
      : []
  };
  if (!normalized.workExperiences.length) normalized.workExperiences = [blankExperience()];
  return normalized;
}

function createBlankProfile(name, id = `profile-${Date.now()}`) {
  return normalizeProfile({ id, profileName: name, workExperiences: [blankExperience()] });
}

function blankExperience() {
  return {
    company: "",
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: ""
  };
}

async function persistProfiles() {
  await chrome.storage.local.set({
    [PROFILES_STORAGE_KEY]: state.profiles,
    [ACTIVE_PROFILE_KEY]: state.activeProfileId
  });
}

function renderProfileSelector() {
  elements.profileSelect.replaceChildren();
  state.profiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.profileName;
    elements.profileSelect.append(option);
  });
  elements.profileSelect.value = state.activeProfileId;
}

function populateProfileForm() {
  for (const field of elements.profileForm.elements) {
    if (!field.name) continue;
    if (field.type === "checkbox") field.checked = Boolean(state.profile[field.name]);
    else field.value = state.profile[field.name] || "";
  }
  elements.resumeFile.value = "";
  renderWorkExperiences(state.profile.workExperiences);
  renderResumeStatus();
}

function collectProfileFromForm() {
  const formData = new FormData(elements.profileForm);
  const nextProfile = Object.fromEntries(formData.entries());
  nextProfile.id = state.profile.id;
  nextProfile.profileName = String(nextProfile.profileName || state.profile.profileName || "Profile").trim();
  nextProfile.eeoDecline = elements.eeoDecline.checked;
  nextProfile.workExperiences = readWorkExperiences();

  for (const key of ["resumeBase64", "resumeName", "resumeType"]) {
    if (state.profile[key]) nextProfile[key] = state.profile[key];
  }

  const currentJob = nextProfile.workExperiences.find((experience) => experience.current) || nextProfile.workExperiences[0];
  nextProfile.currentCompany = currentJob?.company || "";
  nextProfile.currentJobTitle = currentJob?.title || "";
  return normalizeProfile(nextProfile);
}

function commitCurrentForm() {
  const nextProfile = collectProfileFromForm();
  const index = state.profiles.findIndex((profile) => profile.id === state.activeProfileId);
  state.profiles[index] = nextProfile;
  state.profile = nextProfile;
}

async function switchProfile(event) {
  commitCurrentForm();
  state.experienceSelections.clear();
  state.activeProfileId = event.target.value;
  state.profile = state.profiles.find((profile) => profile.id === state.activeProfileId);
  await persistProfiles();
  populateProfileForm();
  renderDetectedFields();
}

async function addProfile() {
  commitCurrentForm();
  state.experienceSelections.clear();
  const number = state.profiles.length + 1;
  const profile = createBlankProfile(`Profile ${number}`, `profile-${Date.now()}`);
  state.profiles.push(profile);
  state.activeProfileId = profile.id;
  state.profile = profile;
  await persistProfiles();
  renderProfileSelector();
  populateProfileForm();
  switchTab("profile");
}

function renderWorkExperiences(experiences) {
  elements.workExperienceList.replaceChildren();
  experiences.forEach((experience, index) => {
    const card = document.createElement("article");
    card.className = "experience-card";
    card.dataset.experienceIndex = String(index);
    card.innerHTML = `
      <div class="experience-header">
        <span class="experience-title">Company ${index + 1}</span>
        <button class="text-button remove-experience" type="button">Remove</button>
      </div>
      <label>Company<input data-work-key="company"></label>
      <label>Job title<input data-work-key="title"></label>
      <label>Location<input data-work-key="location"></label>
      <div class="grid two-column">
        <label>Start date<input data-work-key="startDate" type="month"></label>
        <label>End date<input data-work-key="endDate" type="month"></label>
      </div>
      <label class="checkbox-label">
        <input data-work-key="current" type="checkbox"> I currently work here
      </label>
      <label>Role description<textarea data-work-key="description" rows="5"></textarea></label>
    `;

    for (const input of card.querySelectorAll("[data-work-key]")) {
      const key = input.dataset.workKey;
      if (input.type === "checkbox") input.checked = Boolean(experience[key]);
      else input.value = experience[key] || "";
    }

    const current = card.querySelector("[data-work-key='current']");
    const endDate = card.querySelector("[data-work-key='endDate']");
    const syncCurrent = () => {
      endDate.disabled = current.checked;
      if (current.checked) endDate.value = "";
    };
    current.addEventListener("change", syncCurrent);
    syncCurrent();

    card.querySelector(".remove-experience").addEventListener("click", () => {
      const next = readWorkExperiences().filter((_item, itemIndex) => itemIndex !== index);
      renderWorkExperiences(next.length ? next : [blankExperience()]);
    });
    elements.workExperienceList.append(card);
  });
}

function readWorkExperiences() {
  return Array.from(elements.workExperienceList.querySelectorAll(".experience-card")).map((card) => {
    const experience = blankExperience();
    for (const input of card.querySelectorAll("[data-work-key]")) {
      const key = input.dataset.workKey;
      experience[key] = input.type === "checkbox" ? input.checked : input.value.trim();
    }
    if (experience.current) experience.endDate = "";
    return experience;
  });
}

async function saveProfile(event) {
  event.preventDefault();
  elements.saveStatus.textContent = "Saving…";
  try {
    commitCurrentForm();
    const selectedResume = elements.resumeFile.files?.[0];
    if (selectedResume) {
      state.profile.resumeBase64 = await fileToDataUrl(selectedResume);
      state.profile.resumeName = selectedResume.name;
      state.profile.resumeType = selectedResume.type;
      const index = state.profiles.findIndex((profile) => profile.id === state.activeProfileId);
      state.profiles[index] = state.profile;
    }
    await persistProfiles();
    elements.resumeFile.value = "";
    renderProfileSelector();
    renderResumeStatus();
    renderDetectedFields();
    elements.saveStatus.textContent = "Saved";
    window.setTimeout(() => { elements.saveStatus.textContent = ""; }, 1800);
    switchTab("detected");
  } catch (error) {
    elements.saveStatus.textContent = "Could not save";
    showMessage(error.message || "Could not save this profile.");
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Could not read the selected resume."));
    reader.readAsDataURL(file);
  });
}

async function removeSavedResume() {
  delete state.profile.resumeBase64;
  delete state.profile.resumeName;
  delete state.profile.resumeType;
  elements.resumeFile.value = "";
  const index = state.profiles.findIndex((profile) => profile.id === state.activeProfileId);
  state.profiles[index] = state.profile;
  await persistProfiles();
  renderResumeStatus();
  renderDetectedFields();
}

function renderResumeStatus() {
  const hasResume = Boolean(state.profile.resumeBase64);
  elements.resumeInfo.textContent = hasResume
    ? `Saved: ${state.profile.resumeName || "resume"}`
    : "No resume saved.";
  elements.removeResume.hidden = !hasResume;
}

function switchTab(tabName) {
  elements.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  elements.panels.forEach((panel) => panel.classList.toggle("active", panel.id === `${tabName}-panel`));
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  state.activeTabId = tab?.id || null;
  return tab;
}

async function scanPage() {
  const sequence = ++state.scanSequence;
  setBusy(true);
  hideMessage();
  try {
    const tab = await getActiveTab();
    if (!tab?.id || !/^(https?|file):/i.test(tab.url || "")) {
      throw new Error("Open a normal website or an allowed local HTML file containing an application form.");
    }
    const response = await chrome.tabs.sendMessage(tab.id, { type: "SCAN_FIELDS" });
    if (sequence !== state.scanSequence) return;
    if (!response?.ok) throw new Error("The page did not return any scan results. Refresh it and scan again.");
    if (state.scannedTabId !== tab.id) state.experienceSelections.clear();
    state.scannedTabId = tab.id;
    state.detectedFields = deduplicateFields(response?.fields || []);
    state.canAddExperience = Boolean(response?.canAddExperience);
    renderDetectedFields();
  } catch (error) {
    if (sequence !== state.scanSequence) return;
    state.detectedFields = [];
    state.canAddExperience = false;
    renderDetectedFields();
    showMessage(readableError(error));
  } finally {
    if (sequence === state.scanSequence) setBusy(false);
  }
}

function deduplicateFields(fields) {
  const seen = new Set();
  return fields.filter((field) => {
    const identity = `${field.frameUrl}|${field.fieldId}`;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

function renderDetectedFields() {
  elements.fieldList.replaceChildren();
  const fields = state.detectedFields;
  const recognized = fields.filter((field) => getValueForField(field));
  elements.emptyState.hidden = fields.length > 0;
  elements.fillAllButton.hidden = recognized.length === 0;
  elements.fillExperiencesButton.hidden = !state.profile.workExperiences?.some((item) => item.company) ||
    (!state.canAddExperience && !fields.some((field) => field.experienceGroup));
  elements.scanSummary.textContent = fields.length
    ? `${recognized.length} ready to fill · ${fields.length} visible fields found`
    : "No visible form fields found on this page.";
  const renderedGroups = new Map();
  fields.forEach((field) => {
    if (!field.experienceGroup) {
      elements.fieldList.append(createFieldCard(field));
      return;
    }
    let group = renderedGroups.get(field.experienceGroup);
    if (!group) {
      group = createExperienceGroup(field);
      renderedGroups.set(field.experienceGroup, group);
      elements.fieldList.append(group);
    }
    group.append(createFieldCard(field));
  });
}

function selectedExperienceIndex(field) {
  const selected = state.experienceSelections.get(field.experienceGroup);
  if (selected !== undefined) return selected;
  // Existing employer text is stronger evidence than the order of visible fields.
  const companyField = state.detectedFields.find((item) => item.experienceGroup === field.experienceGroup && item.dataKey === "experience.company");
  const company = String(companyField?.currentValue || "").trim().toLowerCase();
  const matches = (state.profile.workExperiences || []).map((item, index) => ({ item, index }))
    .filter(({ item }) => company && item.company.trim().toLowerCase() === company);
  return matches.length === 1 ? matches[0].index : (field.experienceIndex ?? field.occurrence ?? 0);
}

function createExperienceGroup(field) {
  const group = document.createElement("section");
  group.className = "detected-experience";
  const label = document.createElement("label");
  label.textContent = `Work entry ${(field.experienceIndex ?? 0) + 1} — use saved company`;
  const select = document.createElement("select");
  const empty = document.createElement("option");
  empty.value = "-1";
  empty.textContent = "Choose a company";
  select.append(empty);
  (state.profile.workExperiences || []).forEach((experience, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index + 1}. ${experience.company || "Unnamed company"}${experience.title ? ` — ${experience.title}` : ""}`;
    select.append(option);
  });
  const index = selectedExperienceIndex(field);
  select.value = state.profile.workExperiences?.[index] ? String(index) : "-1";
  select.addEventListener("change", () => {
    state.experienceSelections.set(field.experienceGroup, Number(select.value));
    renderDetectedFields();
  });
  label.append(select);
  group.append(label);
  return group;
}

function createFieldCard(field) {
  const value = getValueForField(field);
  const card = document.createElement("article");
  card.className = `field-card${field.dataKey ? "" : " unknown-card"}`;

  const details = document.createElement("div");
  details.className = "field-details";
  const label = document.createElement("div");
  label.className = "field-label";
  label.textContent = displayNameForField(field);
  if (field.required) {
    const required = document.createElement("span");
    required.className = "required-mark";
    required.textContent = " *";
    required.title = "Required";
    label.append(required);
  }

  const valueLine = document.createElement("div");
  valueLine.className = "field-value";
  valueLine.textContent = formatValue(value) || (field.dataKey ? "Not saved in this profile" : "Not recognized yet");
  const source = document.createElement("div");
  source.className = "field-source";
  source.title = field.rawLabel;
  source.textContent = field.rawLabel;
  details.append(label, valueLine, source);
  card.append(details);

  if (value) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button secondary small";
    button.textContent = field.dataKey === "resume" ? "Attach" : "Fill";
    button.addEventListener("click", () => fillOneField(field, value, button));
    card.append(button);
  } else if (field.dataKey) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button secondary small";
    button.textContent = "Add";
    button.addEventListener("click", () => switchTab("profile"));
    card.append(button);
  }
  return card;
}

function displayNameForField(field) {
  const experienceLabels = {
    "experience.company": "Company",
    "experience.title": "Job title",
    "experience.location": "Work location",
    "experience.startMonth": "Start month",
    "experience.startYear": "Start year",
    "experience.endMonth": "End month",
    "experience.endYear": "End year",
    "experience.startDate": "Start date",
    "experience.endDate": "End date",
    "experience.current": "Currently work here",
    "experience.description": "Role description"
  };
  if (experienceLabels[field.dataKey]) return experienceLabels[field.dataKey];
  if (field.dataKey === "website.url") return `Website ${field.occurrence + 1}`;
  return field.displayLabel;
}

function getValueForField(field) {
  return resolveProfileField(state.profile, field, selectedExperienceIndex(field));
}

function normalizeMonthValue(value) {
  const date = parseMonthYear(value);
  return date.year && date.month ? `${date.year}-${String(date.month).padStart(2, "0")}` : "";
}

function formatValue(value) {
  if (!value) return "";
  if (typeof value === "object") return value.name || "Saved resume";
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  if (value === "prefer not to answer") return "Prefer not to answer";
  return value;
}

function splitLines(value) {
  return String(value || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function splitBlocks(value) {
  return String(value || "").split(/^\s*---\s*$/m).map((item) => item.trim()).filter(Boolean);
}

async function fillOneField(field, value, button) {
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = field.dataKey === "skills" ? "Adding skills…" : "Filling…";
  hideMessage();
  try {
    const response = await sendToActivePage({ type: "FILL_FIELD", fieldId: field.fieldId, value });
    if (!response?.ok) throw new Error(response?.error || "Could not fill the field.");
    if (response.warning) showMessage(response.warning);
    button.textContent = "Filled";
    window.setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 1100);
  } catch (error) {
    button.disabled = false;
    button.textContent = originalText;
    showMessage(readableError(error));
  }
}

async function fillAllRecognized() {
  const fields = state.detectedFields
    .map((field) => ({ fieldId: field.fieldId, value: getValueForField(field) }))
    .filter((field) => field.value);
  if (!fields.length) return;

  elements.fillAllButton.disabled = true;
  hideMessage();
  try {
    const response = await sendToActivePage({ type: "FILL_FIELDS", fields });
    if (!response?.ok) throw new Error("The page did not accept the saved values.");
    if (response.failed) showMessage(`${response.failed} field(s) could not be filled. ${response.errors?.[0] || "Review the remaining fields."}`);
    else if (response.warnings?.length) showMessage(response.warnings.join(" "));
    elements.fillAllButton.textContent = response.skipped
      ? `Filled ${response.filled} · kept ${response.skipped}`
      : `Filled ${response.filled} fields`;
    window.setTimeout(() => {
      elements.fillAllButton.textContent = "Fill all recognized fields";
      elements.fillAllButton.disabled = false;
    }, 1400);
  } catch (error) {
    elements.fillAllButton.disabled = false;
    showMessage(readableError(error));
  }
}

async function sendToActivePage(message) {
  const tab = await getActiveTab();
  if (!tab?.id) throw new Error("No active page was found.");
  if (tab.id !== state.scannedTabId) throw new Error("The active page changed. Scan this page before filling it.");
  return chrome.tabs.sendMessage(tab.id, message);
}

async function fillAllExperiences() {
  const button = elements.fillExperiencesButton;
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Filling work experience…";
  elements.fillAllButton.disabled = true;
  hideMessage();
  try {
    const response = await sendToActivePage({ type: "FILL_EXPERIENCES", workExperiences: state.profile.workExperiences,
      selections: Object.fromEntries(state.experienceSelections) });
    if (response?.fields) { state.detectedFields = deduplicateFields(response.fields); renderDetectedFields(); }
    const summary = `Processed ${response?.completed || 0} company entries; added ${response?.added || 0} new entries.`;
    showMessage(response?.ok ? summary : `${summary} ${response?.error || "Could not complete work experience."}`);
  } catch (error) { showMessage(readableError(error)); }
  finally { button.disabled = false; button.textContent = originalText; elements.fillAllButton.disabled = false; }
}

function setBusy(isBusy) {
  elements.scanButton.disabled = isBusy;
  elements.scanButton.textContent = isBusy ? "Scanning…" : "Scan page";
}

function showMessage(text) {
  elements.message.textContent = text;
  elements.message.hidden = false;
}

function hideMessage() {
  elements.message.hidden = true;
  elements.message.textContent = "";
}

function readableError(error) {
  const message = error?.message || String(error);
  if (message.includes("Receiving end does not exist")) {
    return "This page was opened before the extension was installed. Refresh it once, then scan again.";
  }
  if (message.includes("Cannot access")) return "Chrome does not allow extensions to read this page.";
  return message;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
