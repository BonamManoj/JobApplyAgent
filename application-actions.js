// Portal actions run only after an explicit Fill click in the side panel.
function isVisibleAction(element) {
  return element && !element.disabled && element.getAttribute("aria-disabled") !== "true" &&
    element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
}

async function waitUntil(read, timeout = 3000) {
  const deadline = Date.now() + timeout;
  do {
    const result = read();
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, 100));
  } while (Date.now() < deadline);
  return null;
}

function experienceGroups(fields = scanFields()) {
  const groups = new Map();
  for (const field of fields) {
    if (!field.experienceGroup) continue;
    if (!groups.has(field.experienceGroup)) groups.set(field.experienceGroup, []);
    groups.get(field.experienceGroup).push(field);
  }
  return groups;
}

function fieldElement(field) {
  return document.querySelector(`[${FIELD_ATTRIBUTE}="${CSS.escape(field.fieldId)}"]`);
}

function findAddExperienceButton(groups = experienceGroups()) {
  const buttons = Array.from(document.querySelectorAll("button, [role='button']"))
    .filter((button) => isVisibleAction(button) && button.type !== "submit")
    .filter((button) => /^add(?: another)?(?: work experience| experience)?$/i.test((button.textContent || "").trim()));
  const explicit = buttons.filter((button) => /work\s*experience/i.test(`${button.textContent} ${button.getAttribute("aria-label") || ""}`));
  if (explicit.length === 1) return explicit[0];
  const sections = Array.from(document.querySelectorAll("section, fieldset, [data-automation-id], [role='group'], div"))
    .filter((node) => {
      const heading = node.querySelector(":scope > h2, :scope > h3, :scope > h4, :scope > legend");
      const labelled = (node.getAttribute("aria-labelledby") || "").split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent || "").join(" ");
      const hint = `${heading?.textContent || ""} ${labelled} ${node.getAttribute("data-automation-id") || ""}`;
      return /work\s*experience|workExperience|employment\s*history/i.test(hint) &&
        !/formField/i.test(hint) && !/\beducation\b/i.test(hint);
    });
  const candidates = new Set();
  for (const section of sections) {
    // Do not cross into another repeated section (education, certifications, etc.).
    if (Array.from(section.querySelectorAll("h2,h3,legend")).some((heading) => /^(?:education|certifications|languages)$/i.test(heading.textContent.trim()))) continue;
    const inside = buttons.filter((button) => section.contains(button));
    if (inside.length === 1) candidates.add(inside[0]);
  }
  if (candidates.size === 1) return [...candidates][0];
  // Some portals omit semantic headings: use the nearest wrapper with work fields only.
  for (const fields of groups.values()) {
    for (let node = fieldElement(fields[0])?.parentElement; node && node.tagName !== "FORM" && node !== document.body; node = node.parentElement) {
      const inside = buttons.filter((button) => node.contains(button));
      if (inside.length > 1) break;
      if (inside.length === 1 && /workExperience|work-experience/i.test(`${node.id} ${node.getAttribute("data-automation-id") || ""}`)) candidates.add(inside[0]);
    }
  }
  return candidates.size === 1 ? [...candidates][0] : null;
}

