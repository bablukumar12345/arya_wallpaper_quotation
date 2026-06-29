const ROOM_TYPES = [
  'Living Room', 'Bedroom', 'Master Bedroom', 'Children Room',
  'Drawing Room', 'Dining Room', 'Study Room', 'Guest Room'
];

const PAPERS = [
  'Non Woven', 'Matt Lamination', 'Premium Glitter', 'Premium Stroke',
  'Canvas Paper', 'Canvas Fabric', 'Premium Non Woven', 'PVC Paper',
  'HD Paper', 'Leather Texture', 'Ivory Weave', 'Embossed Non Woven',
  'Jointless Non Woven'
];

let roomCount = 0;
let wallCounters = {};
let currentDraftId = null;
let autoSaveTimer = null;

// ── CUSTOM CONFIRM DIALOG ─────────────────────────────────
function showConfirm(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.id = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-msg">${message}</div>
      <div class="confirm-btns">
        <button class="confirm-cancel" id="confirm-cancel-btn">Cancel</button>
        <button class="confirm-ok" id="confirm-ok-btn">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('confirm-ok-btn').onclick = () => {
    overlay.remove();
    onConfirm();
  };
  document.getElementById('confirm-cancel-btn').onclick = () => {
    overlay.remove();
  };
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}

// ── ADD ROOM ──────────────────────────────────────────────
function addRoom(saved) {
  roomCount++;
  const rid = roomCount;
  wallCounters[rid] = 0;
  const d = saved || {};

  const roomOpts = ROOM_TYPES.map(r =>
    `<option${d.category === r ? ' selected' : ''}>${r}</option>`
  ).join('');

  const selectedRoomPaper = d.roomPaper || PAPERS[0];
  const roomPaperChips = PAPERS.map(p =>
    `<div class="paper-chip${p === selectedRoomPaper ? ' active' : ''}"
      onclick="event.stopPropagation();selectRoomPaper(${rid},this,'${p.replace(/'/g, "\\'")}')">
      ${p}
    </div>`
  ).join('');

  const div = document.createElement('div');
  div.className = 'room-block';
  div.id = 'room-' + rid;
  div.innerHTML = `
    <div class="room-head">
      <div class="room-head-right-top">
        <button class="room-del-btn" onclick="event.stopPropagation();removeRoom(${rid})" title="Remove room">&times;</button>
      </div>
      <div class="room-details-block">
        <div class="room-section-label">Room Details</div>
        <div class="room-head-select-row">
          <div class="room-num-badge">${rid}</div>
          <select id="cat-${rid}" onclick="event.stopPropagation()" onchange="recalc()">${roomOpts}</select>
        </div>
        <div class="room-section-label" style="margin-top:12px;">Paper Quality</div>
        <div class="paper-chips" id="room-chips-${rid}" onclick="event.stopPropagation()">${roomPaperChips}</div>
        <input type="hidden" id="room-paper-${rid}" value="${selectedRoomPaper}"/>
      </div>
    </div>
    <div class="room-body" id="body-${rid}">
      <div id="walls-${rid}"></div>
      <div class="add-wall-area">
        <button class="add-wall-btn" onclick="addWall(${rid})">Add Wall</button>
      </div>
      <div class="room-footer">
        <div>
          <div class="room-total-label">Room Total</div>
          <div class="room-total-val" id="rtotal-${rid}">Rs. 0.00</div>
        </div>
        <div style="text-align:right;">
          <div class="room-total-label">Total Area</div>
          <div class="room-total-val" id="rsqft-${rid}">0.000 sq ft</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('rooms-wrap').appendChild(div);

  if (d.walls && d.walls.length) {
    d.walls.forEach(w => addWall(rid, w));
  } else {
    addWall(rid);
  }
}

// ── ADD WALL ──────────────────────────────────────────────
function addWall(rid, saved) {
  wallCounters[rid] = (wallCounters[rid] || 0) + 1;
  const wid = wallCounters[rid];
  const d = saved || {};

  const div = document.createElement('div');
  div.className = 'wall-card';
  div.id = `wall-${rid}-${wid}`;

  div.innerHTML = `
    <div class="wall-top">
      <div class="wall-badge">Wall ${wid}</div>
      ${wid > 1
      ? `<button class="wall-del-btn" onclick="removeWall(${rid},${wid})" title="Remove wall">&times;</button>`
      : ''}
    </div>

    <div class="wall-dims">
      <div class="dim-field">
        <label>Width (inch)</label>
        <input type="number" id="w-w-${rid}-${wid}" placeholder="0" min="0" step="0.1"
          value="${d.width || ''}" oninput="calcWall(${rid},${wid})"/>
      </div>
      <div class="dim-field">
        <label>Height (inch)</label>
        <input type="number" id="w-h-${rid}-${wid}" placeholder="0" min="0" step="0.1"
          value="${d.height || ''}" oninput="calcWall(${rid},${wid})"/>
      </div>
    </div>

    <div class="sqft-row">
      <div class="sqft-pill" id="pill-${rid}-${wid}">
        <span class="sqft-num" id="wsqft-${rid}-${wid}">--</span>
        <span class="sqft-unit">sq ft</span>
      </div>
    </div>

    <div class="pattern-section">
      <div class="pattern-section-label">Pattern Number</div>
      <div class="pattern-field">
        <input type="text" id="pnum-${rid}-${wid}" placeholder="e.g. WP-2024"
          value="${d.patternNum || ''}" oninput="scheduleAutoSave()"/>
      </div>
    </div>

    <div class="rate-row">
      <label>Rate (Rs./sq ft)</label>
      <input type="number" id="rate-${rid}-${wid}" placeholder="0" min="0" step="0.01"
        value="${d.rate || ''}" oninput="recalc()"/>
      <div class="wall-amount" id="wamt-${rid}-${wid}">Rs. 0.00</div>
    </div>
  `;

  document.getElementById('walls-' + rid).appendChild(div);
  if (d.width && d.height) calcWall(rid, wid);
  recalc();
}

// ── SELECT ROOM PAPER ─────────────────────────────────────
function selectRoomPaper(rid, el, paper) {
  document.querySelectorAll(`#room-chips-${rid} .paper-chip`).forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(`room-paper-${rid}`).value = paper;
  scheduleAutoSave();
}

