(function () {
  const SESSION_KEY = "hanako-cloud-session";

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
      const response = await this.authorizedFetch("/rest/v1/hanako_app_data?on_conflict=user_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: this.user.id, payload, updated_at: payload.updatedAt }),
      });
      if (!response.ok) throw await this.toError(response);
    }

    async uploadPrivateImage(file, bucket = "hanako-private-photos") {
      if (!this.signedIn) throw new Error("先にクラウド同期へログインしてください");
      const extension = String(file?.name || "photo.jpg").split(".").pop().replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
      const path = `${this.user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      await this.authorizedFetch(`/storage/v1/object/${bucket}/${this.encodeStoragePath(path)}`, {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "false",
          "cache-control": "3600",
        },
        body: file,
      });
      return { path, ...(await this.createSignedImageUrl(path, 7200, bucket)) };
    }

    async createSignedImageUrl(path, expiresIn = 7200, bucket = "hanako-private-photos") {
      if (!this.signedIn) throw new Error("先にクラウド同期へログインしてください");
      const response = await this.authorizedFetch(`/storage/v1/object/sign/${bucket}/${this.encodeStoragePath(path)}`, {
        method: "POST",
        body: JSON.stringify({ expiresIn }),
      });
      const data = await response.json();
      const signedPath = data.signedURL || data.signedUrl || data.url || "";
      if (!signedPath) throw new Error("写真の一時URLを作れませんでした");
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
      const response = await fetch(`${this.url}${path}`, {
        ...options,
        headers: {
          apikey: this.key,
          Authorization: `Bearer ${this.session.access_token}`,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      if (!response.ok) throw await this.toError(response);
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
      if (!this.configured) throw new Error("クラウド接続が未設定です");
      const response = await fetch(`${this.url}${path}`, {
        method: "POST",
        headers: { apikey: this.key, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw await this.toError(response);
      return response.json();
    }

    async toError(response) {
      let message = "同期に失敗しました";
      try {
        const body = await response.json();
        message = body.msg || body.message || body.error_description || body.error || message;
      } catch {
        // JSON以外のエラーは共通メッセージを使う。
      }
      return new Error(message);
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
