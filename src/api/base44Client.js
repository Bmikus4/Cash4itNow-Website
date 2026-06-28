// Static stub for the Base44 SDK.
//
// This site runs as a fully static build with NO backend. This module
// preserves the exact surface the app calls (entities / auth / integrations /
// functions) so nothing crashes, while performing no network I/O.
//
// When the real backend is built (Supabase), replace this file with a thin
// adapter that maps these same method names onto Supabase queries.

const warn = (label) => {
  if (typeof console !== "undefined") {
    console.warn(`[base44-stub] ${label} — no backend connected (static build)`);
  }
};

let _idSeq = 0;
const nextId = () => `stub_${++_idSeq}`;

const makeEntity = (name) => ({
  list: async () => {
    warn(`${name}.list`);
    return [];
  },
  filter: async () => {
    warn(`${name}.filter`);
    return [];
  },
  get: async () => {
    warn(`${name}.get`);
    return null;
  },
  create: async (data = {}) => {
    warn(`${name}.create`);
    return { id: nextId(), ...data };
  },
  update: async (id, data = {}) => {
    warn(`${name}.update`);
    return { id, ...data };
  },
  delete: async () => {
    warn(`${name}.delete`);
    return { success: true };
  },
});

// Any entity name returns a stub entity, so we never have to enumerate them.
const entities = new Proxy(
  {},
  { get: (_target, name) => makeEntity(String(name)) }
);

const unavailable = (feature) => async () => {
  throw new Error(`${feature} is not available on the static site.`);
};

const auth = {
  me: async () => {
    warn("auth.me");
    throw Object.assign(new Error("Not authenticated"), { status: 401 });
  },
  logout: () => warn("auth.logout"),
  redirectToLogin: () => warn("auth.redirectToLogin"),
  loginWithProvider: () => warn("auth.loginWithProvider"),
  setToken: () => warn("auth.setToken"),
  loginViaEmailPassword: unavailable("Login"),
  register: unavailable("Registration"),
  verifyOtp: unavailable("Verification"),
  resendOtp: unavailable("Verification"),
  resetPassword: unavailable("Password reset"),
  resetPasswordRequest: unavailable("Password reset"),
};

const integrations = {
  Core: {
    UploadFile: async () => {
      warn("integrations.Core.UploadFile");
      return { file_url: "" };
    },
    SendEmail: async () => {
      warn("integrations.Core.SendEmail");
      return { success: true };
    },
    InvokeLLM: unavailable("AI features"),
  },
};

const functions = {
  invoke: async (fnName) => {
    warn(`functions.invoke(${fnName})`);
    throw new Error("Server functions are not available on the static site.");
  },
};

export const base44 = { entities, auth, integrations, functions };
export default base44;
