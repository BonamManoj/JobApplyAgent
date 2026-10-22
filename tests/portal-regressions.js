function realisticWorkEntry(record) {
  const input = (key, label, type = "text") => `<div id="workExperience-${record}-${key}-wrapper" data-automation-id="formField-${key}"><label for="workExperience-${record}-${key}">${label}</label><input id="workExperience-${record}-${key}" data-automation-id="${key}" type="${type}"></div>`;
  const date = (side) => `<div id="workExperience-${record}-${side}Date" data-automation-id="formField-${side}Date">${["Month", "Year"].map((part) =>
    `<div id="workExperience-${record}-${side}Date-${part}-wrapper">${"<div>".repeat(9)}<label>${part}<input id="workExperience-${record}-${side}Date-dateSection${part}-input" data-automation-id="dateSection${part}-input"></label>${"</div>".repeat(9)}</div>`).join("")}</div>`;
  return `<div class="record" data-automation-id="workExperience-${record}">${input("jobTitle", "Job Title*")}${input("company", "Company*")}${input("location", "Location")}${input("currentlyWorkHere", "I currently work here", "checkbox")}${date("start")}${date("end")}
    <div id="workExperience-${record}-roleDescription-wrapper"><label>Role Description*<textarea id="workExperience-${record}-roleDescription" data-automation-id="roleDescription"></textarea></label></div></div>`;
}

