// ========================================
// OJ-Password ReBuilder v1.1 Permanent Algorithm
// ========================================

// UI参照
const masterInput = document.getElementById("masterKey");
const monthInput  = document.getElementById("month");
const countSelect = document.getElementById("count");
const placeWrap   = document.getElementById("placeWrap");
const generateBtn = document.getElementById("generateBtn");
const resultArea  = document.getElementById("resultArea");
const resultList  = document.getElementById("resultList");

// ========================================
// 用途入力欄を作成
// ========================================
function updatePlaceInputs() {
  placeWrap.innerHTML = "";

  const count = parseInt(countSelect.value, 10);

  for (let i = 1; i <= count; i++) {
    const div = document.createElement("div");
    div.className = "section";

    div.innerHTML = `
      <div class="section-title">どこで使う？（${i} 個目）</div>
      <input type="text" class="placeInput" placeholder="例：Google / Slack / PC">
    `;
    placeWrap.appendChild(div);
  }
}

// 初期生成
updatePlaceInputs();
countSelect.addEventListener("change", updatePlaceInputs);

// ========================================
// SHA256（ブラウザネイティブ）
// ========================================
async function sha256hex(text) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  const byteArray = Array.from(new Uint8Array(buffer));
  return byteArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ========================================
// パスワード生成（永久固定版）
// ========================================
// ========================================
// SHA256 → HEX
// ========================================
async function sha256hex(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");
}

// ========================================
// パスワード生成（記号必須ロジック統合）
// ========================================
async function buildPassword(masterKey, service, month, length, allowSymbol) {

  const seed = `${masterKey}|${service}|${month}`;

  // SHA256 HEX
  const hex = await sha256hex(seed);

  // 記号セット
  const symbols = "._-";

  // 使用文字リスト（紛らわしい文字を除外）
  let chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789";

  if (allowSymbol) chars += symbols;

  // まずは通常通りパスワード生成
  let password = "";

  for (let i = 0; i < length; i++) {
    const part = hex.slice(i*2, i*2+2);
    const num  = parseInt(part, 16);
    password += chars[num % chars.length];
  }

  // ====================================
  // ★ 記号ONで、記号が1つも無かったら補正する
  // ====================================
  if (allowSymbol && !/[._-]/.test(password)) {

    // 記号を決める：HEXの最後の1byteから決定論で選ぶ
    const lastByteHex = hex.slice(-2);                 // 例 "af"
    const lastNum     = parseInt(lastByteHex, 16);     // 0〜255
    const forcedSym   = symbols[lastNum % symbols.length];

    // 先頭1文字を記号に差し替えて永久固定
    password = forcedSym + password.slice(1);
  }

  return password;
}




// ========================================
// 生成
// ========================================
generateBtn.addEventListener("click", async () => {
  const master = masterInput.value.trim();
  const month  = monthInput.value.trim();
  const count  = parseInt(countSelect.value, 10);

  if (!master) return alert("❌ マスターキーを入力してね！");
  if (!/^\d{6}$/.test(month)) return alert("❌ 作成月は 202512 のように6桁で！");

  const placeInputs = [...document.getElementsByClassName("placeInput")];
  if (placeInputs.some(i => !i.value.trim())) {
    return alert("❌ 『どこで使う？』を全部入力してね！");
  }

  const length = parseInt(document.getElementById("pwLength").value);
  const allowSymbol = document.getElementById("useSymbol").checked;

  let html = "";

 for (let i = 0; i < count; i++) {
  const place = placeInputs[i].value.trim();

  // ← ここ！buildPassword は async だから await 必須
  const pass = await buildPassword(master, place, month, length, allowSymbol);

  html += `
    <div class="result-item" style="margin-bottom: 22px;">
      <strong>[${i + 1} 個目：${place}]</strong><br>
     <div class="pw-row">
      <code class="pw">${pass}</code>
      <button class="copyBtn" data-pw="${pass}">📋 コピー</button>
    </div>
  </div>
`;
}
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("copyBtn")) {
    const pw = e.target.dataset.pw;
    navigator.clipboard.writeText(pw).then(() => {
      e.target.textContent = "✔ コピー済み";
      setTimeout(() => {
        e.target.textContent = "📋 コピー";
      }, 1200);
    });
  }
});


  resultList.innerHTML = html;
  resultArea.style.display = "block";

  masterInput.value = ""; // セキュリティのためクリア
});