// ── REMOVE WALL ───────────────────────────────────────────
function removeWall(rid, wid) {
  const el = document.getElementById(`wall-${rid}-${wid}`);
  if (el) { el.remove(); recalc(); }
}

// ── REMOVE ROOM ───────────────────────────────────────────
function removeRoom(rid) {
  const el = document.getElementById('room-' + rid);
  if (el) {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.2s';
    setTimeout(() => { el.remove(); recalc(); }, 200);
  }
}

// ── CALC SINGLE WALL SQ FT ───────────────────────────────
function calcWall(rid, wid) {
  const w = parseFloat(document.getElementById(`w-w-${rid}-${wid}`)?.value) || 0;
  const h = parseFloat(document.getElementById(`w-h-${rid}-${wid}`)?.value) || 0;
  const sqft = (w * h) / 144;
  const numEl = document.getElementById(`wsqft-${rid}-${wid}`);
  const pill = document.getElementById(`pill-${rid}-${wid}`);
  if (numEl) {
    numEl.textContent = sqft > 0 ? sqft.toFixed(3) : '--';
    if (pill) sqft > 0 ? pill.classList.add('has-val') : pill.classList.remove('has-val');
  }
  recalc();
}

// ── GET ALL WALLS OF A ROOM ───────────────────────────────
function getRoomWalls(rid) {
  const walls = [];
  document.querySelectorAll(`#walls-${rid} .wall-card`).forEach(el => {
    const parts = el.id.split('-');
    const wid = parts[parts.length - 1];
    const w = parseFloat(document.getElementById(`w-w-${rid}-${wid}`)?.value) || 0;
    const h = parseFloat(document.getElementById(`w-h-${rid}-${wid}`)?.value) || 0;
    const sqft = (w * h) / 144;
    const rate = parseFloat(document.getElementById(`rate-${rid}-${wid}`)?.value) || 0;
    const amt = sqft * rate;
    const paper = document.getElementById(`room-paper-${rid}`)?.value || '';
    const patternNum = document.getElementById(`pnum-${rid}-${wid}`)?.value || '';
    walls.push({ wid, width: w, height: h, sqft, rate, amt, paper, patternNum });
  });
  return walls;
}