async function portalRegressions() {
  await test("Workday IDs 4 and 16 with deeply nested date wrappers produce exactly two complete entries", async () => {
    fixture.innerHTML = `<form><section><h2>Work Experience</h2>${realisticWorkEntry(4)}${realisticWorkEntry(16)}</section></form>`;
    const fields = scanFields();
    const groups = experienceGroups(fields);
    equal(groups.size, 2, "Number of work entries");
    for (const [index, items] of [...groups.values()].entries()) {
      equal(items.length, 9, "Fields per entry");
      for (const key of ["company", "title", "description", "startMonth", "startYear", "endMonth", "endYear"]) {
        const found = items.find((item) => item.dataKey === `experience.${key}`);
        if (!found) throw new Error(`Missing ${key} in entry ${index + 1}`);
        equal(found.experienceIndex, index, "Record ID must not become profile index");
      }
    }
    await fillFromProfile("workExperience-16-roleDescription", fields);
    equal(document.getElementById("workExperience-16-roleDescription").value, "Beta responsibilities only.", "Second role description");
  });
  await test("Fill work experience clicks the work Add another, fills second employer and is repeatable", async () => {
    fixture.innerHTML = `<form><section id="work"><h2>Work Experience</h2><div id="records">${realisticWorkEntry(4)}</div><button id="add-work" type="button">Add Another</button></section>
      <section><h2>Education</h2><button id="add-education" type="button">Add Another</button></section></form>`;
    let workClicks = 0;
    let educationClicks = 0;
    document.getElementById("add-work").onclick = () => {
      workClicks++;
      setTimeout(() => document.getElementById("records").insertAdjacentHTML("beforeend", realisticWorkEntry(16)), 120);
    };
    document.getElementById("add-education").onclick = () => { educationClicks++; };
    const result = await fillSavedExperiences(testProfile.workExperiences);
    equal(result.ok, true, result.error);
    equal(workClicks, 1, "One missing employer added");
    equal(educationClicks, 0, "Education Add another untouched");
    equal(result.completed, 2, "Completed employers");
    equal(document.getElementById("workExperience-4-company").value, "Alpha", "First employer");
    equal(document.getElementById("workExperience-16-company").value, "Beta", "Second employer");
    equal(document.getElementById("workExperience-16-jobTitle").value, "Developer", "Second title");
    equal(document.getElementById("workExperience-16-roleDescription").value, "Beta responsibilities only.", "Second description");
    equal(document.getElementById("workExperience-16-endDate-dateSectionYear-input").value, "2024", "Second end year");
    const again = await fillSavedExperiences(testProfile.workExperiences);
    equal(again.ok, true, again.error);
    equal(workClicks, 1, "Retry does not create duplicate employer");
  });
  await test("Work experience action repairs a wrong first entry without combining descriptions", async () => {
    fixture.innerHTML = `<section><h2>Work Experience</h2><div id="records">${realisticWorkEntry(4)}${realisticWorkEntry(16)}</div><button id="add-work" type="button">Add Another</button></section>`;
    document.getElementById("workExperience-4-company").value = "AI";
    document.getElementById("workExperience-4-jobTitle").value = "GenAI Engineer (Consultant)";
    document.getElementById("workExperience-4-roleDescription").value = "Alpha responsibilities only.\nBeta responsibilities only.";
    document.getElementById("workExperience-16-company").value = "Beta";
    document.getElementById("workExperience-16-jobTitle").value = "Developer";
    document.getElementById("workExperience-16-roleDescription").value = "Beta responsibilities only.";
    let clicks = 0;
    document.getElementById("add-work").onclick = () => { clicks++; };
    const result = await fillSavedExperiences(testProfile.workExperiences);
    equal(result.ok, true, result.error);
    equal(clicks, 0, "No third entry created");
    equal(document.getElementById("workExperience-4-company").value, "Alpha", "First company repaired");
    equal(document.getElementById("workExperience-4-jobTitle").value, "Engineer", "First title repaired");
    equal(document.getElementById("workExperience-4-roleDescription").value, "Alpha responsibilities only.", "First description separated");
    equal(document.getElementById("workExperience-16-roleDescription").value, "Beta responsibilities only.", "Second description unchanged");
  });
  await test("Adding starts from an empty work section without touching education", async () => {
    fixture.innerHTML = `<section><h2>Work Experience</h2><div id="records"></div><button id="add-work" type="button">Add</button></section><section><h2>Education</h2><button type="button">Add Another</button></section>`;
    let additions = 0;
    document.getElementById("add-work").onclick = () => {
      document.getElementById("records").insertAdjacentHTML("beforeend", realisticWorkEntry(++additions * 12));
    };
    const result = await fillSavedExperiences(testProfile.workExperiences);
    equal(result.ok, true, result.error);
    equal(additions, 2, "One form entry per saved employer");
  });
  await test("Missing work Add another reports a limitation rather than clicking education", async () => {
    fixture.innerHTML = `<section><h2>Work Experience</h2>${realisticWorkEntry(4)}</section><section><h2>Education</h2><button id="add-education" type="button">Add Another</button></section>`;
    let clicks = 0;
    document.getElementById("add-education").onclick = () => { clicks++; };
    const result = await fillSavedExperiences(testProfile.workExperiences);
    equal(result.ok, false, "Missing add action is reported");
    equal(clicks, 0, "Unrelated button untouched");
  });
  await test("Side-panel work experience button adds and fills the second company through messaging", async () => {
    fixture.innerHTML = `<section><h2>Work Experience</h2><div id="records">${realisticWorkEntry(4)}</div><button id="add-work" type="button">Add Another</button></section>`;
    document.getElementById("add-work").onclick = () => document.getElementById("records").insertAdjacentHTML("beforeend", realisticWorkEntry(16));
    const panel = document.createElement("iframe");
    try {
      const html = await (await fetch("../sidepanel.html")).text();
      panel.srcdoc = html.replace("<head>", `<head><base href="${new URL("../", location.href).href}"><script src="tests/panel-stub.js"><\/script>`);
      document.body.append(panel);
      await new Promise((resolve) => panel.addEventListener("load", resolve, { once: true }));
      const button = await waitUntil(() => {
        const control = panel.contentDocument.getElementById("fill-experiences-button");
        return control && !control.hidden ? control : null;
      });
      if (!button) throw new Error("Work experience action missing");
      button.click();
      await waitUntil(() => !button.disabled);
      equal(document.getElementById("workExperience-16-company").value, "Beta", "Second company filled from actual panel");
      equal(panel.contentDocument.querySelectorAll(".detected-experience").length, 2, "Panel refresh shows two entries");
      equal(panel.contentWindow.lastSavedProfiles.applicationProfilesV2[0].workExperiences.length, 2, "Saved profile preserved");
    } finally { panel.remove(); }
  });
  await test("Skills picker selects individual exact matches, preserves existing chips and reports missing skills", async () => {
    fixture.innerHTML = `<section data-automation-id="formField-skills"><h2>Skills</h2><label>Type to Add Skills<input id="skills" placeholder="Search" role="combobox" aria-controls="skill-options"></label>
      <div id="selected-skills"><span data-automation-id="selectedItem">Python<button type="button">Remove</button></span></div>
      <ul id="skill-options" role="listbox"><li>No Items.</li></ul></section>`;
    const input = document.getElementById("skills");
    const options = document.getElementById("skill-options");
    const queries = [];
    let searchTimer;
    input.oninput = () => {
      const query = input.value;
      if (query) queries.push(query);
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        options.replaceChildren();
        for (const skill of ["SQL", "NoSQL", "C++", "Python"].filter((skill) => query && skill.toLowerCase().includes(query.toLowerCase()))) {
          const option = document.createElement("li");
          option.setAttribute("role", "option"); option.textContent = skill;
          option.onclick = () => {
            const chip = document.createElement("span"); chip.dataset.automationId = "selectedItem"; chip.textContent = skill;
            document.getElementById("selected-skills").append(chip);
            input.value = ""; options.replaceChildren();
          };
          options.append(option);
        }
      }, 120);
    };
    const found = field("skills");
    equal(found.dataKey, "skills", "Skills classification");
    const result = await fillField(found.fieldId, "Python, SQL, C++, SQL, MissingSkill");
    equal(result.added, 2, "Selected SQL and C++");
    equal(result.kept, 1, "Preserved Python");
    equal(result.missing.join(","), "MissingSkill", "Missing skill reported");
    equal(selectedSkillNames(findSkillsContainer(input)).join(","), "python,sql,c++", "Exact skills only");
    if (queries.some((query) => query.includes(","))) throw new Error("Pasted comma-separated skills into search");
    equal(input.value, "", "Search cleared after completion");
  });
  await test("Plain Workday skills search without combobox role still adds suggestions individually", async () => {
    fixture.innerHTML = `<section data-automation-id="skillsSection"><h3>Skills</h3><label>Type to Add Skills<input id="skills" placeholder="Search" aria-controls="skill-results"></label>
      <div id="chips"></div><ul id="skill-results" role="listbox"></ul></section>`;
    const input = document.getElementById("skills");
    input.oninput = () => {
      const list = document.getElementById("skill-results");
      list.replaceChildren();
      if (input.value !== "SQL") return;
      const option = document.createElement("li"); option.role = "option"; option.textContent = "SQL";
      option.onclick = () => {
        const chip = document.createElement("button"); chip.setAttribute("aria-label", "Remove SQL from Skills");
        document.getElementById("chips").append(chip); input.value = ""; list.replaceChildren();
      };
      list.append(option);
    };
    const item = field("skills");
    equal(item.dataKey, "skills", "Skills search classification");
    const result = await fillField(item.fieldId, "SQL");
    equal(result.added, 1, result.error || "Skill selection");
    equal(input.value, "", "Search text cleared after selecting");
  });
}