async function fillSavedExperiences(experiences, selections = {}) {
  const saved = experiences.map((item, index) => ({ ...item, index })).filter((item) => String(item.company || "").trim());
  if (!saved.length) return { ok: false, error: "Save a company in My profile first." };
  const profile = { workExperiences: experiences };
  const used = new Set();
  const assigned = new Set();
  const errors = [];
  let added = 0;
  let filled = 0;
  let completed = 0;

  async function fillGroup(groupId, experience) {
    assigned.add(groupId);
    used.add(experience.index);
    const initialFields = experienceGroups().get(groupId) || [];
    const preferredOrder = [
      "experience.company", "experience.title", "experience.location", "experience.current",
      "experience.startMonth", "experience.startYear", "experience.startDate",
      "experience.endMonth", "experience.endYear", "experience.endDate", "experience.description"
    ];
    const keys = [...new Set(initialFields.map((field) => field.dataKey))]
      .sort((a, b) => {
        const ai = preferredOrder.indexOf(a);
        const bi = preferredOrder.indexOf(b);
        return (ai < 0 ? preferredOrder.length : ai) - (bi < 0 ? preferredOrder.length : bi);
      });
    for (const key of keys) {
      // Frameworks can replace date controls after Current employment is clicked.
      const currentFields = experienceGroups().get(groupId);
      const field = currentFields?.find((item) => item.dataKey === key);
      if (!field) continue;
      const value = resolveProfileField(profile, field, experience.index);
      if (!value) continue;
      // This dedicated action intentionally repairs incorrect values left by a
      // resume import or an earlier fill. The generic Fill all remains non-destructive.
      const result = await fillField(field.fieldId, value, false);
      if (result.ok) filled++;
      else if (!result.skipped) errors.push(`${experience.company}: ${result.error}`);
    }
    const after = experienceGroups().get(groupId) || [];
    const employer = after.find((field) => field.dataKey === "experience.company");
    if (normalizeOptionText(employer?.currentValue) !== normalizeOptionText(experience.company)) {
      throw new Error(`Could not verify ${experience.company} in its company field. Review this entry before continuing.`);
    }
    completed++;
  }

  try {
    // Match existing employers first, regardless of their order in the form.
    for (const [groupId, fields] of experienceGroups()) {
      const company = normalizeOptionText(fields.find((field) => field.dataKey === "experience.company")?.currentValue);
      if (!company) continue;
      const matches = saved.filter((item) => normalizeOptionText(item.company) === company);
      if (matches.length !== 1 || used.has(matches[0].index)) {
        continue;
      }
      await fillGroup(groupId, matches[0]);
    }
    for (const [groupId, fields] of experienceGroups()) {
      if (assigned.has(groupId)) continue;
      if (!fields.some((field) => field.dataKey === "experience.company")) continue;
      const selected = selections[groupId];
      const available = saved.filter((item) => !used.has(item.index));
      const target = selected !== undefined ? available.find((item) => item.index === selected) : available[0];
      if (!target) continue;
      await fillGroup(groupId, target);
    }
    for (const target of saved.filter((item) => !used.has(item.index))) {
      const before = experienceGroups();
      const add = findAddExperienceButton(before);
      if (!add) throw new Error(`Could not find an unambiguous Work Experience “Add another” button for ${target.company}. Add that entry manually, then scan again.`);
      add.click();
      added++;
      const created = await waitUntil(() => [...experienceGroups()].find(([id, fields]) =>
        !before.has(id) && fields.some((field) => field.dataKey === "experience.company") &&
        fields.some((field) => field.dataKey === "experience.title")), 5000);
      if (!created) throw new Error("Clicked Add another, but a new work entry did not appear. Scan again before retrying.");
      await fillGroup(created[0], target);
    }
  } catch (error) { errors.push(error.message); }
  return { ok: errors.length === 0, completed, added, filled, error: errors.join(" "), fields: scanFields() };
}

function findSkillsContainer(element) {
  if (element.tagName !== "INPUT" && element.tagName !== "TEXTAREA") return null;
  for (let node = element.parentElement; node && node !== document.body && node.tagName !== "FORM"; node = node.parentElement) {
    const heading = node.querySelector(":scope > h2, :scope > h3, :scope > legend, :scope > label");
    const hint = `${node.getAttribute("data-automation-id") || ""} ${node.id}`;
    if (/^(?:technical\s+)?skills\s*\*?$/i.test(heading?.textContent.trim() || "") ||
        /(?:formField[-_]skills|skillsSection|skillSection|^skills$)/i.test(hint.trim())) return node;
  }
  if (getFieldSignals(element).some((text) => /\b(?:skills|type to add skills)\b/i.test(text))) {
    let best = element.parentElement;
    let candidate = element.parentElement;
    for (let depth = 0; candidate && depth < 7 && candidate !== document.body && candidate.tagName !== "FORM"; depth += 1, candidate = candidate.parentElement) {
      const controls = candidate.querySelectorAll("input:not([type='hidden']), textarea").length;
      if (controls > 1) break;
      if (/\bskills?\b/i.test(`${candidate.id} ${candidate.getAttribute("data-automation-id") || ""} ${candidate.textContent || ""}`)) best = candidate;
    }
    return best;
  }
  return null;
}

