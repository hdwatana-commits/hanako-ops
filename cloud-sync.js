(function () {
  const SESSION_KEY = "hanako-cloud-session";
  const REQUEST_TIMEOUT_MS = 20_000;

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
        headers: { apikey: this.key, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw await this.toError(response, path);
      return response.json();
    }

    async fetchSupabase(path, options = {}) {
      const endpoint = this.buildEndpoint(path);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        return await fetch(endpoint, {
          ...options,
          mode: "cors",
          credentials: "omit",
          signal: controller.signal,
        });
      } catch (error) {
        const syncError = this.classifyFetchException(error, path, endpoint);
        this.logError(syncError, { exceptionName: error?.name || "", exceptionMessage: error?.message || "" });
        throw syncError;
      } finally {
        window.clearTimeout(timeout);
      }
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

    classifyFetchException(error, path, url) {
      if (error?.name === "AbortError") {
        return this.createError("SYNC_TIMEOUT", "Cloud sync request timed out.", { path, url, exceptionName: error.name });
      }
      if (error instanceof TypeError || /failed to fetch|load failed|networkerror/i.test(String(error?.message || ""))) {
        return this.createError("SYNC_CORS", "Cloud sync request was blocked or unreachable.", { path, url, exceptionName: error?.name || "TypeError" });
      }
      return this.createError("SYNC_FETCH", "Cloud sync request failed before receiving a response.", { path, url, exceptionName: error?.name || "" });
    }

    async toError(response, path = "") {
      const responseText = await response.text().catch(() => "");
      const serverMessage = this.extractServerMessage(responseText);
      const code = this.codeForStatus(response.status);
      const error = this.createError(code, serverMessage || `HTTP ${response.status}`, {
        path,
        url: response.url,
        status: response.status,
        statusText: response.statusText,
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
        url: error?.detail?.url || "",
        responseBody: error?.responseBody || error?.detail?.responseBody || "",
        exceptionName: error?.detail?.exceptionName || extra.exceptionName || "",
        exceptionMessage: extra.exceptionMessage || "",
      });
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
