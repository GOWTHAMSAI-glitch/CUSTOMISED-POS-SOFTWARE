let columns = JSON.parse(localStorage.getItem('pos_columns') || '["All","Main Course","Starters","Biryani","Drinks","Meals","WAFFLE"]');
let products = JSON.parse(localStorage.getItem('pos_products') || '[]');
if (products.length == 0) {
  products = [
    { id: 1, name: 'Chicken Biryani', price: 180, stock: 50, barcode: '1001', gst: 5, cat: 'Biryani', veg: 'nonveg' },
    { id: 2, name: 'Mutton Biryani', price: 250, stock: 20, barcode: '1002', gst: 5, cat: 'Biryani', veg: 'nonveg' },
    { id: 3, name: 'Veg Biryani', price: 120, stock: 30, barcode: '1003', gst: 5, cat: 'Biryani', veg: 'veg' },
    { id: 4, name: 'Paneer Curry', price: 140, stock: 20, barcode: '1004', gst: 5, cat: 'Main Course', veg: 'veg' },
    { id: 5, name: 'Chicken Curry', price: 180, stock: 20, barcode: '1005', gst: 5, cat: 'Main Course', veg: 'nonveg' },
    { id: 6, name: 'Chicken 65', price: 200, stock: 15, barcode: '1006', gst: 5, cat: 'Starters', veg: 'nonveg' },
    { id: 7, name: 'Tea', price: 15, stock: 100, barcode: '1007', gst: 0, cat: 'Drinks', veg: 'drink' },
    { id: 8, name: 'Cool Drink', price: 40, stock: 40, barcode: '1008', gst: 18, cat: 'Drinks', veg: 'drink' },
    { id: 9, name: 'Classic Waffle', price: 99, stock: 30, barcode: '1009', gst: 5, cat: 'WAFFLE', veg: 'veg' },
    { id: 10, name: 'Chocolate Waffle', price: 129, stock: 30, barcode: '1010', gst: 5, cat: 'WAFFLE', veg: 'veg' },
  ]; save();
}
let cart = [];
let sales = JSON.parse(localStorage.getItem('pos_sales') || '[]');
let customers = JSON.parse(localStorage.getItem('pos_customers') || '[]');
let msgHistory = JSON.parse(localStorage.getItem('pos_msg_history') || '[]');
let settings = JSON.parse(localStorage.getItem('pos_settings') || '{"shopName":"GOWTHAM STORE","shopAddr":"Nellore, AP","shopPhone":"Ph: 90000 00000","ownerPhone":"6303033677","ownerNotify":true,"custNotify":true}');
let activeCol = 'All'; let activeVeg = 'all';
const FAST2SMS_API_KEY = "";
const SEND_MODE = "sms";
async function sendDirect(phone, message) {
  if (!phone || phone.length != 10) return;
  if (FAST2SMS_API_KEY) {
    try { await fetch("https://www.fast2sms.com/dev/bulkV2", { method: "POST", headers: { "authorization": FAST2SMS_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ "route": "q", "message": message, "language": "english", "flash": 0, "numbers": phone }) }); return; } catch (e) {}
  }
  if (SEND_MODE === "whatsapp") { window.location.href = 'whatsapp://send?phone=91' + phone + '&text=' + encodeURIComponent(message); }
  else { window.location.href = 'sms:+91' + phone + '?body=' + encodeURIComponent(message); }
}
function fillTemplate() {
  let t = document.getElementById('msgTemplate').value;
  let shop = settings.shopName;
  let msgs = {
    'offer': `🎉 *OFFER - ${shop}*\nToday Special! Buy 1 Waffle Get 1 Free!\nVisit: ${settings.shopAddr}\nCall: ${settings.shopPhone}`,
    'thankyou': `🙏 Thank You for visiting ${shop}!\nWe hope you enjoyed your food.\nVisit Again! - ${shop}`,
    'festival': `🎊 *Festival Offer - ${shop}*\nSpecial Discount 20% on All Items Today!\nVisit: ${settings.shopAddr}`,
    'feedback': `⭐ Hi! How was your food at ${shop}?\nPlease reply with your feedback.\nThank You! 🙏`,
    'newitem': `🆕 *New Item in ${shop}*\nTry our New Chocolate Waffle - Only ₹129!\nVisit Today!`
  };
  if (msgs[t]) document.getElementById('msgText').value = msgs[t];
  if (t === 'custom') document.getElementById('msgText').value = '';
}
function saveMsgHistory(phone, msg, type) {
  msgHistory.unshift({ phone, msg, type, date: new Date().toLocaleString() });
  if (msgHistory.length > 100) msgHistory = msgHistory.slice(0,100);
  localStorage.setItem('pos_msg_history', JSON.stringify(msgHistory));
  renderMsgHistory();
}
function renderMsgHistory() {
  let el = document.getElementById('msgHistory'); if(!el) return;
  document.getElementById('msgHistoryCount').innerText = 'Total Messages Sent: ' + msgHistory.length;
  document.getElementById('bulkCount').innerText = customers.length;
  el.innerHTML = msgHistory.map(m => `<div class="prod"><div><b>${m.phone}</b> - ${m.type}<br><small>${m.date}</small><br><small>${m.msg.substring(0,80)}...</small></div></div>`).join('') || '<p>No messages yet</p>';
}
function clearMsgHistory() { if(!confirm('Clear message history?')) return; msgHistory=[]; localStorage.setItem('pos_msg_history','[]'); renderMsgHistory(); }
function sendSingleMessage(mode) {
  let phone = document.getElementById('msgPhone').value.trim();
  let msg = document.getElementById('msgText').value.trim();
  if (!phone || phone.length != 10) return alert('Enter 10-digit Phone');
  if (!msg) return alert('Enter Message');
  saveMsgHistory(phone, msg, mode === 'whatsapp' ? 'WhatsApp' : 'SMS');
  if (mode === 'whatsapp') { window.location.href = 'whatsapp://send?phone=91' + phone + '&text=' + encodeURIComponent(msg); }
  else { window.location.href = 'sms:+91' + phone + '?body=' + encodeURIComponent(msg); }
  alert('Message Opening - ' + phone);
}
function sendToOwnerMsg() {
  let msg = document.getElementById('ownerMsgText').value.trim();
  if (!msg) { let today = new Date().toDateString(); let sum = sales.filter(s => new Date(s.date).toDateString() == today).reduce((a,b)=>a+b.total,0); msg = `🔔 Today Sale Report - ${settings.shopName}\nToday Sale: ₹${sum}\nBills: ${sales.filter(s => new Date(s.date).toDateString() == today).length}\nCustomers: ${customers.length}`; document.getElementById('ownerMsgText').value = msg; }
  saveMsgHistory(settings.ownerPhone, msg, 'Owner');
  sendDirect(settings.ownerPhone, msg);
  alert('Sent to Owner');
}
function sendBulkMessage() {
  let msg = document.getElementById('bulkMsgText').value.trim();
  if (!msg) return alert('Enter Bulk Message');
  if (customers.length == 0) return alert('No customers yet. Do billing first.');
  if (!confirm('Send to ' + customers.length + ' customers? It will open one by one.')) return;
  saveMsgHistory('ALL ('+customers.length+')', msg, 'Bulk');
  let i = 0;
  function next() {
    if (i >= customers.length) return alert('Bulk Done!');
    let c = customers[i]; i++;
    window.open('sms:+91' + c.phone + '?body=' + encodeURIComponent('Hi ' + c.name + ', ' + msg), '_blank');
    setTimeout(next, 1500);
  }
  next();
}
function saveCustomerToNotepad(cust, phone, total, billNo) {
  if (!cust || cust === 'Customer') return;
  let entry = { name: cust, phone: phone || '-', total: total, billNo: billNo, date: new Date().toLocaleString() };
  customers.unshift(entry);
  if (customers.length > 500) customers = customers.slice(0, 500);
  localStorage.setItem('pos_customers', JSON.stringify(customers));
  renderCustomers();
}
function renderCustomers() {
  let el = document.getElementById('custList'); if (!el) return;
  document.getElementById('custCount').innerText = customers.length;
  el.innerHTML = customers.map(c => `<div class="prod"><div><b>${c.name}</b> - ${c.phone}<br><small>${c.date} | Bill: ${c.billNo}</small></div><div style="display:flex;gap:5px"><button class="btn-wa" style="width:auto;padding:6px 10px" onclick="quickMsg('${c.phone}','${c.name}')">💬 Msg</button><b>₹${c.total}</b></div></div>`).join('') || '<p>No customers yet</p>';
  if(document.getElementById('bulkCount')) document.getElementById('bulkCount').innerText = customers.length;
}
function quickMsg(phone, name) {
  showTab('messages', document.querySelectorAll('.tabs button')[7]);
  document.getElementById('msgPhone').value = phone;
  document.getElementById('msgText').value = `Hi ${name}, Thank You for visiting ${settings.shopName}! Visit Again! 🙏`;
  window.scrollTo(0,0);
}
function getNotepadText() {
  let txt = `VINTAGE WAFFLE - CUSTOMER NOTEPAD\n${settings.shopName} | ${settings.shopAddr}\nTotal Customers: ${customers.length}\n================================\n`;
  customers.forEach((c, i) => { txt += `${i+1}. Name: ${c.name}\n   Phone: ${c.phone}\n   Bill: ${c.billNo} | Total: Rs.${c.total}\n   Date: ${c.date}\n--------------------------------\n`; });
  return txt;
}
function downloadNotepad() {
  let blob = new Blob([getNotepadText()], { type: 'text/plain' });
  let a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'VintageWaffle-Customers-' + new Date().toISOString().slice(0,10) + '.txt'; a.click();
  alert('Notepad Download Done');
}
function copyCustomers() { navigator.clipboard.writeText(getNotepadText()).then(() => alert('Copied! Paste in Notepad')); }
function clearCustomers() { if (!confirm('Clear all customers?')) return; customers = []; localStorage.setItem('pos_customers', '[]'); renderCustomers(); }
function save() { localStorage.setItem('pos_products', JSON.stringify(products)); localStorage.setItem('pos_sales', JSON.stringify(sales)); localStorage.setItem('pos_columns', JSON.stringify(columns)); }
function saveSettings() {
  settings = { shopName: document.getElementById('shopName').value, shopAddr: document.getElementById('shopAddr').value, shopPhone: document.getElementById('shopPhone').value, ownerPhone: document.getElementById('ownerPhone').value || '6303033677', ownerNotify: document.getElementById('ownerNotify').checked, custNotify: document.getElementById('custNotify').checked };
  localStorage.setItem('pos_settings', JSON.stringify(settings));
  document.getElementById('ownerDisplay').innerText = settings.ownerPhone;
  alert('Saved!');
}
function loadSettings() {
  if(!document.getElementById('shopName')) return;
  document.getElementById('shopName').value = settings.shopName;
  document.getElementById('shopAddr').value = settings.shopAddr;
  document.getElementById('shopPhone').value = settings.shopPhone;
  document.getElementById('ownerPhone').value = settings.ownerPhone;
  document.getElementById('ownerNotify').checked = settings.ownerNotify;
  document.getElementById('custNotify').checked = settings.custNotify;
  document.getElementById('ownerDisplay').innerText = settings.ownerPhone;
}
function showTab(id, btn) {
  document.querySelectorAll('[id^="tab-"]').forEach(e => e.classList.add('hidden'));
  let el = document.getElementById('tab-' + id);
  if(el) el.classList.remove('hidden');
  document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  if (id == 'report') showReport();
  if (id == 'menu') renderMenu();
  if (id == 'columns') renderColumns();
  if (id == 'customers') renderCustomers();
  if (id == 'messages') renderMsgHistory();
}
function filterVeg(v) { activeVeg = v; renderProducts(); }
function setCol(c) { activeCol = c; renderProducts(); }
function renderColTabs() {
  let el = document.getElementById('colTabs'); if(!el) return;
  let html = '<button class="' + (activeCol == 'All' ? 'active' : '') + '" onclick="setCol(\'All\')">All</button>';
  columns.filter(c => c != 'All').forEach(c => { html += `<button class="${activeCol == c ? 'active' : ''}" onclick="setCol('${c}')">${c}</button>`; });
  el.innerHTML = html;
}
function renderProducts() {
  renderColTabs(); let q = (document.getElementById('search')?.value || '').toLowerCase(); let html = '';
  products.filter(p => { if (activeCol != 'All' && p.cat != activeCol) return false; if (activeVeg != 'all' && p.veg != activeVeg) return false; if (q && !p.name.toLowerCase().includes(q) && !String(p.barcode).includes(q)) return false; return true; }).forEach(p => {
    let icon = '🥤 ';
    if (p.veg == 'veg') icon = '<span class="veg-dot"><i></i></span>';
    if (p.veg == 'nonveg') icon = '<span class="nonveg-dot"><i></i></span>';
    let vegTxt = p.veg == 'veg' ? 'VEG' : p.veg == 'nonveg' ? 'NON-VEG' : 'DRINK';
    let low = p.stock <= 5 ? ' 🔴 LOW!' : '';
    html += `<div class="prod"><div>${icon}<b>${p.name}</b> <small>${vegTxt} | ${p.cat}</small><br><small>₹${p.price} | Stock: ${p.stock}${low}</small></div><button class="btn-blue" onclick="addToCart(${p.id})">+ Add</button></div>`;
  });
  document.getElementById('productList').innerHTML = html || '<p style="padding:20px;text-align:center">No product in this column. Add in Menu Edit.</p>';
  let lowItems = products.filter(p => p.stock <= 5);
  document.getElementById('lowStockBox').innerHTML = lowItems.length ? `<div class="low-stock">⚠️ Low Stock Alert: ${lowItems.map(p=>p.name+' ('+p.stock+')').join(', ')} - Please Refill!</div>` : '';
  let today = new Date().toDateString(); let tSales = sales.filter(s => new Date(s.date).toDateString() == today);
  document.getElementById('statToday').innerText = '₹' + tSales.reduce((a,b)=>a+b.total,0).toFixed(0);
  document.getElementById('statBills').innerText = tSales.length;
  document.getElementById('statCust').innerText = customers.length;
}
function renderColumns() {
  let html = ''; columns.forEach((c, i) => { html += `<div class="prod"><div><b>${c}</b><br><small>${products.filter(p => p.cat == c).length} items</small></div>${c == 'All' ? '<small>Default</small>' : `<div style="display:flex;gap:5px"><button class="btn-orange" onclick="editColumn(${i})">✏️ Edit</button><button class="btn-red" onclick="deleteColumn(${i})">🗑️</button></div>`}</div>`; });
  document.getElementById('colList').innerHTML = html;
  document.getElementById('pCategory').innerHTML = columns.filter(c => c != 'All').map(c => `<option>${c}</option>`).join('');
}
function addColumn() { let n = document.getElementById('newColName').value.trim(); if (!n) return alert('Enter Column name'); columns.push(n); save(); document.getElementById('newColName').value = ''; renderColumns(); renderProducts(); alert('Column Added'); }
function editColumn(i) { let nn = prompt('Change Column:', columns[i]); if (nn) { let old = columns[i]; columns[i] = nn.trim(); products.forEach(p => { if (p.cat == old) p.cat = nn.trim(); }); save(); renderColumns(); renderProducts(); } }
function deleteColumn(i) { if (!confirm('Delete?')) return; let old = columns[i]; columns.splice(i, 1); products.forEach(p => { if (p.cat == old) p.cat = 'All'; }); save(); renderColumns(); renderProducts(); }
function renderMenu() {
  let html = ''; products.forEach(p => { let ic = p.veg == 'veg' ? '🟢' : p.veg == 'nonveg' ? '🔴' : '🥤'; html += `<div class="prod"><div>${ic} <b>${p.name}</b><br><small>${p.cat} | ₹${p.price} | Stock: ${p.stock}</small></div><div style="display:flex;gap:5px"><button class="btn-orange" onclick="editProduct(${p.id})">✏️ Edit</button><button class="btn-red" onclick="deleteProduct(${p.id})">🗑️</button></div></div>`; });
  document.getElementById('menuList').innerHTML = html;
  document.getElementById('menuCount').innerText = products.length;
  renderColumns();
}
function saveProduct() {
  let name = document.getElementById('pName').value.trim(); let price = +document.getElementById('pPrice').value; let stock = +document.getElementById('pStock').value || 0; let barcode = document.getElementById('pBarcode').value || Date.now(); let cat = document.getElementById('pCategory').value || 'All'; let veg = document.querySelector('input[name="pVeg"]:checked').value; let gst = +document.getElementById('pGst').value || 0; let editId = document.getElementById('editId').value;
  if (!name || !price) return alert('Name & Price required!');
  if (editId) { let p = products.find(x => x.id == editId); if (p) { p.name = name; p.price = price; p.stock = stock; p.barcode = barcode; p.cat = cat; p.veg = veg; p.gst = gst; } alert('Updated!'); } else { products.push({ id: Date.now(), name, price, stock, barcode, cat, veg, gst }); alert('Added!'); }
  save(); cancelEdit(); renderProducts(); renderMenu();
}
function editProduct(id) {
  let p = products.find(x => x.id == id);
  document.getElementById('pName').value = p.name; document.getElementById('pPrice').value = p.price; document.getElementById('pStock').value = p.stock; document.getElementById('pBarcode').value = p.barcode; document.getElementById('pCategory').value = p.cat;
  document.querySelector(`input[name="pVeg"][value="${p.veg}"]`).checked = true;
  document.getElementById('pGst').value = p.gst; document.getElementById('editId').value = p.id; document.getElementById('editingName').innerText = p.name; document.getElementById('editInfo').classList.remove('hidden'); document.getElementById('saveBtn').innerText = 'Update'; document.getElementById('cancelBtn').style.display = 'block';
  showTab('menu', document.querySelectorAll('.tabs button')[1]);
  window.scrollTo(0,0);
}
function cancelEdit() { document.getElementById('pName').value = ''; document.getElementById('pPrice').value = ''; document.getElementById('pStock').value = ''; document.getElementById('pBarcode').value = ''; document.getElementById('pGst').value = '5'; document.getElementById('editId').value = ''; document.getElementById('editInfo').classList.add('hidden'); document.getElementById('saveBtn').innerText = 'Save Product'; document.getElementById('cancelBtn').style.display = 'none'; }
function deleteProduct(id) { if (!confirm('Delete?')) return; products = products.filter(x => x.id != id); save(); renderProducts(); renderMenu(); }
function addToCart(id) { let p = products.find(x => x.id == id); if (!p || p.stock <= 0) return alert('Out of Stock!'); let c = cart.find(x => x.id == id); if (c) c.qty++; else cart.push({ id: p.id, name: p.name, price: p.price, qty: 1, veg: p.veg }); renderCart(); }
function renderCart() { let h = ''; let sub = 0; cart.forEach((c, i) => { let amt = c.price * c.qty; sub += amt; let ic = c.veg == 'veg' ? '🟢' : c.veg == 'nonveg' ? '🔴' : '🥤'; h += `<tr><td>${ic} ${c.name}<br>₹${c.price}</td><td><button onclick="changeQty(${i},-1)">-</button> ${c.qty} <button onclick="changeQty(${i},1)">+</button></td><td>₹${amt}</td><td><button onclick="removeItem(${i})">✕</button></td></tr>`; }); document.getElementById('cart').innerHTML = h; let discP = +document.getElementById('discount').value; let disc = sub * discP / 100; let after = sub - disc; let gstP = parseInt(document.getElementById('gstMode').value); let gst = after * gstP / 100; document.getElementById('sub').innerText = '₹' + sub; document.getElementById('discAmt').innerText = '-₹' + disc.toFixed(2); document.getElementById('gstAmt').innerText = '₹' + gst.toFixed(2); document.getElementById('grand').innerText = '₹' + (after + gst).toFixed(2); updateToday(); }
function changeQty(i, d) { cart[i].qty += d; if (cart[i].qty <= 0) cart.splice(i, 1); renderCart(); }
function removeItem(i) { cart.splice(i, 1); renderCart(); }
function newBill() { cart = []; renderCart(); document.getElementById('custName').value = ''; document.getElementById('custPhone').value = ''; }
async function connectUSB() { try { await navigator.usb.requestDevice({ filters: [] }); document.getElementById('usbStatus').innerText = '● USB Connected'; } catch (e) { document.getElementById('usbStatus').innerText = '● Using Windows Default Printer'; } }
async function connectBT() { try { let d = await navigator.bluetooth.requestDevice({ acceptAllDevices: true }); document.getElementById('btStatus').innerText = '● Bluetooth: ' + d.name; } catch (e) { alert('Bluetooth connect failed'); } }
function buildBillHTML(cust, cart, sub, disc, gst, gstP, total, pay, orderType, billNo) { let items = cart.map(c => `${c.veg == 'veg' ? '[VEG]' : c.veg == 'nonveg' ? '[NON-VEG]' : ''} ${c.name} x ${c.qty} = ₹${c.price * c.qty}<br>`).join(''); return `<div style="padding:8px;text-align:center"><h2>${settings.shopName}</h2><p>${settings.shopAddr}<br>${settings.shopPhone}</p><hr><p style="text-align:left">Customer: ${cust}<br>Order: ${orderType}<br>Date: ${new Date().toLocaleString()}<br>Pay: ${pay}<br>Bill No: ${billNo}</p><hr><div style="text-align:left">${items}</div><hr><p style="text-align:left">Subtotal: ₹${sub}<br>Discount: -₹${disc.toFixed(2)}<br>GST: ₹${gst.toFixed(2)}</p><h3>Total: ₹${total.toFixed(2)}</h3><hr><p>Thank You!</p></div>`; }
function testPrint() { let html = buildBillHTML('Test', [{ name: 'Chicken Biryani', qty: 1, price: 180, veg: 'nonveg' }], 180, 0, 9, 5, 189, 'Cash', 'Dine-In', 'TEST'); doPrint(html); }
function doPrint(html) { document.getElementById('billPrint').innerHTML = html; window.print(); }
function getTotals() { let sub = cart.reduce((s, c) => s + c.price * c.qty, 0); let discP = +document.getElementById('discount').value; let disc = sub * discP / 100; let after = sub - disc; let gstP = parseInt(document.getElementById('gstMode').value); let gst = after * gstP / 100; let total = after + gst; return { sub, disc, gst, gstP, total }; }
function getBillText() {
  if (cart.length == 0) return null; let t = getTotals(); let cust = document.getElementById('custName').value || 'Customer'; let pay = document.getElementById('payMode').value; let orderType = document.getElementById('orderType').value; let billNo = Date.now().toString().slice(-6);
  let msg = `🧾 *${settings.shopName}*\n${settings.shopAddr}\n${settings.shopPhone}\n----------------------\n👤 Customer: ${cust}\n🧾 Bill No: ${billNo}\n📦 Order: ${orderType}\n📅 ${new Date().toLocaleString()}\n💳 Payment: ${pay}\n----------------------\n`;
  cart.forEach(c => { let ic = c.veg == 'veg' ? '🟢' : c.veg == 'nonveg' ? '🔴' : '🥤'; msg += `${ic} ${c.name} x ${c.qty} = ₹${c.price * c.qty}\n`; });
  msg += `----------------------\nSubtotal: ₹${t.sub}\nDiscount: -₹${t.disc.toFixed(2)}\nGST (${t.gstP}%): ₹${t.gst.toFixed(2)}\n*Total: ₹${t.total.toFixed(2)}*\n----------------------\nThank You Visit Again! 🙏`;
  return { msg, ...t, cust, pay, orderType, billNo };
}
function sendBillWhatsApp() { let data = getBillText(); if (!data) return alert('Cart empty!'); let phone = document.getElementById('custPhone').value.trim(); if (!phone || phone.length != 10) return alert('Customer Phone 10 digits required'); sendDirect(phone, data.msg); }
function sendOwnerOnly() { let data = getBillText(); if (!data) return alert('Cart empty!'); let ownerPhone = settings.ownerPhone || '6303033677'; let itemsTxt = cart.map(c => `${c.name} x${c.qty}`).join(', '); let omsg = `🔔 *NEW BILL - ${settings.shopName}*\nBill No: ${data.billNo}\nCustomer: ${data.cust}\nItems: ${itemsTxt}\n*Total: ₹${data.total.toFixed(2)}* - ${data.pay}`; sendDirect(ownerPhone, omsg); }
function copyBill() { let d = getBillText(); if (!d) return alert('Cart empty!'); navigator.clipboard.writeText(d.msg).then(() => alert('Copied!')); }
function testOwnerMsg() { sendDirect(settings.ownerPhone, '🔔 TEST - Direct SMS working - ' + settings.shopName); }
function saveSale(data, phone) { cart.forEach(c => { let p = products.find(x => x.id == c.id); if (p) p.stock -= c.qty; }); sales.push({ date: new Date().toLocaleString(), cust: data.cust, total: data.total, mode: data.pay, items: cart.length, phone: phone || '', billNo: data.billNo }); save(); cart = []; renderCart(); renderProducts(); renderMenu(); }
async function checkout() {
  if (cart.length == 0) return alert('Cart empty!');
  let data = getBillText(); let custPhone = document.getElementById('custPhone').value.trim(); let cartCopy = [...cart]; let custMsg = data.msg; let ownerPhone = settings.ownerPhone || '6303033677';
  let itemsTxt = cartCopy.map(c => `${c.name} x${c.qty}`).join(', ');
  let ownerMsg = `🔔 *NEW BILL - ${settings.shopName}*\nBill No: ${data.billNo}\nCustomer: ${data.cust} ${custPhone ? '- ' + custPhone : ''}\nItems: ${itemsTxt}\n*Total: ₹${data.total.toFixed(2)}*\nPayment: ${data.pay}`;
  saveCustomerToNotepad(data.cust, custPhone, data.total.toFixed(2), data.billNo);
  saveSale(data, custPhone);
  let html = buildBillHTML(data.cust, cartCopy, data.sub, data.disc, data.gst, data.gstP, data.total, data.pay, data.orderType, data.billNo);
  doPrint(html);
  if (settings.custNotify && custPhone && custPhone.length == 10) { await sendDirect(custPhone, custMsg); }
  if (settings.ownerNotify) { setTimeout(async () => { await sendDirect(ownerPhone, ownerMsg); }, 1500); }
  document.getElementById('custName').value = ''; document.getElementById('custPhone').value = '';
  alert('Bill Done! Customer saved to Notepad');
}
function updateToday() { let today = new Date().toDateString(); let sum = sales.filter(s => new Date(s.date).toDateString() == today).reduce((a, b) => a + b.total, 0); let el=document.getElementById('todaySales'); if(el) el.innerText = 'Today: ₹' + sum.toFixed(0); }
function showReport() { let today = new Date().toDateString(); let t = sales.filter(s => new Date(s.date).toDateString() == today); let sum = t.reduce((a, b) => a + b.total, 0); document.getElementById('reportText').innerHTML = `Today Bills: ${t.length}<br>Total Sales: ₹${sum}`; document.getElementById('salesList').innerHTML = t.map(s => `<div class="prod"><div><b>${s.cust} ${s.phone ? '- ' + s.phone : ''}</b><br><small>${s.date} | ${s.mode}</small></div><b>₹${s.total}</b></div>`).join(''); }
function deleteTodaySale() { if (!confirm('Delete Today Sale?')) return; let today = new Date().toDateString(); sales = sales.filter(s => new Date(s.date).toDateString() != today); save(); updateToday(); showReport(); alert('Today Sale Deleted'); }
function clearAllData() { if (!confirm('Clear All Data?')) return; localStorage.clear(); location.reload(); }
document.getElementById('gstMode')?.addEventListener('change', renderCart);
document.getElementById('discount')?.addEventListener('change', renderCart);
document.getElementById('custPhone')?.addEventListener('input', () => { document.getElementById('custDisplay').innerText = document.getElementById('custPhone').value || 'Enter Phone'; });
loadSettings(); renderProducts(); renderCart(); renderMenu(); renderColumns(); renderCustomers(); renderMsgHistory(); updateToday();
