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
  const WA_NUMBER = "6282233152591";

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

  const successModal = $("successModal");

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
  // waktu & status boleh dikosongkan (tidak ditampilkan). status: "Terlaksana" | "Berlangsung" | "Akan Datang".
  // dept harus sama dengan nama di DEP. highlight: true = tampil di kartu Highlight.
  const STATUS_CLS = { "Terlaksana": "ok", "Berlangsung": "on", "Akan Datang": "soon" };
  const PROKER = [
    // Administrasi
    { nama: "Rapat Anggota Tahunan", dept: "Administrasi", waktu: "", status: "", isi: "Forum tahunan anggota himpunan untuk membahas jalannya organisasi dan mengambil keputusan bersama." },
    { nama: "Reformasi Akhir Periode (Evaluasi)", dept: "Administrasi", waktu: "", status: "", isi: "Evaluasi kinerja kepengurusan dan program kerja di akhir periode sebagai bahan perbaikan ke depan." },
    { nama: "LKMM Pra TD", dept: "Administrasi", waktu: "", status: "", isi: "Latihan Keterampilan Manajemen Mahasiswa Pra Tingkat Dasar sebagai pengenalan awal keterampilan berorganisasi." },
    { nama: "LKMM TD", dept: "Administrasi", waktu: "", status: "", isi: "Latihan Keterampilan Manajemen Mahasiswa Tingkat Dasar untuk mengasah kemampuan manajemen dan kepemimpinan mahasiswa." },
    { nama: "Harmonisasi Pengurus HMJTI", dept: "Administrasi", waktu: "", status: "", isi: "Kegiatan kebersamaan untuk mempererat kekeluargaan dan kekompakan antarpengurus." },
    { nama: "Harmonisasi HMJTI #2", dept: "Administrasi", waktu: "", status: "", isi: "Kegiatan harmonisasi lanjutan untuk menjaga kekompakan dan semangat kerja sama di HMJTI." },
    { nama: "LDK dan Pelantikan Pengurus", dept: "Administrasi", waktu: "", status: "", isi: "Latihan Dasar Kepemimpinan yang dirangkaikan dengan pelantikan pengurus HMJTI." },
    { nama: "Sosialisasi HMJTI 2025/2026", dept: "Administrasi", waktu: "", status: "", isi: "Pengenalan HMJTI periode 2025/2026 beserta peran dan kegiatannya kepada mahasiswa." },
    // Keilmuan
    { nama: "Competition Center", dept: "Keilmuan", waktu: "", status: "", isi: "Wadah informasi dan pengembangan bagi mahasiswa yang ingin mengikuti kompetisi." },
    { nama: "EPIM Expo", dept: "Keilmuan", waktu: "", status: "", isi: "Pameran dalam rangkaian EPIM untuk menampilkan karya mahasiswa.", highlight: true },
    { nama: "EPIM Web Programming", dept: "Keilmuan", waktu: "", status: "", isi: "Kompetisi pemrograman web dalam rangkaian EPIM." },
    { nama: "EPIM Design Packaging", dept: "Keilmuan", waktu: "", status: "", isi: "Kompetisi desain kemasan dalam rangkaian EPIM." },
    { nama: "ITC Mobile Legends: Bang Bang", dept: "Keilmuan", waktu: "", status: "", isi: "Information Technology Cup cabang e-sport Mobile Legends: Bang Bang (MLBB)." },
    { nama: "ITC Futsal", dept: "Keilmuan", waktu: "", status: "", isi: "Information Technology Cup cabang olahraga futsal." },
    { nama: "ITC Basket", dept: "Keilmuan", waktu: "", status: "", isi: "Information Technology Cup cabang olahraga bola basket." },
    // Kewirausahaan
    { nama: "Ramadhan Berkah", dept: "Kewirausahaan", waktu: "", status: "", isi: "Program kerja Departemen Kewirausahaan yang diselenggarakan dalam momentum bulan Ramadan." },
    // Perhubungan
    { nama: "Art Of Manunggalan (AOM)", dept: "Perhubungan", waktu: "", status: "", isi: "Acara festival tahunan yang diselenggarakan HMJTI.", highlight: true },
    { nama: "Visit IT", dept: "Perhubungan", waktu: "", status: "", isi: "Kegiatan kunjungan untuk menjalin hubungan dan bertukar wawasan." },
    { nama: "Apresiasi Wisudawan", dept: "Perhubungan", waktu: "", status: "", isi: "Bentuk penghargaan HMJTI kepada para wisudawan." },
  ];

  // Baris waktu & status, hanya dibuat jika datanya diisi.
  const prokerMeta = (p, cls) => p.waktu || p.status
    ? `<div class="${cls}">${p.waktu ? `<time>${escapeHtml(p.waktu)}</time>` : ""}${p.status ? `<span class="sp s-${STATUS_CLS[p.status]}">${escapeHtml(p.status)}</span>` : ""}</div>`
    : "";

  let pFilter = "all";
  function renderProker() {
    const list = PROKER.filter((p) => pFilter === "all" || p.dept === pFilter);
    const grid = $("prokerGrid");
    grid.innerHTML = list.length ? list.map((p) => {
      const kadep = DEP.find((d) => d[0] === p.dept);
      return `
      <div class="reveal"><article class="pc">
        ${prokerMeta(p, "pc-top")}
        <span class="pc-cat">${escapeHtml(p.dept)}</span>
        <h3 class="pc-title">${escapeHtml(p.nama)}</h3>
        <p class="pc-txt">${escapeHtml(p.isi)}</p>
        <div class="pc-by"><span>Penanggung jawab</span><b>${escapeHtml(kadep ? kadep[1] : "-")}</b></div>
      </article></div>`;
    }).join("") : `<p class="empty">Belum ada proker untuk departemen ini.</p>`;
    stagger(grid); observeAll(grid);
  }

  // Highlight di hero: proker bertanda highlight: true (maksimal 2).
  function renderHighlight() {
    const items = PROKER.filter((p) => p.highlight).slice(0, 2);
    const hl = $("hlList");
    hl.innerHTML = items.map((p, i) => `
      <a href="#proker" class="hl-i reveal" style="--i:${i + 3}">
        ${prokerMeta(p, "hl-t")}
        <b>${escapeHtml(p.nama)}</b><p>${escapeHtml(p.isi)}</p></a>`).join("");
    observeAll(hl);
  }

  document.querySelectorAll("#prokerFilters .fp").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("#prokerFilters .fp").forEach((x) => { x.classList.remove("active"); x.setAttribute("aria-pressed", "false"); });
    b.classList.add("active"); b.setAttribute("aria-pressed", "true");
    pFilter = b.dataset.f; renderProker();
  }));

  // Galeri carousel: tambah objek ke GALERI (url = halaman berita yang dibuka saat foto diklik).
  const GALERI = [
    { img: "assets/galeri1.jpeg", url: "galeri1.html", t: "Art of Manunggalan (AOM)", d: "  Double Way Gerbang Belakang Polije" },
    { img: "assets/galeri2.jpeg", url: "galeri2.html", t: "LKMM Pra TD", d: " Gedung JTI Polije " },
    { img: "assets/galeri3.jpeg", url: "galeri3.html", t: "EPIM - TI", d: "  Gedung JTI Polije" },
    { img: "assets/galeri4.jpeg", url: "galeri4.html", t: "Visit IT", d: "  "  },
  ];
  const tr = $("galTrack"), prev = $("galPrev"), next = $("galNext");
  tr.innerHTML = GALERI.map((g, i) => `
    <div class="reveal"><button type="button" class="slide" data-i="${i}">
      <img src="${g.img}" alt="${escapeHtml(g.t)}" loading="lazy" draggable="false" />
      <span class="sl-ov"><b>${escapeHtml(g.t)}</b><small>${g.d}</small></span>
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
    window.location.href = GALERI[s.dataset.i].url;
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape") successModal.classList.add("hidden"); });

  // ===== Bagan hierarki kepengurusan =====
  // Isi tiap departemen: [jabatan, [daftar nama]]. co: true = Co Biro (diberi warna berbeda).
  // Nama Kepala Departemen diambil dari array DEP.
  const ORG_DEPT = {
    "Perhubungan": [
      { r: "Sekretaris Departemen", n: ["Syavana Aurel Septiarsa"] },
      
      { r: "Anggota Biro Internal", n: ["Tristan Juliano Maldini", "Raindra Pratama", "Rezza Wahyu Setya Adhy", "Nadila Dewi Mustika", "Farin Sevany Kasih", "Dhina Rinata", "Kiswah Najwa Febiyana"] },
      { r: "Co Biro Eksternal", n: ["Muzayyinatul Aulia"], co: true },
      { r: "Anggota Biro Eksternal", n: ["Lili Kurnia Putri", "Dwi Fitria Wardaniah", "Eka Fitri Salsabilah"] },
    ],
    "Administrasi": [
      { r: "Sekretaris Departemen", n: ["Febriana Rahmasari"] },
      { r: "Co Biro Kesekretariatan", n: ["Maulany Ayuning Rahma"], co: true },
      { r: "Anggota Departemen", n: ["Aldi Miftahul", "Rico Febrian", "Siti Aisyiyah", "Hanuum Rachmaniyar Salsabila"] },
    ],
    "Kewirausahaan": [
      { r: "Sekretaris Departemen", n: ["Indra Nur Hafyyan"] },
      { r: "Anggota Departemen", n: ["Fatimah Retnaning Larasati", "Lyra Aurelia", "Gadis Eka Pertiwi", "Radis Naila", "Lidya Aisyah Aprilia"] },
    ],
    "Kominfo": [
      { r: "Sekretaris Departemen", n: ["Rifda Aprilia"] },
      { r: "Co Biro Sistem Informasi", n: ["Safina Rahmatus Sa’diyah"], co: true },
      { r: "Anggota Biro Sistem Informasi", n: ["Bambang Sugiarto"] },
      { r: "Co Biro Publikasi", n: ["Diva Fidhelya Ariyani"], co: true },
      { r: "Anggota Biro Publikasi", n: ["Fairuz Zaky Nugraha", "Muhammad Syahrul Mubarok", "Sujono", "Muhammad Miska Nayafie", "Uaryl Engno Laurenca", "Muhamad Nauval Zdakwan Utomo", "Wildan Ramadhani Akbar"] },
    ],
    "Keilmuan": [
      { r: "Co Biro Akademik", n: ["Rafli Aulia Al Giffari"], co: true },
      { r: "Anggota Biro Akademik", n: ["Rianty Arda Wijaya", "Nur Hidayatul Fitriyah", "Putri Denta Tama", "Linda Ratnadela Angraini", "Yanuarta Tri Widurani"] },
      { r: "Co Biro Non Akademik", n: ["M. Rizky Niamuddin"], co: true },
      { r: "Anggota Biro Non Akademik", n: ["Rasya Aurik", "Fauzi Rafi Abimanyu Nugraha"] },
    ],
  };
  const ORG_ORDER = ["Perhubungan", "Administrasi", "Kewirausahaan", "Kominfo", "Keilmuan"];

  // sub boleh berupa satu nama (string) atau beberapa nama (array), satu nama per baris.
  const node = (title, sub, cls = "") => `<div class="o-node ${cls}"><b>${escapeHtml(title)}</b>${[].concat(sub || []).filter(Boolean).map((n) => `<span style="display:block">${escapeHtml(n)}</span>`).join("")}</div>`;
  const vl = `<i class="o-vl"></i>`, vs = `<i class="o-vl o-vs"></i>`;
  const bph = (i) => node(BPH[i][1], BPH[i][0], "o-bph");

  function deptColumn(name) {
    const kadep = DEP.find((d) => d[0] === name);
    const rows = [node("Departemen " + name, "", "o-dept"), node("Kepala Departemen", kadep ? kadep[1] : "", "o-sm o-kd")];
    ORG_DEPT[name].forEach((j) => rows.push(node(j.r, j.n, "o-sm" + (j.co ? " o-co" : ""))));
    return `<div class="o-col"><div class="o-stk">${rows.join(vs)}</div></div>`;
  }

  $("orgChart").innerHTML =
    node(BPH[0][1], BPH[0][0], "o-top") + vl +
    bph(1) + vl +
    `<div class="o-row o-split">
       <div class="o-col"><div class="o-stk">${bph(4)}${vl}${bph(5)}</div></div>
       <div class="o-col"><div class="o-stk">${bph(2)}${vl}${bph(3)}</div></div>
     </div>` +
    `<div class="o-merge"></div>` + vl +
    `<div class="o-row">${ORG_ORDER.map(deptColumn).join("")}</div>`;

  
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