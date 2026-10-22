const testProfile = window.testProfile = {
  id: "test-profile", profileName: "Synthetic test profile",
  firstName: "Test", lastName: "Candidate", phone: "+91 98765 43210", phoneCountryCode: "India (+91)",
  workExperiences: [
    { company: "Alpha", title: "Engineer", description: "Alpha responsibilities only.", location: "Pune", current: true, startDate: "2024-07", endDate: "" },
    { company: "Beta", title: "Developer", description: "Beta responsibilities only.", location: "Hyderabad", current: false, startDate: "2023-06", endDate: "2024-07" }
  ]
};
const results = [];
const fixture = document.getElementById("fixture");
function equal(actual, expected, reason) {
  if (actual !== expected) throw new Error(`${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
}
function field(id, fields = scanFields()) {
  const target = document.getElementById(id);
  const found = fields.find((item) => item.fieldId === target.getAttribute("data-application-paste-id"));
  if (!found) throw new Error(`No scanned field for ${id}`);
  return found;
}
async function test(name, run) {
  try { await run(); results.push({ name, ok: true }); }
  catch (error) { results.push({ name, ok: false, error: error.message }); }
}
async function fillFromProfile(id, fields = scanFields(), index) {
  const found = field(id, fields);
  const value = resolveProfileField(testProfile, found, index ?? found.experienceIndex ?? 0);
  const result = await fillField(found.fieldId, value);
  equal(result.ok, true, `Fill ${id}: ${result.error || ""}`);
}
const workEntry = (number, { missingTitle = false, missingDescription = false } = {}) => `<fieldset><legend>Work Experience ${number}</legend>
  <div><label>Company<input id="company${number}" name="experience[${number - 1}].companyName"></label>
  ${missingTitle ? "" : `<label>Job title<input id="title${number}" name="experience[${number - 1}].jobTitle"></label>`}</div>
  <label>Location<input id="location${number}"></label>
  <label>Start date<input id="start${number}" type="month"></label>
  <label>End year<input id="end${number}" inputmode="numeric"></label>
  ${missingDescription ? "" : `<label>Role description<textarea id="description${number}"></textarea></label>`}</fieldset>`;

(async () => {
  await test("Split phone inputs distinguish code from type=tel number", async () => {
    fixture.innerHTML = `<form><label>Country code<input id="code" type="tel"></label><label>Phone number<input id="phone" type="tel"></label></form>`;
    equal(field("code").dataKey, "phoneCountryCode", "Country code classification");
    await fillFromProfile("code"); await fillFromProfile("phone");
    equal(document.getElementById("code").value, "+91", "Country code");
    equal(document.getElementById("phone").value, "9876543210", "National phone number");
  });
  await test("Autocomplete tokens and camelCase phone identifiers", async () => {
    fixture.innerHTML = `<input id="phoneCountryCode" type="tel"><input id="code" type="tel" autocomplete="section-contact tel-country-code"><input id="national" type="tel" autocomplete="section-contact tel-national"><input id="extension" type="tel" autocomplete="tel-extension">`;
    equal(field("phoneCountryCode").dataKey, "phoneCountryCode", "Camel case");
    equal(field("code").dataKey, "phoneCountryCode", "Autocomplete");
    equal(resolveProfileField(testProfile, field("national")), "9876543210", "National phone");
    equal(field("extension").dataKey, null, "Extension must not receive whole phone");
  });
  await test("Workday legal names split given, middle and family while local names stay blank", async () => {
    fixture.innerHTML = `<form data-automation-id="legalNameSection">
      <label>Given Name(s)*<input id="given" data-automation-id="legalNameSection_firstName"></label>
      <label>Middle Name<input id="middle" data-automation-id="legalNameSection_middleName"></label>
      <label>Family Name*<input id="family" data-automation-id="legalNameSection_lastName"></label>
      <div data-automation-id="localNameSection"><label>Local Given Name(s)<input id="local-given" data-automation-id="localNameSection_firstName"></label>
      <label>Local Family Name<input id="local-family" data-automation-id="localNameSection_lastName"></label></div></form>`;
    const profile = { firstName: "Jordan", middleName: "Alex", lastName: "Taylor", workExperiences: [] };
    const fields = scanFields();
    equal(field("given", fields).dataKey, "firstName", "Given name");
    equal(field("middle", fields).dataKey, "middleName", "Middle name");
    equal(field("family", fields).dataKey, "lastName", "Family name");
    equal(field("local-given", fields).dataKey, null, "Local given remains blank");
    equal(field("local-family", fields).dataKey, null, "Local family remains blank");
    for (const id of ["given", "middle", "family"]) {
      const item = field(id, fields);
      await fillField(item.fieldId, resolveProfileField(profile, item));
    }
    equal(document.getElementById("given").value, "Jordan", "Given value");
    equal(document.getElementById("middle").value, "Alex", "Middle value");
    equal(document.getElementById("family").value, "Taylor", "Family value");
    equal(document.getElementById("local-given").value, "", "Local given value");
  });
  await test("Separate phone code always receives a national number without +91", async () => {
    fixture.innerHTML = `<form><label>Country Phone Code<input id="code" type="tel"></label><label>Phone Number<input id="phone" type="tel"></label></form>`;
    const fields = scanFields();
    const profile = { phone: "+1 202-555-0123", phoneCountryCode: "United States (+1)", workExperiences: [] };
    await fillField(field("code", fields).fieldId, resolveProfileField(profile, field("code", fields)));
    await fillField(field("phone", fields).fieldId, resolveProfileField(profile, field("phone", fields)));
    equal(document.getElementById("code").value, "+1", "Country code value");
    equal(document.getElementById("phone").value, "2025550123", "National number value");
  });
  await test("Country phone dropdown matches saved India (+91) to differently formatted option", async () => {
    fixture.innerHTML = `<label>Dialing code<select id="code"><option value="">Choose</option><option value="GB">United Kingdom (+44)</option><option value="IN">+91 India</option></select></label>`;
    await fillFromProfile("code");
    equal(document.getElementById("code").value, "IN", "Selected country");
  });
  await test("Numeric country code and standalone international number", async () => {
    fixture.innerHTML = `<form><label>ISD code<input id="code" type="number"></label></form><form><label>Phone<input id="phone" type="tel"></label></form>`;
    await fillFromProfile("code"); await fillFromProfile("phone");
    equal(document.getElementById("code").value, "91", "Numeric code");
    equal(document.getElementById("phone").value, testProfile.phone, "International number preserved");
  });
  await test("Missing title or description does not shift the second employer", async () => {
    fixture.innerHTML = `<form>${workEntry(1, { missingTitle: true, missingDescription: true })}${workEntry(2)}</form>`;
    const fields = scanFields();
    for (const id of ["company1", "company2", "title2", "description2", "location2", "start2", "end2"]) await fillFromProfile(id, fields);
    equal(document.getElementById("company1").value, "Alpha", "First employer");
    equal(document.getElementById("company2").value, "Beta", "Second employer");
    equal(document.getElementById("title2").value, "Developer", "Second title");
    equal(document.getElementById("description2").value, "Beta responsibilities only.", "Second description");
    equal(document.getElementById("location2").value, "Hyderabad", "Second location");
    equal(document.getElementById("start2").value, "2023-06", "Second start date");
    equal(document.getElementById("end2").value, "2024", "Second end year");
  });
  await test("Nested company/title row shares group with its separate description", async () => {
    fixture.innerHTML = `<form>${workEntry(1)}${workEntry(2)}</form>`;
    const fields = scanFields();
    equal(field("company1", fields).experienceGroup, field("description1", fields).experienceGroup, "First group");
    equal(field("title2", fields).experienceGroup, field("description2", fields).experienceGroup, "Second group");
    if (field("company1", fields).experienceGroup === field("company2", fields).experienceGroup) throw new Error("Employers merged");
  });
  await test("Hidden first section retains explicit Work Experience 2 mapping", async () => {
    fixture.innerHTML = `<form><div hidden>${workEntry(1)}</div>${workEntry(2)}</form>`;
    equal(field("company2").experienceIndex, 1, "Visible second employer");
    await fillFromProfile("description2");
    equal(document.getElementById("description2").value, "Beta responsibilities only.", "Second description");
  });
  await test("Field labels take priority over unrelated enclosing labels and technical names", async () => {
    fixture.innerHTML = `<section data-automation-id="application"><label>First name<input id="first"></label><label>Company<input id="company" name="candidate_first_name_company"></label><label>Job title<input id="title" name="company_role"></label><label>Role description<textarea id="description" name="company_summary"></textarea></label></section>`;
    equal(field("company").dataKey, "experience.company", "Company");
    equal(field("title").dataKey, "experience.title", "Title");
    equal(field("description").dataKey, "experience.description", "Description");
  });
  await test("Selected company supplies only that company's multiline experience", async () => {
    fixture.innerHTML = `<label>Experience<textarea id="experience"></textarea></label>`;
    await fillFromProfile("experience", scanFields(), 1);
    equal(document.getElementById("experience").value, "Beta responsibilities only.", "Single experience answer");
  });
  await test("Personal city outside a work entry remains a personal field", async () => {
    fixture.innerHTML = `<div><section><label>First name<input id="first"></label><label>City<input id="city"></label></section>${workEntry(1)}</div>`;
    equal(field("city").dataKey, "city", "Personal city");
    equal(field("location1").dataKey, "experience.location", "Work location");
  });
  await test("Address countryCode identifiers do not become telephone codes", async () => {
    fixture.innerHTML = `<label>Country<select id="countryCode"><option value="IN">India</option></select></label>`;
    equal(field("countryCode").dataKey, "country", "Country classification");
  });
  await test("Non-button custom country-code combobox fills its own list", async () => {
    fixture.innerHTML = `<label id="code-label">Country phone code</label><div tabindex="0" id="code" role="combobox" aria-labelledby="code-label" aria-controls="codes" aria-haspopup="listbox">Select One</div>
    <ul id="codes" role="listbox" hidden><li role="option">United Kingdom (+44)</li><li role="option">India +91</li></ul>`;
    const control = document.getElementById("code");
    const list = document.getElementById("codes");
    control.onclick = () => { list.hidden = false; };
    list.onclick = (event) => { control.textContent = event.target.textContent; list.hidden = true; };
    await fillFromProfile("code");
    equal(control.textContent, "India +91", "Selected dialing code");
  });
  await test("Workday current-company labels follow the selected work entry", async () => {
    fixture.innerHTML = `<fieldset><legend>Work Experience 2</legend><label>Current company<input id="company"></label><label>Current job title<input id="title"></label><label>Description<textarea id="description"></textarea></label></fieldset>`;
    const fields = scanFields();
    equal(field("company", fields).dataKey, "experience.company", "Company belongs to entry");
    await fillFromProfile("title", fields);
    equal(document.getElementById("title").value, "Developer", "Selected entry title");
  });
  await test("Dropdowns reject blank or ambiguous partial matches", async () => {
    fixture.innerHTML = `<select id="options"><option value=""></option><option value="a">Engineering (A)</option><option value="b">Engineering (B)</option></select>`;
    equal(chooseDropdownOption(Array.from(document.getElementById("options").options), "Engineering"), null, "Ambiguous options");
    equal(chooseDropdownOption(Array.from(document.getElementById("options").options), "Missing school"), null, "Blank option");
  });
  await test("Fill-all preserves existing values and reports unavailable fields", async () => {
    fixture.innerHTML = `<label>First name<input id="first" value="Keep me"></label><label>Email<input id="email"></label>`;
    const fields = scanFields();
    document.getElementById("email").disabled = true;
    const response = await new Promise((resolve) => window.contentListener({ type: "FILL_FIELDS", fields: fields.map((item) => ({ fieldId: item.fieldId, value: "replacement" })) }, {}, resolve));
    equal(document.getElementById("first").value, "Keep me", "Existing value");
    equal(response.skipped, 1, "Skipped count"); equal(response.failed, 1, "Failure count");
  });
  await test("Existing Workday fixture classifies and fills company, title, description and dates", async () => {
    const html = await (await fetch("../test-workday.html")).text();
    fixture.innerHTML = new DOMParser().parseFromString(html, "text/html").querySelector("form").outerHTML;
    const fields = scanFields();
    for (const key of ["experience.company", "experience.title", "experience.description", "experience.startMonth", "experience.startYear", "experience.current"]) {
      const found = fields.find((item) => item.dataKey === key);
      if (!found) throw new Error(`Missing ${key}`);
      const value = resolveProfileField(testProfile, found);
      const response = await fillField(found.fieldId, value);
      equal(response.ok, true, key);
    }
    equal(fixture.querySelector("[data-automation-id='company']").value, "Alpha", "Company");
    equal(fixture.querySelector("[data-automation-id='description']").value, "Alpha responsibilities only.", "Description");
    equal(fixture.querySelector("[data-automation-id='dateSectionYear-input']").value, "2024", "Start year");
  });
  await test("Actual side panel switches the whole entry to Beta and preserves saved profile", async () => {
    fixture.innerHTML = `<form>${workEntry(1)}</form>`;
    const panel = document.createElement("iframe");
    const html = await (await fetch("../sidepanel.html")).text();
    const base = new URL("../", location.href).href;
    panel.srcdoc = html.replace("<head>", `<head><base href="${base}"><script src="tests/panel-stub.js"><\/script>`);
    document.body.append(panel);
    await new Promise((resolve) => panel.addEventListener("load", resolve, { once: true }));
    await new Promise((resolve) => setTimeout(resolve, 100));
    const doc = panel.contentDocument;
    const migrated = panel.contentWindow.normalizeProfile({
      id: "profile-1", profileName: "Profile 1", firstName: "Jordan", lastName: "Taylor",
      phone: "+1 202-555-0123", workExperiences: [{ company: "Example Corp", title: "Engineer", description: "Combined description." }]
    });
    equal(migrated.firstName, "Jordan", "Existing first name preserved");
    equal(migrated.lastName, "Taylor", "Existing last name preserved");
    equal(migrated.phone, "+1 202-555-0123", "Existing phone preserved");
    equal(migrated.workExperiences.length, 1, "Existing work experience preserved");
    equal(migrated.workExperiences[0].company, "Example Corp", "Existing employer preserved");
    const select = doc.querySelector(".detected-experience select");
    if (!select) throw new Error("Company selector was not rendered");
    select.value = "1";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    const previews = Array.from(doc.querySelectorAll(".field-value"), (item) => item.textContent);
    if (!previews.includes("Beta") || !previews.includes("Developer") || !previews.includes("Beta responsibilities only.")) throw new Error("Company selection did not update all previews");
    doc.getElementById("fill-all-button").click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    equal(document.getElementById("company1").value, "Beta", "Company fill");
    equal(document.getElementById("title1").value, "Developer", "Title fill");
    equal(document.getElementById("description1").value, "Beta responsibilities only.", "Description fill");
    equal(panel.contentWindow.lastSavedProfiles.applicationProfilesV2[0].profileName, "Synthetic test profile", "Existing profile retained");
    panel.remove();
  });
  await portalRegressions();
  document.getElementById("results").textContent = JSON.stringify({ passed: results.filter((item) => item.ok).length, total: results.length, results });
  document.title = results.every((item) => item.ok) ? "PASS" : "FAIL";
})();