// ── UPDATE BALANCE ────────────────────────────────────────
function updateBalance() {
  const grandTotalText = document.getElementById('grand-total')?.textContent || 'Rs. 0.00';
  const grandTotal = parseFloat(grandTotalText.replace('Rs.', '').replace(/,/g, '').trim()) || 0;
  const advance = parseFloat(document.getElementById('advance-amount')?.value) || 0;
  const balance = grandTotal - advance;

  const balVal = document.getElementById('balance-val');
  const balNote = document.getElementById('balance-note');

  if (balVal) {
    balVal.textContent = 'Rs. ' + Math.abs(balance).toFixed(2);
    if (balance < 0) {
      balVal.className = 'balance-val overdue';
      balVal.style.color = '';
      if (balNote) balNote.textContent = 'Advance exceeds total';
    } else if (balance === 0) {
      balVal.className = 'balance-val';
      balVal.style.color = 'var(--green)';
      if (balNote) balNote.textContent = 'Fully paid';
    } else {
      balVal.className = 'balance-val';
      balVal.style.color = 'var(--green)';
      if (balNote) balNote.textContent = '';
    }
  }
}

// ── RECALC ALL ────────────────────────────────────────────
function recalc() {
  let grandSqft = 0, grandTotal = 0;
  const summaryRows = [];

  document.querySelectorAll('.room-block').forEach(el => {
    const rid = el.id.replace('room-', '');
    const walls = getRoomWalls(rid);
    let roomSqft = 0, roomAmt = 0;

    walls.forEach(w => {
      roomSqft += w.sqft;
      roomAmt += w.amt;
      const amtEl = document.getElementById(`wamt-${rid}-${w.wid}`);
      if (amtEl) amtEl.textContent = 'Rs. ' + w.amt.toFixed(2);
    });

    grandSqft += roomSqft;
    grandTotal += roomAmt;

    const rtEl = document.getElementById(`rtotal-${rid}`);
    const rsEl = document.getElementById(`rsqft-${rid}`);
    if (rtEl) rtEl.textContent = 'Rs. ' + roomAmt.toFixed(2);
    if (rsEl) rsEl.textContent = roomSqft.toFixed(3) + ' sq ft';

    const catEl = document.getElementById('cat-' + rid);
    summaryRows.push({ name: catEl?.value || 'Room', sqft: roomSqft, amt: roomAmt });
  });

  document.getElementById('grand-sqft').textContent = grandSqft.toFixed(3) + ' sq ft';
  document.getElementById('grand-total').textContent = 'Rs. ' + grandTotal.toFixed(2);

  const sr = document.getElementById('summary-rooms');
  if (sr) {
    sr.innerHTML = summaryRows.map(r => `
      <div class="sum-room-row">
        <span class="sum-room-name">${r.name} &mdash; ${r.sqft.toFixed(3)} sq ft</span>
        <span class="sum-room-amt">Rs. ${r.amt.toFixed(2)}</span>
      </div>`).join('') || '';
  }

  updateBalance();
  scheduleAutoSave();
}

// ── GATHER DATA ───────────────────────────────────────────
function gatherData() {
  const rooms = [];
  document.querySelectorAll('.room-block').forEach(el => {
    const rid = el.id.replace('room-', '');
    const walls = getRoomWalls(rid);
    let roomSqft = 0, roomAmt = 0;
    walls.forEach(w => { roomSqft += w.sqft; roomAmt += w.amt; });
    rooms.push({
      category: document.getElementById('cat-' + rid)?.value || '',
      roomPaper: document.getElementById('room-paper-' + rid)?.value || '',
      walls, roomSqft, roomAmt
    });
  });
  return {
    name: document.getElementById('cust-name').value,
    phone: document.getElementById('cust-phone').value,
    address: document.getElementById('cust-address').value,
    advance: parseFloat(document.getElementById('advance-amount')?.value) || 0,
    date: new Date().toLocaleDateString('en-IN'),
    rooms
  };
}

