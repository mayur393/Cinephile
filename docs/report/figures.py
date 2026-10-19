"""Code-drawn diagrams for the report. Each function returns an inline <svg> string.
Monochrome with one accent colour so they print well in black & white."""

INK, GREY, LIGHT, ACCENT = "#111111", "#6b6b6b", "#f3f1ec", "#a0660a"
FONT = "font-family:Inter,'Liberation Sans',sans-serif"

_n = [0]


def svg(w, h, body):
    _n[0] += 1
    body = body.replace('url(#a)', f'url(#a{_n[0]})')
    return (f'<svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg" role="img" '
            f'style="width:100%;height:auto;{FONT}">'
            f'<defs><marker id="a{_n[0]}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">'
            f'<path d="M0 0L10 5L0 10z" fill="{INK}"/></marker></defs>{body}</svg>')


def box(x, y, w, h, title, sub=None, fill="#fff", stroke=INK, bold=True, dash=False):
    d = ' stroke-dasharray="4 3"' if dash else ""
    t = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="{fill}" stroke="{stroke}" stroke-width="1.1"{d}/>'
    cy = y + h / 2 + (0 if sub is None else -5)
    wt = 600 if bold else 400
    t += f'<text x="{x + w / 2}" y="{cy + 4}" text-anchor="middle" font-size="11" font-weight="{wt}" fill="{INK}">{title}</text>'
    if sub:
        t += f'<text x="{x + w / 2}" y="{cy + 18}" text-anchor="middle" font-size="9" fill="{GREY}">{sub}</text>'
    return t


def label(x, y, s, anchor="middle", size=9, color=GREY, weight=400):
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-size="{size}" fill="{color}" font-weight="{weight}">{s}</text>'


def arrow(x1, y1, x2, y2, both=False, dash=False, color=INK):
    d = ' stroke-dasharray="4 3"' if dash else ""
    start = ' marker-start="url(#a)"' if both else ""
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.1"'
            f'{d} marker-end="url(#a)"{start}/>')


def group(x, y, w, h, title):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{LIGHT}" stroke="#cfcac0"/>'
            + label(x + 10, y + 16, title.upper(), "start", 9, ACCENT, 700))


# ------------------------------------------------------------------ Fig: architecture
def architecture():
    b = group(10, 10, 200, 330, "Browser (client)")
    pages = [("index.html · movies.html", "home · browse / search"), ("movie.html", "detail · rate · review · diary"),
             ("login.html · register.html", "forms + client validation"),
             ("watchlist · diary · profile", "authenticated pages")]
    for i, (t, s) in enumerate(pages):
        b += box(24, 36 + i * 52, 172, 42, t, s)
    b += box(24, 248, 172, 38, "assets/js/app.js", "page controller · fetch()", fill=LIGHT)
    b += box(24, 294, 172, 38, "assets/css/style.css", "tokens · grid · media queries", fill=LIGHT)
    b += group(260, 10, 220, 330, "PHP 8 (Apache / XAMPP)")
    for i, (t, s) in enumerate([("auth.php", "register · login · logout · profile"), ("movies.php", "list · search · genre · detail"),
                                ("ratings.php", "save / get 1–5 stars"), ("reviews.php", "list · create"),
                                ("watchlist.php", "list · add · remove"), ("diary.php", "list · add · remove")]):
        b += box(276, 34 + i * 44, 188, 36, t, s)
    b += box(276, 300, 188, 32, "db.php", "PDO · JSON · CSRF · validation", fill=LIGHT)
    b += group(530, 10, 150, 330, "Database")
    b += box(546, 120, 118, 110, "MySQL / MariaDB", "cinephile_simple")
    b += label(605, 200, "6 InnoDB tables", "middle", 8.5)
    b += label(605, 213, "utf8mb4", "middle", 8.5)
    b += arrow(196, 267, 276, 267, both=True)
    b += label(236, 252, "JSON over", "middle", 8) + label(236, 262, "HTTP", "middle", 8)
    b += label(236, 284, "session cookie", "middle", 8)
    b += arrow(464, 316, 546, 210, both=True) + label(486, 236, "PDO prepared", "middle", 8) + label(486, 246, "statements", "middle", 8)
    return svg(690, 350, b)


