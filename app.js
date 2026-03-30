/* Simple Blog (no backend)
   - Hash routes: #/ , #/post/<id> , #/new
   - Posts stored in localStorage
*/

const STORAGE_KEY = "simple_blog_posts_v1";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

function stripAndTruncate(text, max = 160) {
  const cleaned = (text ?? "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max - 1) + "…";
}

function seedPosts() {
  return [
    {
      id: "welcome",
      title: "Welcome to your new blog",
      body:
        "This is a simple blog made with HTML, CSS, and JavaScript.\n\n" +
        "Use “New post” to add a post. Everything is saved in your browser (localStorage).",
      tags: ["starter", "localStorage"],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    },
    {
      id: "writing-tips",
      title: "A tiny writing checklist",
      body:
        "1) Start with a clear title\n" +
        "2) Keep paragraphs short\n" +
        "3) Add one concrete example\n" +
        "4) End with a takeaway",
      tags: ["writing"],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    },
  ];
}

function loadPosts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedPosts();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seedPosts();
    return parsed;
  } catch {
    return seedPosts();
  }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function getRoute() {
  const hash = window.location.hash || "#/";
  const clean = hash.replace(/^#/, "");
  const parts = clean.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "new") return { name: "new" };
  if (parts[0] === "post" && parts[1]) return { name: "post", id: parts[1] };
  return { name: "notfound" };
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, String(v));
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === null || child === undefined) continue;
    if (typeof child === "string") node.appendChild(document.createTextNode(child));
    else node.appendChild(child);
  }
  return node;
}

