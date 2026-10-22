window.chrome = {
  tabs: {
    query: async () => [{ id: 1, url: "https://example.test/application" }],
    onActivated: { addListener() {} },
    onUpdated: { addListener() {} },
    sendMessage: async (_id, message) => new Promise((resolve) => parent.contentListener(message, {}, resolve))
  },
  storage: { local: {
    get: async () => ({ applicationProfilesV2: [structuredClone(parent.testProfile)], activeApplicationProfileId: "test-profile" }),
    set: async (data) => { window.lastSavedProfiles = data; }
  } }
};
