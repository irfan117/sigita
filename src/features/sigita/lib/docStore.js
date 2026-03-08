import { DUMMY_DOCS } from "../data/dummyDocs";

export const DocStore = {
  get() {
    if (typeof window === "undefined") return [];

    if (!window.__sigitaDocs) {
      window.__sigitaDocs = DUMMY_DOCS.map((d) => ({
        ...d,
        uploadedAt: new Date(d.uploadedAt),
      }));
    }

    return window.__sigitaDocs;
  },
  set(docs) {
    if (typeof window === "undefined") return;
    window.__sigitaDocs = docs;
  },
};