function renderHome(app, posts) {
  const hero = el("section", { class: "panel hero" }, [
    el("h1", { text: "Simple Blog" }),
    el("p", {
      text:
        "A tiny, modern blog template (HTML + CSS + JS). Create posts, browse them, and share this folder anywhere.",
    }),
    el("div", { class: "row" }, [
      el("a", { class: "btn", href: "#/new" }, [el("span", { text: "New post" })]),
      el("a", { class: "btn secondary", href: "#/" }, [el("span", { text: "Refresh" })]),
    ]),
  ]);

  const list = el("div", { class: "posts" });
  const sorted = [...posts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  if (sorted.length === 0) {
    list.appendChild(
      el("div", { class: "empty" }, [
        el("div", { text: "No posts yet." }),
        el("div", { class: "hint", text: "Click “New post” to write your first one." }),
      ]),
    );
  } else {
    for (const p of sorted) {
      list.appendChild(
        el("a", { class: "post", href: `#/post/${encodeURIComponent(p.id)}` }, [
          el("h3", { class: "post-title", text: p.title || "(Untitled)" }),
          el("div", { class: "meta" }, [
            el("span", { class: "tag", text: formatDate(p.createdAt) }),
            ...(p.tags || []).slice(0, 3).map((t) => el("span", { class: "tag", text: t })),
          ]),
          el("p", { class: "excerpt", text: stripAndTruncate(p.body, 180) || "—" }),
        ]),
      );
    }
  }

  const sidebar = el("aside", { class: "card" }, [
    el("h3", { class: "post-title", text: "About" }),
    el("p", {
      class: "hint",
      text:
        "This template uses hash routing and localStorage. If you want a real database + login later, tell me what host you want (GitHub Pages, Netlify, etc.).",
    }),
    el("div", { class: "row" }, [
      el(
        "button",
        {
          type: "button",
          class: "btn secondary",
          onClick: () => {
            const shareText = `${document.title} — ${window.location.href}`;
            navigator.clipboard?.writeText(shareText).catch(() => {});
            alert("Copied the current URL to clipboard (if supported).");
          },
        },
        ["Copy URL"],
      ),
    ]),
  ]);

  const grid = el("section", { class: "grid" }, [el("div", { class: "card" }, [list]), sidebar]);

  app.replaceChildren(hero, grid);
}

function renderPost(app, posts, id) {
  const post = posts.find((p) => p.id === id);
  if (!post) {
    app.replaceChildren(
      el("div", { class: "panel hero" }, [
        el("h1", { text: "Post not found" }),
        el("p", { text: "That post doesn’t exist (or was deleted)." }),
        el("div", { class: "row" }, [el("a", { class: "btn secondary", href: "#/" }, ["Back home"])]),
      ]),
    );
    return;
  }

  const header = el("div", { class: "panel hero" }, [
    el("div", { class: "meta" }, [
      el("a", { href: "#/", class: "nav-link", text: "← Home" }),
      el("span", { class: "tag", text: formatDate(post.createdAt) }),
      ...(post.tags || []).map((t) => el("span", { class: "tag", text: t })),
    ]),
    el("h1", { text: post.title || "(Untitled)" }),
    el("p", { class: "post-body", text: post.body || "" }),
    el("div", { class: "row" }, [
      el(
        "button",
        {
          type: "button",
          class: "btn danger",
          onClick: () => {
            if (!confirm("Delete this post?")) return;
            const next = posts.filter((p) => p.id !== id);
            savePosts(next);
            window.location.hash = "#/";
          },
        },
        ["Delete"],
      ),
      el("a", { class: "btn secondary", href: "#/new" }, ["Write another"]),
    ]),
  ]);

  app.replaceChildren(header);
}

function parseTags(raw) {
  return (raw || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function renderNew(app, posts) {
  const titleInput = el("input", {
    class: "input",
    name: "title",
    placeholder: "Post title",
    autocomplete: "off",
  });

  const tagsInput = el("input", {
    class: "input",
    name: "tags",
    placeholder: "Tags (comma-separated) e.g. travel, coding",
    autocomplete: "off",
  });

  const bodyInput = el("textarea", {
    class: "textarea",
    name: "body",
    placeholder: "Write your post…",
  });

  const form = el("form", { class: "card" }, [
    el("h2", { class: "post-title", text: "New post" }),
    el("p", {
      class: "hint",
      text: "Saved locally in your browser. You can later export it to JSON if you want.",
    }),
    el("div", { class: "row" }, [titleInput]),
    el("div", { class: "row" }, [tagsInput]),
    el("div", { class: "row" }, [bodyInput]),
    el("div", { class: "row" }, [
      el("button", { class: "btn", type: "submit" }, ["Publish"]),
      el("a", { class: "btn secondary", href: "#/" }, ["Cancel"]),
    ]),
  ]);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    const tags = parseTags(tagsInput.value);

    if (!title || !body) {
      alert("Please add a title and some content.");
      return;
    }

    const post = {
      id: uid(),
      title,
      body,
      tags,
      createdAt: new Date().toISOString(),
    };

    const next = [post, ...posts];
    savePosts(next);
    window.location.hash = `#/post/${encodeURIComponent(post.id)}`;
  });

  const hero = el("section", { class: "panel hero" }, [
    el("h1", { text: "Write" }),
    el("p", {
      text:
        "Tip: Use blank lines to separate paragraphs. This template keeps formatting with line breaks.",
    }),
  ]);

  app.replaceChildren(hero, form);
  titleInput.focus();
}

function renderNotFound(app) {
  app.replaceChildren(
    el("div", { class: "panel hero" }, [
      el("h1", { text: "Page not found" }),
      el("p", { text: "That route doesn’t exist." }),
      el("div", { class: "row" }, [el("a", { class: "btn secondary", href: "#/" }, ["Back home"])]),
    ]),
  );
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  const posts = loadPosts();
  const route = getRoute();

  if (route.name === "home") renderHome(app, posts);
  else if (route.name === "new") renderNew(app, posts);
  else if (route.name === "post") renderPost(app, posts, route.id);
  else renderNotFound(app);
}

function setupReset() {
  const btn = document.getElementById("resetBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!confirm("Reset posts to the demo defaults?")) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.hash = "#/";
    render();
  });
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  setupReset();
  render();
});