function selectedSkillNames(container) {
  return Array.from(container.querySelectorAll([
    "[data-automation-id='selectedItem']", "[data-automation-id*='selectedSkill']",
    "[data-skill]", "[role='option'][aria-selected='true']", "button[aria-label^='Remove ']"
  ].join(",")))
    .map((node) => normalizeOptionText(node.getAttribute("data-skill") ||
      (node.getAttribute("aria-label") || "").replace(/^remove(?:\s+skill)?[:\s]+/i, "").replace(/\s+from\s+skills$/i, "") || labelText(node)))
    .filter(Boolean);
}

function skillOptionText(node) {
  return normalizeOptionText(node.getAttribute("aria-label") || node.getAttribute("data-value") ||
    node.getAttribute("title") || labelText(node) || node.textContent);
}

function clearSkillSearch(input) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (setter) setter.call(input, ""); else input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
}

async function fillSkillsField(initialInput, value) {
  const container = findSkillsContainer(initialInput);
  if (!container || !isFillableField(initialInput)) return { ok: false, error: "The skills picker is unavailable. Scan again." };
  const skills = [...new Map(value.split(/[,;\n]+/).map((skill) => skill.trim()).filter(Boolean)
    .map((skill) => [normalizeOptionText(skill), skill])).values()];
  const missing = [];
  let added = 0;
  let kept = 0;
  for (const skill of skills) {
    if (!container.isConnected) { missing.push(skill); continue; }
    if (selectedSkillNames(container).includes(normalizeOptionText(skill))) { kept++; continue; }
    const input = initialInput.isConnected ? initialInput : container.querySelector("input:not([type='hidden'])");
    if (!input || !isFillableField(input)) { missing.push(skill); continue; }
    input.focus();
    clearSkillSearch(input);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, skill);
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    const option = await waitUntil(() => {
      const roots = findDropdownRoots(input);
      const candidates = roots.length ? roots : [container];
      const options = candidates.flatMap((root) => Array.from(root.querySelectorAll([
        "[role='option']", "[data-automation-id='promptOption']",
        "[data-automation-id*='searchResult']", "[data-automation-id*='promptOption']"
      ].join(","))))
        .filter(isVisibleAction).filter((node) => node.getAttribute("aria-selected") !== "true")
        .filter((node) => skillOptionText(node) === normalizeOptionText(skill));
      return options.length === 1 ? options[0] : null;
    }, 3500);
    if (!option) { missing.push(skill); clearSkillSearch(input); continue; }
    option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, composed: true }));
    option.click();
    let confirmed = await waitUntil(() => selectedSkillNames(container).includes(normalizeOptionText(skill)), 1600);
    if (!confirmed && input.isConnected) {
      // Some Workday tenants expose the exact result but accept it only through Enter.
      input.focus();
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", bubbles: true }));
      confirmed = await waitUntil(() => selectedSkillNames(container).includes(normalizeOptionText(skill)), 1600);
    }
    if (confirmed) added++;
    else missing.push(skill);
    clearSkillSearch(input);
  }
  const input = initialInput.isConnected ? initialInput : container.querySelector("input:not([type='hidden'])");
  if (input) {
    clearSkillSearch(input);
    input.blur();
  }
  const message = `Skills: ${added} added, ${kept} already selected.${missing.length ? ` Could not select: ${missing.join(", ")}.` : ""}`;
  return { ok: missing.length === 0 || added + kept > 0, warning: missing.length ? message : "", error: added + kept === 0 ? message : "", added, kept, missing };
}
