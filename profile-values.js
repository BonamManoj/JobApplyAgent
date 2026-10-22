// Shared by the side panel and regression tests. Saved profiles are never mutated here.
function resolveProfileField(profile, field, experienceIndex = field.experienceIndex ?? field.occurrence ?? 0) {
  if (!field.dataKey) return "";
  const experience = profile.workExperiences?.[experienceIndex];
  if (field.dataKey === "currentCompany" || field.dataKey === "currentJobTitle") {
    const current = profile.workExperiences?.find((item) => item.current) || profile.workExperiences?.[0];
    return current?.[field.dataKey === "currentCompany" ? "company" : "title"] || "";
  }
  if (field.dataKey.startsWith("experience.")) {
    const key = field.dataKey.slice("experience.".length);
    if (!experience) return "";
    if (key === "current") return experience.current ? "yes" : "no";
    if (key.startsWith("start") || key.startsWith("end")) {
      if (key.startsWith("end") && experience.current) return "";
      const date = parseMonthYear(experience[key.startsWith("start") ? "startDate" : "endDate"]);
      if (key.endsWith("Date")) return date.year && date.month ? `${date.year}-${date.month.padStart(2, "0")}` : "";
      return key.endsWith("Month") ? date.month : date.year;
    }
    return String(experience[key] || "").trim();
  }
  if (field.dataKey === "phoneCountryCode") {
    const saved = String(profile.phoneCountryCode || "").trim();
    const code = extractDialCode(saved);
    if (field.fieldType === "select" || field.fieldType === "button" || field.isCustomDropdown) return saved;
    return code ? (field.fieldType === "number" ? code.slice(1) : code) : "";
  }
  if (field.dataKey === "phone") {
    const saved = String(profile.phone || "").trim();
    const code = extractDialCode(profile.phoneCountryCode);
    const digits = saved.replace(/\D/g, "");
    const international = /^(?:\+|00)/.test(saved);
    const internationalDigits = saved.startsWith("00") ? digits.slice(2) : digits;
    if (field.hasSeparatePhoneCode || field.autocomplete === "tel-national") {
      const codeDigits = code.slice(1);
      const national = code && internationalDigits.startsWith(codeDigits) &&
        (international || internationalDigits.length > 10)
        ? internationalDigits.slice(codeDigits.length)
        : digits;
      return national;
    }
    return saved;
  }
  if (field.dataKey === "website.url") {
    return [profile.linkedIn, profile.github, profile.portfolio]
      .map((value) => String(value || "").trim()).filter(Boolean)[field.occurrence] || "";
  }
  if (field.dataKey === "resume") {
    return profile.resumeBase64 ? { base64: profile.resumeBase64, name: profile.resumeName, type: profile.resumeType } : "";
  }
  if (field.dataKey === "eeoDecline") return profile.eeoDecline ? "prefer not to answer" : "";
  return String(profile[field.dataKey] || "").trim();
}

function extractDialCode(value) {
  const text = String(value || "").trim();
  const plus = text.match(/\+(\d{1,3})(?!\d)/);
  if (plus) return `+${plus[1]}`;
  return /^\d{1,3}$/.test(text) ? `+${text}` : "";
}

function parseMonthYear(value) {
  const text = String(value || "").trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})$/);
  if (iso) return { month: String(Number(iso[2])), year: iso[1] };
  const numeric = text.match(/^(\d{1,2})[\/-](\d{4})$/);
  if (numeric) return { month: String(Number(numeric[1])), year: numeric[2] };
  return /^\d{4}$/.test(text) ? { month: "", year: text } : { month: "", year: "" };
}