// ── SHOW BILL ─────────────────────────────────────────────
function showBill() {
  const data = gatherData();
  let grandSqft = 0, grandTotal = 0;
  data.rooms.forEach(r => { grandSqft += r.roomSqft; grandTotal += r.roomAmt; });

  const advance = data.advance || 0;
  const balance = grandTotal - advance;
  const balanceColor = balance < 0 ? 'var(--red)' : '#0c7e52';
  const balanceLabel = balance < 0 ? 'Overpaid' : 'Balance Due';

  const rows = data.rooms.flatMap(r =>
    r.walls.map(w => {
      const patternCell = w.patternNum || '—';
      return `
        <tr>
          <td>${r.category}</td>
          <td>Wall ${w.wid}</td>
          <td>${r.roomPaper}</td>
          <td>${patternCell}</td>
          <td>${w.width}</td>
          <td>${w.height}</td>
          <td>${w.sqft.toFixed(3)}</td>
          <td>Rs. ${w.rate.toFixed(2)}</td>
          <td>Rs. ${w.amt.toFixed(2)}</td>
        </tr>`;
    })
  ).join('');

  const logoHtml = `
    <img src="/img/logo.jpeg" class="bill-logo-img" alt="Logo"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
    <span class="bill-logo-fallback" style="display:none;">W</span>`;

  document.getElementById('bill-content').innerHTML = `
    <div class="bill-header">
      <div class="bill-co">
        <div class="bill-logo-wrap">
          ${logoHtml}
          <div>ARYA WALLPAPER<small>Pawan Kumar</small></div>
        </div>
      </div>
      <div class="bill-meta">
        Date: <b>${data.date}</b><br>
        Customer: <b>${data.name || '--'}</b><br>
        Phone: <b>${data.phone || '--'}</b><br>
        ${data.address ? `Address: <b>${data.address}</b>` : ''}
      </div>
    </div>

    <div class="bill-table-wrap">
      <table class="bill-table">
        <thead><tr>
          <th>Room</th>
          <th>Wall</th>
          <th>Paper</th>
          <th>Pattern</th>
          <th>Width</th>
          <th>Height</th>
          <th>Sq Ft</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="bill-totals-block">
      <div class="bill-total-row">
        <span>Total Area</span>
        <span>${grandSqft.toFixed(3)} sq ft</span>
      </div>
      <div class="bill-total-row grand">
        <span>Grand Total</span>
        <span>Rs. ${grandTotal.toFixed(2)}</span>
      </div>
      <div class="bill-total-row">
        <span>Advance Paid</span>
        <span style="color:#0c7e52;">&#8722; Rs. ${advance.toFixed(2)}</span>
      </div>
      <div class="bill-total-row" style="font-size:15px;font-weight:700;padding-top:10px;border-top:1.5px solid #e2e6ef;">
        <span style="color:${balanceColor};">${balanceLabel}</span>
        <span style="color:${balanceColor};">Rs. ${Math.abs(balance).toFixed(2)}</span>
      </div>
    </div>

    <div class="bill-payment-terms">
      <div class="bpt-title">Payment Terms</div>
      <div class="bpt-row"><span class="bpt-dot"></span><span>50% advance payment required before work begins</span></div>
      <div class="bpt-row"><span class="bpt-dot"></span><span>Remaining 50% due upon work completion</span></div>
      <div class="bpt-row"><span class="bpt-dot"></span><span>Thank you for your business!</span></div>
    </div>
  `;

  document.getElementById('bill-modal').classList.add('open');
  const fbMenu = document.getElementById('share-fallback-menu');
  if (fbMenu) fbMenu.classList.remove('open');
}

// ── CLOSE BILL ────────────────────────────────────────────
function closeBill() {
  const modal = document.getElementById('bill-modal');
  if (modal) modal.classList.remove('open');
  const fbMenu = document.getElementById('share-fallback-menu');
  if (fbMenu) fbMenu.classList.remove('open');
}

