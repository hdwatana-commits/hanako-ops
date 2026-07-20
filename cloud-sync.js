(function () {
  const SESSION_KEY = "hanako-cloud-session";
  const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;

  class HanakoCloudSync {
    constructor(config) {
      this.url = String(config?.supabaseUrl || "").replace(/\/$/, "");
      this.key = String(config?.supabaseAnonKey || "");
      this.session = this.readSession();
    }

    get configured() {
      return Boolean(this.url && this.key);
    }

    get signedIn() {
      return Boolean(this.session?.access_token && this.session?.user?.id);
    }

    get user() {
      return this.session?.user || null;
    }

    async getAccessToken() {
      await this.refreshIfNeeded();
      return this.session?.access_token || "";
    }

    async signUp(email, password) {
      const session = await this.authRequest("/auth/v1/signup", { email, password });
      if (!session.access_token) {
        return { user: session.user, confirmationRequired: true };
      }
      this.setSession(session);
      return { user: session.user, confirmationRequired: false };
    }

    async signIn(email, password) {
      const session = await this.authRequest("/auth/v1/token?grant_type=password", { email, password });
      this.setSession(session);
      return session.user;
    }

    async resendConfirmation(email) {
      await this.authRequest("/auth/v1/resend", { type: "signup", email });
      return true;
    }

    async recoverPassword(email) {
      const redirectTo = `${location.origin}${location.pathname}`;
      await this.authRequest(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, { email });
      return true;
    }

    signOut() {
      this.session = null;
      localStorage.removeItem(SESSION_KEY);
    }

    async load() {
      if (!this.signedIn) return null;
      const response = await this.authorizedFetch(
        `/rest/v1/hanako_app_data?select=payload,updated_at&user_id=eq.${encodeURIComponent(this.user.id)}&limit=1`,
      );
      const rows = await response.json();
      return rows[0] || null;
    }

    async save(payload) {
      if (!this.signedIn) return;
      await this.authorizedFetch("/rest/v1/hanako_app_data?on_conflict=user_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: this.user.id, payload, updated_at: payload.updatedAt }),
      });
    }

    async uploadPrivateImage(file, bucket = "hanako-private-photos") {
      if (!this.signedIn) throw this.createError("SYNC_AUTH_REQUIRED", "Sign in before cloud sync.");
      const extension = String(file?.name || "photo.jpg").split(".").pop().replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
      const uniqueId = globalThis.crypto?.randomUUID?.()
        || `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      const contentTypes = {
        jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
        heic: "image/heic", heif: "image/heif", avif: "image/avif",
      };
      const contentType = file.type || contentTypes[extension] || "application/octet-stream";
      const path = `${this.user.id}/${Date.now()}-${uniqueId}.${extension}`;
      await this.authorizedFetch(`/storage/v1/object/${bucket}/${this.encodeStoragePath(path)}`, {
        method: "POST",
        headers: {
          "Content-Type": contentType,
          "x-upsert": "false",
          "cache-control": "3600",
        },
        body: file,
      });
      return { path, ...(await this.createSignedImageUrl(path, 7200, bucket)) };
    }

    async createSignedImageUrl(path, expiresIn = 7200, bucket = "hanako-private-photos") {
      if (!this.signedIn) throw this.createError("SYNC_AUTH_REQUIRED", "Sign in before cloud sync.");
      const response = await this.authorizedFetch(`/storage/v1/object/sign/${bucket}/${this.encodeStoragePath(path)}`, {
        method: "POST",
        body: JSON.stringify({ expiresIn }),
      });
      const data = await response.json();
      const signedPath = data.signedURL || data.signedUrl || data.url || "";
      if (!signedPath) throw this.createError("SYNC_STORAGE_SIGN", "Signed image URL was empty.");
      const signedUrl = /^https?:\/\//i.test(signedPath)
        ? signedPath
        : `${this.url}/storage/v1${signedPath.startsWith("/") ? "" : "/"}${signedPath}`;
      return { signedUrl, expiresAt: Date.now() + expiresIn * 1000 };
    }

    async removePrivateImage(path, bucket = "hanako-private-photos") {
      if (!this.signedIn || !path) return;
      await this.authorizedFetch(`/storage/v1/object/${bucket}`, {
        method: "DELETE",
        body: JSON.stringify({ prefixes: [path] }),
      });
    }

    encodeStoragePath(path) {
      return String(path || "").split("/").map(encodeURIComponent).join("/");
    }

    async authorizedFetch(path, options = {}) {
      await this.refreshIfNeeded();
      if (!this.session?.access_token) throw this.createError("SYNC_AUTH_REQUIRED", "Sign in before cloud sync.");
      const response = await this.fetchSupabase(path, {
        ...options,
        headers: {
          apikey: this.key,
          Authorization: `Bearer ${this.session.access_token}`,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      if (!response.ok) throw await this.toError(response, path);
      return response;
    }

    async refreshIfNeeded() {
      if (!this.session?.refresh_token) return;
      const expiresAt = Number(this.session.expires_at || 0) * 1000;
      if (expiresAt && expiresAt - Date.now() > 60_000) return;
      const session = await this.authRequest("/auth/v1/token?grant_type=refresh_token", {
        refresh_token: this.session.refresh_token,
      });
      this.setSession(session);
    }

    async authRequest(path, body) {
      if (!this.configured) throw this.createError("SYNC_CONFIG_MISSING", "Supabase URL or publishable key is missing.");
      const response = await this.fetchSupabase(path, {
        method: "POST",
        headers: {
          apikey: this.key,
          Authorization: `Bearer ${this.key}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw await this.toError(response, path);
      return response.json();
    }

    async diagnose() {
      const results = [];
      const authHeaders = {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        Accept: "application/json",
      };
      const restHeaders = {
        apikey: this.key,
        Authorization: `Bearer ${this.session?.access_token || this.key}`,
        Accept: "application/json",
      };
      results.push(await this.diagnosticFetch("auth_settings", "/auth/v1/settings", { method: "GET", headers: authHeaders }));
      results.push(await this.diagnosticFetch("auth_token_options", "/auth/v1/token?grant_type=password", { method: "OPTIONS", headers: authHeaders }));
      results.push(await this.diagnosticFetch("rest_table", "/rest/v1/hanako_app_data?select=user_id&limit=1", { method: "GET", headers: restHeaders }));
      return {
        configured: this.configured,
        supabaseUrl: this.url,
        usingAbsoluteUrl: /^https?:\/\//i.test(this.url),
        results,
      };
    }

    async diagnosticFetch(name, path, options) {
      try {
        const response = await this.fetchSupabase(path, options);
        if (!response.ok) throw await this.toError(response, path);
        return { name, ok: true, status: response.status, code: "SYNC_OK", operation: this.operationForPath(path) };
      } catch (error) {
        return {
          name,
          ok: false,
          status: error?.status || error?.detail?.status || "",
          code: error?.syncCode || "SYNC_UNKNOWN",
          operation: error?.detail?.operation || this.operationForPath(path),
          message: error?.message || "",
        };
      }
    }

    async fetchSupabase(path, options = {}) {
      const endpoint = this.buildEndpoint(path);
      const controller = new AbortController();
      const timeoutMs = this.timeoutMsForPath(path);
      const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(endpoint, {
          ...options,
          mode: "cors",
          credentials: "omit",
          signal: controller.signal,
        });
      } catch (error) {
        const syncError = this.classifyFetchException(error, path, endpoint, timeoutMs);
        this.logError(syncError, { exceptionName: error?.name || "", exceptionMessage: error?.message || "" });
        throw syncError;
      } finally {
        window.clearTimeout(timeout);
      }
    }

    timeoutMsForPath(path) {
      if (/\/storage\//.test(path)) return 90_000;
      if (/\/rest\/v1\/hanako_app_data/.test(path)) return 75_000;
      if (/\/auth\/v1\//.test(path)) return 60_000;
      return DEFAULT_REQUEST_TIMEOUT_MS;
    }

    buildEndpoint(path) {
      if (!/^https?:\/\//i.test(this.url)) {
        throw this.createError("SYNC_CONFIG_URL", "Supabase URL is missing or relative.", { path, url: this.url });
      }
      const endpoint = `${this.url}${path}`;
      if (!/^https?:\/\//i.test(endpoint)) {
        throw this.createError("SYNC_CONFIG_URL", "Cloud sync endpoint is relative.", { path, url: endpoint });
      }
      return endpoint;
    }

    classifyFetchException(error, path, url, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
      if (error?.name === "AbortError") {
        return this.createError("SYNC_TIMEOUT", "Cloud sync request timed out.", { path, url, operation: this.operationForPath(path), timeoutMs, exceptionName: error.name });
      }
      if (error instanceof TypeError || /failed to fetch|load failed|networkerror/i.test(String(error?.message || ""))) {
        return this.createError("SYNC_CORS", "Cloud sync request was blocked or unreachable.", { path, url, operation: this.operationForPath(path), exceptionName: error?.name || "TypeError" });
      }
      return this.createError("SYNC_FETCH", "Cloud sync request failed before receiving a response.", { path, url, operation: this.operationForPath(path), exceptionName: error?.name || "" });
    }

    async toError(response, path = "") {
      const responseText = await response.text().catch(() => "");
      const serverMessage = this.extractServerMessage(responseText);
      const code = this.codeForResponse(response.status, path, serverMessage);
      const error = this.createError(code, serverMessage || `HTTP ${response.status}`, {
        path,
        url: response.url,
        status: response.status,
        statusText: response.statusText,
        operation: this.operationForPath(path),
        responseBody: responseText.slice(0, 2000),
      });
      this.logError(error);
      return error;
    }

    extractServerMessage(responseText) {
      if (!responseText) return "";
      try {
        const body = JSON.parse(responseText);
        return body.msg || body.message || body.error_description || body.error || responseText;
      } catch {
        return responseText;
      }
    }

    codeForResponse(status, path = "", message = "") {
      const operation = this.operationForPath(path);
      const text = String(message || "").toLowerCase();
      if (/^sign_|refresh_session$/.test(operation)) {
        if (/invalid login credentials|invalid credentials|email or password|invalid grant|bad jwt|jwt|token/i.test(text)) return "SYNC_AUTH_401";
        if (/email not confirmed|confirm/i.test(text)) return "SYNC_AUTH_CONFIRM";
        if (/user already registered|already registered|already exists/i.test(text)) return "SYNC_AUTH_EXISTS";
        if (/password|weak|too short|at least/i.test(text)) return "SYNC_AUTH_PASSWORD";
        if (status === 400 || status === 422) return `SYNC_AUTH_${status}`;
      }
      if (/recover_password|resend_confirmation/.test(operation)) {
        if (/email|user|not found|invalid/i.test(text)) return "SYNC_AUTH_EMAIL";
        if (status === 400 || status === 422) return `SYNC_AUTH_${status}`;
      }
      return this.codeForStatus(status);
    }

    codeForStatus(status) {
      if (status === 401 || status === 403) return `SYNC_AUTH_${status}`;
      if (status === 404) return "SYNC_API_404";
      if (status === 409) return "SYNC_CONFLICT_409";
      if (status === 429) return "SYNC_RATE_429";
      if (status >= 500 && status <= 599) return `SYNC_SERVER_${status}`;
      return `SYNC_HTTP_${status || "UNKNOWN"}`;
    }

    createError(code, message, detail = {}) {
      const error = new Error(message || code);
      error.name = "HanakoCloudSyncError";
      error.syncCode = code;
      error.detail = detail;
      if (detail.status) error.status = detail.status;
      if (detail.responseBody) error.responseBody = detail.responseBody;
      return error;
    }

    logError(error, extra = {}) {
      console.error("[HanakoCloudSync]", {
        code: error?.syncCode || "SYNC_UNKNOWN",
        name: error?.name || "",
        message: error?.message || "",
        status: error?.status || error?.detail?.status || "",
        path: error?.detail?.path || "",
        operation: error?.detail?.operation || this.operationForPath(error?.detail?.path || ""),
        url: error?.detail?.url || "",
        timeoutMs: error?.detail?.timeoutMs || "",
        responseBody: error?.responseBody || error?.detail?.responseBody || "",
        exceptionName: error?.detail?.exceptionName || extra.exceptionName || "",
        exceptionMessage: extra.exceptionMessage || "",
      });
    }

    operationForPath(path) {
      const value = String(path || "");
      if (/\/auth\/v1\/token\?grant_type=password/.test(value)) return "sign_in";
      if (/\/auth\/v1\/signup/.test(value)) return "sign_up";
      if (/\/auth\/v1\/token\?grant_type=refresh_token/.test(value)) return "refresh_session";
      if (/\/auth\/v1\/recover/.test(value)) return "recover_password";
      if (/\/auth\/v1\/resend/.test(value)) return "resend_confirmation";
      if (/\/rest\/v1\/hanako_app_data.*select=/.test(value)) return "load_sync_data";
      if (/\/rest\/v1\/hanako_app_data/.test(value)) return "save_sync_data";
      if (/\/storage\/v1\/object\/sign\//.test(value)) return "sign_photo_url";
      if (/\/storage\/v1\/object\//.test(value)) return "photo_storage";
      return "cloud_request";
    }

    setSession(session) {
      this.session = session;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    readSession() {
      try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
      } catch {
        return null;
      }
    }
  }

  window.HanakoCloudSync = HanakoCloudSync;
})();
