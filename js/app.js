/* PENAJI (PENampungan Aspirasi HMJTI) - Prototype interaktif (state di browser, tanpa database) */
document.addEventListener("DOMContentLoaded", () => {
  const aspirationsData = [
    { id: 1, tanggal: "18 Nov 2026", pengirim: "Alfan Rizqy Prasetyo (E41261512)", prodi: "D-IV Teknik Informatika", kategori: "Sarana & Prasarana JTI", isi: "Mohon penambahan stop kontak dan peningkatan stabilitas akses Wi-Fi di ruang kelas lantai 3 Gedung JTI untuk mendukung praktikum pemrograman web.", status: "Diproses" },
    { id: 2, tanggal: "17 Nov 2026", pengirim: "Mahasiswa JTI (Anonim)", prodi: "D-III Manajemen Informatika", kategori: "Akademik & Perkuliahan", isi: "Diharapkan adanya sesi klinik coding atau bimbingan tambahan sebelum UTS/UAS untuk mata kuliah Algoritma dan Struktur Data.", status: "Selesai" },
    { id: 3, tanggal: "15 Nov 2026", pengirim: "Maulana Cannavaro H. (E41261333)", prodi: "D-IV Teknik Informatika", kategori: "Program Kerja HMJTI", isi: "Mengusulkan diadakan kompetisi UI/UX Design internal antar angkatan JTI sebelum seleksi lomba nasional tingkat politeknik.", status: "Diproses" },
    { id: 4, tanggal: "12 Nov 2026", pengirim: "Akbar Ramadani Putra P. (E41261282)", prodi: "D-IV Teknik Komputer", kategori: "Sarana & Prasarana JTI", isi: "Beberapa unit mikrokontroler dan kabel jumper di Lab Embedded System perlu peremajaan agar praktikum IoT berjalan lebih lancar.", status: "Menunggu" },
    { id: 5, tanggal: "10 Nov 2026", pengirim: "Mahasiswa JTI (Anonim)", prodi: "D-IV Bisnis Digital", kategori: "Layanan Kemahasiswaan", isi: "Informasi alur pengajuan surat dispensasi lomba mahasiswa mohon dirangkum dalam satu infografis resmi di Instagram HMJTI.", status: "Selesai" },
  ];

  const $ = (id) => document.getElementById(id);

  // ===== Konfigurasi WhatsApp =====
  // Isi nomor tujuan (format internasional tanpa + atau spasi, contoh: "6281234567890").
  // Awalan 0 otomatis diubah jadi 62. Jika dikosongkan, WhatsApp akan meminta pengguna memilih kontak sendiri.
  const WA_NUMBER = "6285648685873";

  function buildWaUrl({ anonim, name, nim, prodi, kategori, isi }) {
    const lines = ["Halo Pengurus HMJTI, saya ingin menyampaikan aspirasi melalui PENAJI.", ""];
    if (!anonim) {
      if (name) lines.push(`*Nama Lengkap:* ${name}`);
      if (nim) lines.push(`*NIM:* ${nim}`);
    }
    lines.push(`*Program Studi:* ${prodi}`, `*Kategori:* ${kategori}`, "", "*Isi Aspirasi:*", isi);
    const text = encodeURIComponent(lines.join("\n"));
    let num = WA_NUMBER.replace(/\D/g, "");
    if (num.startsWith("0")) num = "62" + num.slice(1);
    return num ? `https://wa.me/${num}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
  }

  const successModal = $("successModal"), lightboxModal = $("lightboxModal");

  // Data disimpan di localStorage agar data aspirasi tidak hilang saat refresh.
  const STORE_KEY = "penaji.aspirasi.v1";
  try {
    const st = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (Array.isArray(st) && st.length) { aspirationsData.length = 0; aspirationsData.push(...st); }
  } catch (e) { }
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(aspirationsData)); } catch (e) { } };

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ===== Form aspirasi =====
  const F = $("aspirasiForm"), anon = $("anonToggle"), inNama = $("inputNama"), inNim = $("inputNim"),
    sP = $("selectProdi"), sK = $("selectKategori"), ta = $("textareaAspirasi"), cc = $("charCounter");

  anon.addEventListener("change", () => {
    [inNama, inNim].forEach((i) => { i.disabled = anon.checked; if (anon.checked) i.value = ""; i.classList.remove("is-invalid"); });
    $("errNim").textContent = "";
  });
  ta.addEventListener("input", () => (cc.textContent = `${ta.value.length} / 500 karakter`));

  function setFieldError(el, errEl, msg) {
    el.classList.toggle("is-invalid", !!msg);
    errEl.textContent = msg || "";
    return !msg;
  }

  F.addEventListener("submit", (e) => {
    e.preventDefault();
    const nim = inNim.value.trim().toUpperCase(), name = inNama.value.trim();
    const ok = [
      setFieldError(sP, $("errProdi"), sP.value ? "" : "Program Studi wajib dipilih."),
      setFieldError(sK, $("errKategori"), sK.value ? "" : "Kategori aspirasi wajib dipilih."),
      setFieldError(inNim, $("errNim"), !nim || /^[A-Z0-9]{8,12}$/.test(nim) ? "" : "NIM terdiri dari 8–12 huruf atau angka, contoh E41261512."),
      setFieldError(ta, $("errAspirasi"), ta.value.trim().length >= 10 ? "" : "Isi aspirasi wajib diisi (minimal 10 karakter)."),
    ].every(Boolean);
    if (!ok) return;

    const M = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"], d = new Date();
    const pengirim = anon.checked || (!name && !nim) ? "Mahasiswa JTI (Anonim)" : name ? (nim ? `${name} (${nim})` : name) : `Mahasiswa JTI (${nim})`;

    // Ambil data formulir SEBELUM F.reset() (reset ikut mematikan toggle anonim)
    const data = { anonim: anon.checked, name, nim, prodi: sP.value, kategori: sK.value, isi: ta.value.trim() };

    aspirationsData.unshift({
      id: Date.now(),
      tanggal: `${String(d.getDate()).padStart(2, "0")} ${M[d.getMonth()]} ${d.getFullYear()}`,
      pengirim, prodi: data.prodi, kategori: data.kategori, isi: data.isi, status: "Menunggu",
    });
    save();

    // Buka WhatsApp (dipanggil langsung dari aksi submit agar tidak diblokir popup blocker)
    const waUrl = buildWaUrl(data);
    const w = window.open(waUrl, "_blank");
    if (w) w.opener = null;
    $("waRetryBtn").href = waUrl;

    F.reset();
    [inNama, inNim].forEach((i) => (i.disabled = false));
    cc.textContent = "0 / 500 karakter";
    successModal.classList.remove("hidden");
  });

  $("closeSuccessModalBtn").addEventListener("click", () => successModal.classList.add("hidden"));

  // ===== Tampilan publik =====
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reveal berulang: masuk viewport -> muncul, keluar viewport -> reset.
  const ioIn = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }), { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  const ioOut = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) e.target.classList.remove("in"); }), { threshold: 0 });
  function observeAll(root = document) {
    root.querySelectorAll(".reveal").forEach((el) => {
      if (reduce) { el.classList.add("in"); return; }
      ioIn.observe(el); ioOut.observe(el);
    });
  }
  const stagger = (box, mod = 3) => [...box.children].forEach((c, i) => c.style.setProperty("--i", i % mod));

  // Struktur pengurus HMJTI (dipakai untuk penanggung jawab proker dan bagan hierarki)
  const BPH = [["Juliana Intan Purwaningtyas", "Ketua Himpunan"], ["ACH. Humaidi Aidil Kamal", "Wakil Ketua Himpunan"], ["Alya Rachma Kamila", "Sekretaris 1"], ["Nur Fitri Romadhan", "Sekretaris 2"], ["Agnees Serlita Anggun", "Bendahara 1"], ["Putri Amelia Balqis", "Bendahara 2"]];
  const DEP = [
    ["Administrasi", "Ahmad Maulana Febri Hananto", "Surat-menyurat, pengarsipan, dan pengelolaan keuangan organisasi."],
    ["Keilmuan", "Nur Arianti T", "Pelatihan, lokakarya, diskusi ilmiah, dan persiapan kompetisi."],
    ["Perhubungan", "Yuke Maia Chelci Dofir Nanda", "Hubungan dengan birokrasi kampus, alumni, dan organisasi lain."],
    ["Kominfo", "Muhammad Lukmanul Hakim", "Konten kreatif, publikasi, dan media sosial resmi."],
    ["Kewirausahaan", "Ovi Octa", "Usaha mandiri, merchandise resmi, dan pencarian dana."],
  ];

  // Program kerja HMJTI: tambah/ubah proker cukup lewat array PROKER.
  // status: "Terlaksana" | "Berlangsung" | "Akan Datang"; dept harus sama dengan nama di DEP.
  const STATUS_CLS = { "Terlaksana": "ok", "Berlangsung": "on", "Akan Datang": "soon" };
  const PROKER = [
    { nama: "Upgrading & Rapat Kerja Pengurus", dept: "Administrasi", waktu: "September 2026", status: "Terlaksana", isi: "Penguatan kapasitas pengurus dan penyusunan rencana kerja satu periode agar seluruh departemen berjalan selaras." },
    { nama: "Pengarsipan Digital Organisasi", dept: "Administrasi", waktu: "Sepanjang 2026", status: "Berlangsung", isi: "Digitalisasi surat-menyurat, notulen, dan laporan kegiatan agar mudah dicari dan dipertanggungjawabkan." },
    { nama: "JTI Coding Camp & Pelatihan Web", dept: "Keilmuan", waktu: "Agustus 2026", status: "Terlaksana", isi: "Pelatihan pengembangan web untuk mahasiswa JTI, dari dasar HTML/CSS/JS sampai membangun proyek mini." },
    { nama: "JTI Tech Fest & Hackathon 2026", dept: "Keilmuan", waktu: "Oktober 2026", status: "Terlaksana", isi: "Ajang kompetisi dan pameran karya teknologi untuk menyalurkan inovasi mahasiswa lintas program studi." },
    { nama: "Kompetisi UI/UX Design Internal", dept: "Keilmuan", waktu: "Desember 2026", status: "Akan Datang", isi: "Kompetisi desain antar angkatan sebagai wadah latihan dan seleksi menuju lomba tingkat nasional." },
    { nama: "Sarasehan Mahasiswa & Civitas JTI", dept: "Perhubungan", waktu: "Oktober 2026", status: "Terlaksana", isi: "Forum dialog terbuka antara mahasiswa, dosen, dan pimpinan jurusan untuk membahas kebutuhan perkuliahan." },
    { nama: "Kunjungan Alumni & Industri", dept: "Perhubungan", waktu: "Januari 2027", status: "Akan Datang", isi: "Silaturahmi dengan alumni dan mitra industri untuk membuka wawasan karier dan peluang magang." },
    { nama: "Infografis Layanan Kemahasiswaan", dept: "Kominfo", waktu: "November 2026", status: "Berlangsung", isi: "Merangkum alur layanan kemahasiswaan, seperti dispensasi lomba, dalam infografis resmi di media sosial HMJTI." },
    { nama: "Publikasi & Dokumentasi Kegiatan", dept: "Kominfo", waktu: "Sepanjang 2026", status: "Berlangsung", isi: "Konten kreatif dan dokumentasi seluruh kegiatan HMJTI di TikTok, Instagram, dan YouTube." },
    { nama: "Merchandise Resmi HMJTI", dept: "Kewirausahaan", waktu: "November 2026", status: "Berlangsung", isi: "Produksi dan penjualan merchandise resmi sebagai identitas himpunan sekaligus sumber dana kegiatan." },
    { nama: "Bazar Kewirausahaan Mahasiswa TI", dept: "Kewirausahaan", waktu: "Desember 2026", status: "Akan Datang", isi: "Bazar produk dan jasa karya mahasiswa untuk melatih jiwa wirausaha di lingkungan kampus." },
  ];

  let pFilter = "all";
  function renderProker() {
    const list = PROKER.filter((p) => pFilter === "all" || p.dept === pFilter);
    const grid = $("prokerGrid");
    grid.innerHTML = list.length ? list.map((p) => {
      const kadep = DEP.find((d) => d[0] === p.dept);
      return `
      <div class="reveal"><article class="pc">
        <div class="pc-top"><time>${escapeHtml(p.waktu)}</time><span class="sp s-${STATUS_CLS[p.status]}">${escapeHtml(p.status)}</span></div>
        <span class="pc-cat">${escapeHtml(p.dept)}</span>
        <h3 class="pc-title">${escapeHtml(p.nama)}</h3>
        <p class="pc-txt">${escapeHtml(p.isi)}</p>
        <div class="pc-by"><span>Penanggung jawab</span><b>${escapeHtml(kadep ? kadep[1] : "-")}</b></div>
      </article></div>`;
    }).join("") : `<p class="empty">Belum ada proker untuk departemen ini.</p>`;
    stagger(grid); observeAll(grid);
  }

  // Highlight di hero: proker yang belum selesai lebih dulu, lalu yang terbaru terlaksana.
  function renderHighlight() {
    const items = [...PROKER.filter((p) => p.status !== "Terlaksana"), ...PROKER.filter((p) => p.status === "Terlaksana").reverse()].slice(0, 2);
    const hl = $("hlList");
    hl.innerHTML = items.map((p, i) => `
      <a href="#proker" class="hl-i reveal" style="--i:${i + 3}">
        <div class="hl-t"><time>${escapeHtml(p.waktu)}</time><span class="sp s-${STATUS_CLS[p.status]}">${escapeHtml(p.status)}</span></div>
        <b>${escapeHtml(p.nama)}</b><p>${escapeHtml(p.isi)}</p></a>`).join("");
    observeAll(hl);
  }

  document.querySelectorAll("#prokerFilters .fp").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("#prokerFilters .fp").forEach((x) => { x.classList.remove("active"); x.setAttribute("aria-pressed", "false"); });
    b.classList.add("active"); b.setAttribute("aria-pressed", "true");
    pFilter = b.dataset.f; renderProker();
  }));

  // Galeri carousel: tambah foto cukup dengan menambah objek ke GALERI.
  const GALERI = [
    { img: "assets/galeri-1.jpg", t: "Sarasehan Mahasiswa & Civitas JTI", d: "Oktober 2026 • Gedung JTI Polije", tag: "Forum Aspirasi" },
    { img: "assets/galeri-2.jpg", t: "JTI Tech Fest & Hackathon 2026", d: "Oktober 2026 • Lab Rekayasa Perangkat Lunak", tag: "Teknologi" },
    { img: "assets/galeri-3.jpg", t: "Upgrading & Rapat Kerja Pengurus", d: "September 2026 • Politeknik Negeri Jember", tag: "Internal" },
    { img: "assets/galeri-4.jpg", t: "JTI Coding Camp & Pelatihan Web", d: "Agustus 2026 • Lab Pemrograman JTI", tag: "Edukasi" },
  ];
  const tr = $("galTrack"), prev = $("galPrev"), next = $("galNext");
  tr.innerHTML = GALERI.map((g, i) => `
    <div class="reveal"><button type="button" class="slide" data-i="${i}">
      <img src="${g.img}" alt="${escapeHtml(g.t)}" loading="lazy" draggable="false" />
      <span class="sl-ov"><em>${g.tag}</em><b>${escapeHtml(g.t)}</b><small>${g.d}</small></span>
    </button></div>`).join("");
  stagger(tr);
  const stepW = () => tr.querySelector(".slide").offsetWidth + 18;
  const edge = () => { prev.disabled = tr.scrollLeft < 4; next.disabled = tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 4; };
  prev.addEventListener("click", () => tr.scrollBy({ left: -stepW(), behavior: "smooth" }));
  next.addEventListener("click", () => tr.scrollBy({ left: stepW(), behavior: "smooth" }));
  tr.addEventListener("scroll", edge, { passive: true }); addEventListener("resize", edge); edge();
  tr.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") next.click(); if (e.key === "ArrowLeft") prev.click(); });
  let down = false, sx = 0, sl = 0, moved = false;
  tr.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = tr.scrollLeft; });
  addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 5) { moved = true; tr.classList.add("drag"); }
    tr.scrollLeft = sl - dx;
  });
  addEventListener("pointerup", () => { down = false; tr.classList.remove("drag"); });
  tr.addEventListener("click", (e) => {
    const s = e.target.closest(".slide");
    if (!s) return;
    if (moved) { moved = false; return; }
    const g = GALERI[s.dataset.i];
    $("lightboxImg").src = g.img; $("lightboxImg").alt = g.t;
    $("lightboxTitle").textContent = g.t; $("lightboxDate").textContent = g.d;
    lightboxModal.classList.remove("hidden");
  });
  $("closeLightboxBtn").addEventListener("click", () => lightboxModal.classList.add("hidden"));
  lightboxModal.addEventListener("click", (e) => { if (e.target === lightboxModal) lightboxModal.classList.add("hidden"); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") [lightboxModal, successModal].forEach((m) => m.classList.add("hidden")); });

  // ===== Bagan hierarki kepengurusan =====
  // Isi tiap departemen: "!" di depan = Co Biro (diberi warna berbeda). Nama anggota bisa ditambah lewat string "Jabatan|Nama".
  const ORG_DEPT = {
    "Perhubungan": ["Sekretaris Departemen", "!Co Biro Internal", "Anggota Biro Internal", "!Co Biro Eksternal", "Anggota Biro Eksternal"],
    "Administrasi": ["Sekretaris Departemen", "!Co Biro Kesekretariatan", "Anggota Departemen"],
    "Kewirausahaan": ["Sekretaris Departemen", "Anggota Departemen"],
    "Kominfo": ["Sekretaris Departemen", "!Co Biro Sistem Informasi", "Anggota Biro Sistem Informasi", "!Co Biro Publikasi", "Anggota Biro Publikasi"],
    "Keilmuan": ["!Co Biro Akademik", "Anggota Biro Akademik", "!Co Biro Non Akademik", "Anggota Biro Non Akademik"],
  };
  const ORG_ORDER = ["Perhubungan", "Administrasi", "Kewirausahaan", "Kominfo", "Keilmuan"];

  const node = (title, sub, cls = "") => `<div class="on ${cls}"><b>${escapeHtml(title)}</b>${sub ? `<span>${escapeHtml(sub)}</span>` : ""}</div>`;
  const vl = `<i class="vl"></i>`, vs = `<i class="vl s"></i>`;
  const bph = (i) => node(BPH[i][1], BPH[i][0], "bph");

  function deptColumn(name) {
    const kadep = DEP.find((d) => d[0] === name);
    const rows = [node("Departemen " + name, "", "dept"), node("Kepala Departemen", kadep ? kadep[1] : "", "sm kd")];
    ORG_DEPT[name].forEach((r) => {
      const co = r.startsWith("!");
      rows.push(node(co ? r.slice(1) : r, "", "sm" + (co ? " co" : "")));
    });
    return `<div class="bc"><div class="stk">${rows.join(vs)}</div></div>`;
  }

  $("orgChart").innerHTML =
    node(BPH[0][1], BPH[0][0], "top") + vl +
    bph(1) + vl +
    `<div class="br bph-split">
       <div class="bc"><div class="stk">${bph(4)}${vl}${bph(5)}</div></div>
       <div class="bc"><div class="stk">${bph(2)}${vl}${bph(3)}</div></div>
     </div>` + vl +
    `<div class="br">${ORG_ORDER.map(deptColumn).join("")}</div>`;

  // Navbar: state scroll, scrollspy, menu mobile
  const nav = $("topnav"), links = [...document.querySelectorAll(".tl")], mb = $("mobileMenuBtn");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 12);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const spy = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((l) => { const s = document.querySelector(l.getAttribute("href")); if (s) spy.observe(s); });
  mb.addEventListener("click", () => { const o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); });
  links.forEach((l) => l.addEventListener("click", () => { nav.classList.remove("open"); mb.setAttribute("aria-expanded", "false"); }));

  // Inisialisasi
  stagger($("heroLeft"), 5);
  document.querySelectorAll(".cta-glass-box, .footer-grid > *").forEach((el) => el.classList.add("reveal"));
  stagger(document.querySelector(".footer-grid"));
  renderProker();
  renderHighlight();
  observeAll();
});