// ── PRINT ─────────────────────────────────────────────────
function printBill() {
  const billHtml = document.getElementById('bill-content').innerHTML;
  const printWin = window.open('', '_blank');
  printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <title>Noida Decor — Bill</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Inter',sans-serif;font-size:13px;color:#111827;background:#f4f5f9;}
    .wrap{max-width:760px;margin:0 auto;padding:14px 14px 40px;}
    .topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;}
    .btn-back{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;background:#fff;color:#0b1e3d;border:1.5px solid #0b1e3d;border-radius:8px;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;}
    .btn-download{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;background:#0b1e3d;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;}
    .bill-box{background:#fff;border-radius:12px;padding:24px 20px;}
    .bill-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0b1e3d;padding-bottom:14px;margin-bottom:16px;flex-wrap:wrap;gap:10px;}
    .bill-co{font-size:20px;font-weight:700;color:#0b1e3d;}
    .bill-co small{display:block;font-size:10px;font-weight:400;color:#9ca3af;margin-top:3px;text-transform:uppercase;letter-spacing:.08em;}
    .bill-logo-wrap{display:flex;align-items:center;gap:12px;margin-bottom:4px;}
    .bill-logo-img{width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid #e2e6ef;}
    .bill-logo-fallback{width:48px;height:48px;border-radius:8px;background:#c9a84c;color:#0b1e3d;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;}
    .bill-meta{font-size:12px;color:#4b5563;line-height:2;}
    .bill-table-wrap{width:100%;overflow-x:auto;margin-bottom:14px;}
    .bill-table{width:100%;min-width:560px;border-collapse:collapse;font-size:12px;}
    .bill-table th{background:#0b1e3d;color:#fff;padding:9px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;}
    .bill-table th:last-child{text-align:right;}
    .bill-table td{padding:9px 10px;border-bottom:1px solid #eef0f7;font-size:12px;white-space:nowrap;}
    .bill-table td:last-child{text-align:right;font-weight:700;}
    .bill-table tr:last-child td{border-bottom:none;}
    .bill-table tr:nth-child(even) td{background:#f8f9fd;}
    .bill-totals-block{background:#f8f9fd;border:1px solid #e2e6ef;border-radius:8px;padding:14px 16px;margin-top:12px;display:flex;flex-direction:column;gap:10px;}
    .bill-total-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#4b5563;}
    .bill-total-row.grand{font-size:16px;font-weight:700;color:#0b1e3d;padding-top:10px;border-top:1.5px solid #e2e6ef;}
    .bill-payment-terms{margin-top:16px;border-top:1.5px dashed #cdd2e0;padding-top:14px;}
    .bpt-title{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;}
    .bpt-row{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#4b5563;margin-bottom:6px;line-height:1.5;}
    .bpt-row:last-child{margin-bottom:0;}
    .bpt-dot{width:6px;height:6px;background:#c9a84c;border-radius:50%;flex-shrink:0;margin-top:5px;}
    @media print{@page{margin:8mm;}body{background:#fff;}.topbar{display:none!important;}.wrap{padding:0;}.bill-box{border-radius:0;padding:0;}}
  </style>
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <button class="btn-back" onclick="window.close()">&#8592; Back</button>
    <button class="btn-download" onclick="window.print()">&#8595; Download / Print</button>
  </div>
  <div class="bill-box">${billHtml}</div>
</div>
</body>
</html>`);
  printWin.document.close();
}

// ── TOAST ─────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position:fixed;bottom:28px;left:50%;
    transform:translateX(-50%) translateY(20px);
    background:${type === 'success' ? '#0b1e3d' : '#be123c'};
    color:#fff;padding:12px 24px;border-radius:50px;
    font-size:13px;font-weight:600;font-family:'Inter',sans-serif;
    box-shadow:0 8px 24px rgba(0,0,0,0.22);z-index:9999;
    opacity:0;transition:opacity 0.25s ease,transform 0.25s ease;
    pointer-events:none;white-space:nowrap;max-width:90vw;text-align:center;
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ════════════════════════════════════════════════════════════
// ── AUTO SAVE / DRAFT RESTORE ────────────────────────────────
// ════════════════════════════════════════════════════════════

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(autoSaveDraft, 800);
}

function autoSaveDraft() {
  const data = gatherData();

  const hasContent = data.name || data.phone || data.address ||
    data.rooms.some(r => r.walls.some(w => w.width || w.height || w.rate));

  if (!hasContent) return;

  let grandTotal = 0;
  data.rooms.forEach(r => grandTotal += r.roomAmt);
  data.grandTotal = grandTotal;
  data.savedAt = new Date().toISOString();

  let h = JSON.parse(localStorage.getItem('wq2_history') || '[]');

  if (currentDraftId) {
    const idx = h.findIndex(x => x.id === currentDraftId);
    if (idx !== -1) {
      data.id = currentDraftId;
      h[idx] = data;
    } else {
      data.id = Date.now();
      currentDraftId = data.id;
      h.unshift(data);
    }
  } else {
    data.id = Date.now();
    currentDraftId = data.id;
    h.unshift(data);
  }

  localStorage.setItem('wq2_history', JSON.stringify(h.slice(0, 20)));
  localStorage.setItem('wq2_current_draft', String(currentDraftId));
  renderHistory();
}

function restoreDraftIfAny() {
  const id = localStorage.getItem('wq2_current_draft');
  if (!id) return false;

  const h = JSON.parse(localStorage.getItem('wq2_history') || '[]');
  const q = h.find(x => x.id === parseInt(id));
  if (!q) return false;

  currentDraftId = q.id;
  clearAll(true);

  document.getElementById('cust-name').value = q.name || '';
  document.getElementById('cust-phone').value = q.phone || '';
  document.getElementById('cust-address').value = q.address || '';
  document.getElementById('advance-amount').value = q.advance || '';

  if (q.rooms && q.rooms.length) {
    q.rooms.forEach(r => addRoom(r));
  } else {
    addRoom();
  }

  updateBalance();
  return true;
}

// ── SAVE QUOTE (manual button) ────────────────────────────
function saveQuote() {
  clearTimeout(autoSaveTimer);
  autoSaveDraft();
  showToast('Quote saved successfully!');
}

// ── HISTORY ───────────────────────────────────────────────
function renderHistory() {
  const h = JSON.parse(localStorage.getItem('wq2_history') || '[]');
  const el = document.getElementById('history-list');
  if (!h.length) { el.innerHTML = '<p class="empty-msg">No saved quotes yet.</p>'; return; }
  el.innerHTML = h.map(q => `
    <div class="hist-item">
      <div>
        <div class="hist-name">${q.name || 'No Name'}<span class="hist-qno">${q.quoteNo || ''}</span></div>
        <div class="hist-meta">${new Date(q.savedAt).toLocaleString('en-IN')} | ${q.rooms?.length || 0} room(s)</div>
      </div>
      <div class="hist-right">
        <div class="hist-amt">Rs. ${(q.grandTotal || 0).toFixed(2)}</div>
        <div class="hist-btns">
          <button class="hbtn" onclick="loadQuote(${q.id})">Load</button>
          <button class="hbtn hbtn-del" onclick="deleteQuote(${q.id})">Delete</button>
        </div>
      </div>
    </div>`).join('');
}

function loadQuote(id) {
  const h = JSON.parse(localStorage.getItem('wq2_history') || '[]');
  const q = h.find(x => x.id === id);
  if (!q) return;

  currentDraftId = q.id;
  localStorage.setItem('wq2_current_draft', String(q.id));

  clearAll(true);
  document.getElementById('cust-name').value = q.name || '';
  document.getElementById('cust-phone').value = q.phone || '';
  document.getElementById('cust-address').value = q.address || '';
  document.getElementById('advance-amount').value = q.advance || '';
  q.rooms.forEach(r => addRoom(r));
  updateBalance();
}

// ── DELETE — apna custom confirmation dialog ──────────────
function deleteQuote(id) {
  const h = JSON.parse(localStorage.getItem('wq2_history') || '[]');
  const q = h.find(x => x.id === id);
  const name = q ? (q.name || 'Unnamed Quote') : 'this quote';

  showConfirm(
    `<b>"${name}"</b> ko delete karna chahte hain?<br><span style="font-size:12px;color:#9ca3af;">Yeh quote hamesha ke liye mit jayega.</span>`,
    () => {
      let updated = JSON.parse(localStorage.getItem('wq2_history') || '[]');
      updated = updated.filter(x => x.id !== id);
      localStorage.setItem('wq2_history', JSON.stringify(updated));

      if (currentDraftId === id) {
        currentDraftId = null;
        localStorage.removeItem('wq2_current_draft');
      }

      renderHistory();
      showToast('Quote delete ho gaya');
    }
  );
}

function clearAll(silent) {
  document.getElementById('rooms-wrap').innerHTML = '';
  roomCount = 0;
  wallCounters = {};
  if (!silent) {
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-phone').value = '';
    document.getElementById('cust-address').value = '';
    document.getElementById('advance-amount').value = '';
    currentDraftId = null;
    localStorage.removeItem('wq2_current_draft');
  }
  recalc();
}

// ════════════════════════════════════════════════════════════
// ── SHARE FEATURE ─────────────────────────────────────────
// ════════════════════════════════════════════════════════════

function getBillSummaryText() {
  const data = gatherData();
  let grandSqft = 0, grandTotal = 0;
  data.rooms.forEach(r => { grandSqft += r.roomSqft; grandTotal += r.roomAmt; });
  const advance = data.advance || 0;
  const balance = grandTotal - advance;

  let lines = [];
  lines.push('*Noida Decor — Quotation*');
  lines.push('Date: ' + data.date);
  if (data.name) lines.push('Customer: ' + data.name);
  if (data.phone) lines.push('Phone: ' + data.phone);
  if (data.address) lines.push('Address: ' + data.address);
  lines.push('');
  data.rooms.forEach(r => {
    lines.push(r.category + ' (' + r.roomPaper + ') — ' + r.roomSqft.toFixed(3) + ' sq ft — Rs. ' + r.roomAmt.toFixed(2));
  });
  lines.push('');
  lines.push('Total Area: ' + grandSqft.toFixed(3) + ' sq ft');
  lines.push('Grand Total: Rs. ' + grandTotal.toFixed(2));
  if (advance > 0) {
    lines.push('Advance Paid: Rs. ' + advance.toFixed(2));
    lines.push((balance < 0 ? 'Overpaid' : 'Balance Due') + ': Rs. ' + Math.abs(balance).toFixed(2));
  }
  return lines.join('\n');
}

function generateBillImageBlob() {
  const billEl = document.getElementById('bill-content');
  return html2canvas(billEl, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true
  }).then(canvas => {
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/png');
    });
  });
}

async function shareBill() {
  const shareBtn = document.getElementById('share-btn');
  const fallbackMenu = document.getElementById('share-fallback-menu');
  const data = gatherData();
  const fileName = 'Quotation-' + (data.name || 'Customer').replace(/\s+/g, '_') + '.png';

  if (shareBtn) {
    shareBtn.disabled = true;
    shareBtn.dataset.originalText = shareBtn.textContent;
    shareBtn.textContent = 'Preparing...';
  }

  try {
    const blob = await generateBillImageBlob();
    const file = new File([blob], fileName, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Wallpaper Quotation',
        text: getBillSummaryText()
      });
    } else {
      window._lastBillBlob = blob;
      window._lastBillFileName = fileName;
      if (fallbackMenu) fallbackMenu.classList.add('open');
      showToast('Image taiyar hai, neeche option choose karein');
    }
  } catch (err) {
    console.error(err);
    showToast('Kuch gadbad hui, dobara try karein', 'error');
  } finally {
    if (shareBtn) {
      shareBtn.textContent = shareBtn.dataset.originalText || 'Share';
      shareBtn.disabled = false;
    }
  }
}

function downloadBillImage() {
  if (!window._lastBillBlob) {
    showToast('Pehle Share button dabayen', 'error');
    return;
  }
  const url = URL.createObjectURL(window._lastBillBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = window._lastBillFileName || 'quotation.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Image download ho gayi!');
}

function shareWhatsApp() {
  if (window._lastBillBlob) downloadBillImage();
  const text = encodeURIComponent(getBillSummaryText() + '\n\n(Bill image attach karein jo download hui hai)');
  window.open('https://wa.me/?text=' + text, '_blank');
  const fbMenu = document.getElementById('share-fallback-menu');
  if (fbMenu) fbMenu.classList.remove('open');
}

function shareEmail() {
  if (window._lastBillBlob) downloadBillImage();
  const data = gatherData();
  const subject = encodeURIComponent('Wallpaper Quotation - ' + (data.name || 'Customer'));
  const body = encodeURIComponent(getBillSummaryText() + '\n\n(Bill image attach karein jo download hui hai)');
  window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
  const fbMenu = document.getElementById('share-fallback-menu');
  if (fbMenu) fbMenu.classList.remove('open');
}

// ── INIT ──────────────────────────────────────────────────
document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-IN', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

const restored = restoreDraftIfAny();
if (!restored) {
  addRoom();
}
renderHistory();