# ------------------------------------------------------------------ Fig: ER diagram
def table(x, y, w, name, cols, accent=False):
    h = 30 + 15 * len(cols)
    t = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#fff" stroke="{INK}" stroke-width="1.1"/>'
    t += f'<rect x="{x}" y="{y}" width="{w}" height="22" fill="{ACCENT if accent else INK}"/>'
    t += label(x + w / 2, y + 15, name, "middle", 10.5, "#fff", 700)
    for i, c in enumerate(cols):
        key = c.startswith("*") or c.startswith("+")
        txt = c.lstrip("*+")
        tag = "PK FK" if c.startswith("*+") else "PK" if c.startswith("*") else "FK" if c.startswith("+") else ""
        t += label(x + 8, y + 38 + i * 15, tag, "start", 7.5, ACCENT, 700)
        t += label(x + 40, y + 38 + i * 15, txt, "start", 9, INK, 700 if key else 400)
    return t, h


def er():
    b = ""
    t, uh = table(20, 150, 170, "users", ["*id", "username (unique)", "email (unique)", "password_hash", "created_at"], True)
    b += t
    t, mh = table(500, 150, 170, "movies", ["*id", "title", "release_year", "runtime_min", "genre", "overview", "poster_path"], True)
    b += t
    rel = [("ratings", 260, 10, ["*+user_id", "*+movie_id", "stars (1–5)", "updated_at"]),
           ("reviews", 260, 120, ["*id", "+user_id", "+movie_id", "review_text", "created_at"]),
           ("watchlist", 260, 245, ["*+user_id", "*+movie_id", "created_at"]),
           ("diary", 260, 330, ["*id", "+user_id", "+movie_id", "watched_date", "created_at"])]
    for n, x, y, cols in rel:
        t, h = table(x, y, 170, n, cols)
        b += t
        cy = y + h / 2
        b += f'<path d="M190 210 C225 210 225 {cy} 260 {cy}" stroke="{GREY}" fill="none" stroke-width="1"/>'
        b += f'<path d="M500 210 C465 210 465 {cy} 430 {cy}" stroke="{GREY}" fill="none" stroke-width="1"/>'
        b += label(250, cy - 4, "N", "middle", 8.5, ACCENT, 700) + label(440, cy - 4, "N", "middle", 8.5, ACCENT, 700)
    b += label(200, 204, "1", "middle", 8.5, ACCENT, 700) + label(490, 204, "1", "middle", 8.5, ACCENT, 700)
    b += label(345, 452, "Every child row references users(id) and movies(id) with ON DELETE CASCADE.", "middle", 9, GREY)
    return svg(690, 462, b)


# ------------------------------------------------------------------ Fig: protected write request flow
def write_flow():
    b = box(190, 8, 240, 38, "fetch('backend/ratings.php?action=save')", "POST · JSON body · X-Requested-With: fetch", fill=LIGHT)
    steps = [
        ("requireUser()", "session cookie → $_SESSION['user']", "401 Please log in"),
        ("requireWriteRequest()", "method is POST and CSRF header present", "405 / 403 blocked"),
        ("Validate input", "positiveInt(movie_id) · stars 1–5", "422 Choose a rating…"),
        ("movieExists()", "SELECT id FROM movies WHERE id = ?", "404 movie not found"),
    ]
    y = 70
    for title, sub, fail in steps:
        b += box(190, y, 240, 38, title, sub)
        b += arrow(430, y + 19, 470, y + 19) + box(470, y + 4, 140, 30, fail, fill="#fff", dash=True, bold=False)
        b += label(450, y + 14, "no", "middle", 8.5, ACCENT, 700)
        b += arrow(310, y - 24 if y == 70 else y - 20, 310, y)
        y += 58
    b += box(190, y, 240, 38, "INSERT … ON DUPLICATE KEY UPDATE", "prepared statement · composite key (user_id, movie_id)")
    b += arrow(310, y - 20, 310, y)
    y += 58
    b += box(190, y, 240, 38, "jsonResponse(true, …)", "{ success, message, data }", fill=LIGHT)
    b += arrow(310, y - 20, 310, y)
    y += 58
    b += box(190, y, 240, 34, "app.js: showToast() · reload detail", fill="#fff")
    b += arrow(310, y - 20, 310, y)
    b += box(10, 160, 140, 54, "Any uncaught", "exception → JSON 500", dash=True, bold=False)
    b += label(80, 230, "set_exception_handler()", "middle", 8.5)
    return svg(620, y + 44, b)


FIGS = {"arch": architecture, "er": er, "flow": write_flow}
