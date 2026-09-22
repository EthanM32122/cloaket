const BLOOKS = CATALOG.blooks;
const PACKS = CATALOG.packs.filter(p => p.name !== 'Miscellaneous');
const RARITIES = CATALOG.rarities;
const blookByName = Object.fromEntries(BLOOKS.map(b => [b.name, b]));
const NAV = [['stats','📊','Stats'],['mine','⛏','Mine'],['market','🛒','Market'],['blooks','🎒','My Blooks'],['bazaar','🏛','Bazaar'],['craft','🔨','Craft'],['trade','⇄','Trade'],['clans','🚩','Clans'],['friends','👥','Friends'],['chat','💬','Chat'],['leaderboard','🏆','Leaderboard'],['gifts','🎁','Gifts'],['settings','⚙','Settings'],['admin','🛡','Admin']];
let rarityFilter = 'all';
let bazaarPackFilter = null;
let craftSlots = [];
let lbMode = 'xp';
function safeGet(k,f){try{return localStorage.getItem(k)||f}catch(e){return f}}
function safeSet(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}}
function getUsers(){try{return JSON.parse(safeGet('ck_users','{}'))}catch(e){return{}}}
function currentUser(){return safeGet('ck_current','')}
function defaultData(){return{tokens:CATALOG.startTokens||1500,exp:0,packsOpened:0,mined:0,messages:0,role:'player',inventory:{},friends:[],clan:'',lastMine:0,lastClaim:0,starter:false,miners:0}}
function getData(u){try{return Object.assign(defaultData(),JSON.parse(safeGet('ck_data_'+u,'{}')))}catch(e){return defaultData()}}
function saveData(u,d){safeSet('ck_data_'+u,JSON.stringify(d))}
function getGlobal(k,f){try{return JSON.parse(safeGet('ck_g_'+k,JSON.stringify(f)))}catch(e){return f}}
function setGlobal(k,v){safeSet('ck_g_'+k,JSON.stringify(v))}
function levelForExp(exp){return Math.floor(Math.sqrt(exp/100))+1}
function expForLevel(lv){return (lv-1)*(lv-1)*100}
function totalBlookTypes(){return BLOOKS.length}
function rollPack(packName,luckMultiplier=1){
  const pack = PACKS.find(p=>p.name===packName);
  if(!pack) return null;
  const entries = BLOOKS.filter(b=>b.pack===packName);
  if(!entries.length) return null;
  let weights = entries.map(b=>{let c=b.chance||1;if(luckMultiplier>1&&(b.rarity==='Legendary'||b.rarity==='Chroma'||b.rarity==='Mystical'))c*=luckMultiplier;return c});
  const total = weights.reduce((a,b)=>a+b,0);
  let r = Math.random()*total;
  for(let i=0;i<entries.length;i++){r-=weights[i];if(r<=0)return entries[i]}
  return entries[entries.length-1];
}
function openRegister(){closeModals();document.getElementById('regModal').classList.add('open');document.getElementById('regErr').textContent=''}
function openLogin(){closeModals();document.getElementById('loginModal').classList.add('open');document.getElementById('loginErr').textContent=''}
function closeModals(){document.querySelectorAll('.modal-bg').forEach(m=>m.classList.remove('open'))}
function closeOpen(){document.getElementById('openModal').classList.remove('open')}
function doRegister(){
  const u=(document.getElementById('regUser').value||'').trim();
  const p=document.getElementById('regPass').value||'';
  const p2=document.getElementById('regPass2').value||'';
  const err=document.getElementById('regErr');
  if(u.length<3||u.length>20){err.textContent='Username must be 3-20 characters';return}
  if(p.length<8){err.textContent='Password must be at least 8 characters';return}
  if(p!==p2){err.textContent='Passwords do not match';return}
  const users=getUsers();
  if(users[u]){err.textContent='Username taken';return}
  users[u]=p;safeSet('ck_users',JSON.stringify(users));
  const d=defaultData();
  if(Object.keys(users).length===1)d.role='owner';
  saveData(u,d);
  err.textContent='Account created! Sign in...';
  setTimeout(()=>{closeModals();openLogin();document.getElementById('loginUser').value=u},500);
}
function doLogin(){
  const u=(document.getElementById('loginUser').value||'').trim();
  const p=document.getElementById('loginPass').value||'';
  const err=document.getElementById('loginErr');
  const users=getUsers();
  if(!users[u]||users[u]!==p){err.textContent='Invalid username or password';return}
  safeSet('ck_current',u);afterLogin(u);
}
function afterLogin(u){
  closeModals();
  document.getElementById('landing').classList.add('hidden');
  document.getElementById('app').classList.add('active');
  buildNav();refreshUI();showPage('stats');
}
function logout(){safeSet('ck_current','');document.getElementById('app').classList.remove('active');document.getElementById('landing').classList.remove('hidden')}
function buildNav(){
  const nav=document.getElementById('nav');nav.innerHTML='';
  const role=getData(currentUser()).role;
  NAV.forEach(([page,ico,label])=>{
    if(page==='admin'&&!['mod','admin','coowner','owner'].includes(role))return;
    const b=document.createElement('button');
    b.className='nav-item';b.dataset.page=page;
    b.innerHTML='<span class="ico">'+ico+'</span>'+label;
    b.onclick=()=>showPage(page);
    nav.appendChild(b);
  });
}
function showPage(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-page]').forEach(n=>n.classList.remove('active'));
  const panel=document.getElementById('page-'+page);
  if(panel)panel.classList.add('active');
  const nav=document.querySelector('.nav-item[data-page="'+page+'"]');
  if(nav)nav.classList.add('active');
  refreshUI();
}
function refreshUI(){
  try{refreshMine()}catch(e){}
  const u=currentUser();if(!u)return;
  const d=getData(u);
  document.getElementById('chipUser').textContent=u;
  document.getElementById('chipTokens').textContent=d.tokens.toLocaleString();
  document.getElementById('statName').textContent=u;
  const lv=levelForExp(d.exp);
  document.getElementById('statLevel').textContent=lv;
  document.getElementById('statXpLabel').textContent=d.exp.toLocaleString()+' XP';
  const cur=expForLevel(lv), next=expForLevel(lv+1);
  const pct=Math.min(100,((d.exp-cur)/Math.max(1,next-cur))*100);
  document.getElementById('xpFill').style.width=pct+'%';
  const unique=Object.keys(d.inventory).filter(k=>d.inventory[k]>0).length;
  document.getElementById('sTokens').textContent=d.tokens.toLocaleString();
  document.getElementById('sBlooks').textContent=unique+' / '+totalBlookTypes();
  document.getElementById('sOpened').textContent=d.packsOpened||0;
  document.getElementById('sMessages').textContent=d.messages||0;
  renderMarket();renderBlooks();renderBazaar();renderCraft();renderTrade();renderClans();renderFriends();renderChat();renderLB();renderGifts();fillSelects();
}
function renderMarket(){
  const g=document.getElementById('marketGrid');if(!g)return;g.innerHTML='';
  PACKS.forEach(p=>{
    const el=document.createElement('div');
    el.className='pack-card';
    el.style.background='linear-gradient(160deg,'+p.color1+','+p.color2+')';
    el.innerHTML='<img src="'+p.img+'" alt="'+p.name+'" loading="lazy" onerror="this.style.opacity=.3"><div class="pname">'+p.name+'</div><div class="pprice">'+p.price+' tokens</div><div class="open-btn">Open</div>';
    el.onclick=()=>openPack(p.name);
    g.appendChild(el);
  });
}
function openPack(name){
  const u=currentUser();const d=getData(u);
  const pack=PACKS.find(p=>p.name===name);if(!pack)return;
  if(d.tokens<pack.price){alert('Not enough tokens');return}
  d.tokens-=pack.price;d.packsOpened=(d.packsOpened||0)+1;
  const blook=rollPack(name,d.starter?1.5:1);
  if(!blook){alert('Pack error');return}
  d.inventory[blook.name]=(d.inventory[blook.name]||0)+1;
  d.exp+=(RARITIES[blook.rarity]?.exp||0);
  saveData(u,d);
  document.getElementById('openImg').src=blook.img;
  document.getElementById('openName').textContent=blook.name;
  const col=RARITIES[blook.rarity]?.color||'#fff';
  document.getElementById('openRarity').innerHTML='<span style="color:'+col+'">'+blook.rarity+' · '+(blook.chance||'?')+'%</span>';
  document.getElementById('openModal').classList.add('open');
  refreshUI();
}
function renderBlooks(){
  const bar=document.getElementById('rarityBar');
  if(bar&&!bar.dataset.ready){
    bar.innerHTML='';
    ['all',...Object.keys(RARITIES)].forEach(r=>{
      const b=document.createElement('button');
      b.textContent=r==='all'?'All':r;
      b.className=rarityFilter===r?'active':'';
      b.onclick=()=>{rarityFilter=r;bar.dataset.ready='';renderBlooks()};
      bar.appendChild(b);
    });
    bar.dataset.ready='1';
  }
  const root=document.getElementById('blooksByPack');if(!root)return;root.innerHTML='';
  const d=getData(currentUser());
  PACKS.forEach(pack=>{
    let blooks=BLOOKS.filter(b=>b.pack===pack.name);
    if(rarityFilter!=='all')blooks=blooks.filter(b=>b.rarity===rarityFilter);
    if(!blooks.length)return;
    const sec=document.createElement('div');sec.className='pack-section';
    sec.innerHTML='<h3>'+pack.name+' Pack</h3>';
    const grid=document.createElement('div');grid.className='blook-grid';
    blooks.forEach(b=>{
      const qty=d.inventory[b.name]||0;
      const slot=document.createElement('div');
      slot.className='blook-slot '+(qty>0?'owned':'locked');
      slot.title=b.name+(qty?' ×'+qty:'');
      if(qty>0){slot.innerHTML='<img src="'+b.img+'" alt="'+b.name+'" loading="lazy" onerror="this.remove()"><span class="qty">'+qty+'</span>';}
      grid.appendChild(slot);
    });
    sec.appendChild(grid);root.appendChild(sec);
  });
}
function renderBazaar(){
  const filters=document.getElementById('bazaarFilters');
  if(filters){
    filters.innerHTML='';
    PACKS.forEach(p=>{
      const img=document.createElement('img');
      img.src=p.img;img.alt=p.name;img.title=p.name;
      if(bazaarPackFilter===p.name)img.classList.add('active');
      img.onerror=()=>{img.style.background=p.color1};
      img.onclick=()=>{bazaarPackFilter=bazaarPackFilter===p.name?null:p.name;renderBazaar()};
      filters.appendChild(img);
    });
  }
  const q=(document.getElementById('bazaarSearch')?.value||'').toLowerCase();
  let listings=getGlobal('listings',[]);
  if(bazaarPackFilter)listings=listings.filter(l=>{const b=blookByName[l.blook];return b&&b.pack===bazaarPackFilter});
  if(q)listings=listings.filter(l=>l.blook.toLowerCase().includes(q)||l.seller.toLowerCase().includes(q));
  const count=document.getElementById('bazaarCount');
  if(count)count.textContent='Results: '+listings.length;
  const list=document.getElementById('bazaarList');if(!list)return;
  if(!listings.length){list.innerHTML='<div class="empty"><div class="big">🏛</div><strong>No listings found</strong><br>Try adjusting your filters.</div>';return}
  list.innerHTML='';
  listings.forEach((l,i)=>{
    const b=blookByName[l.blook];
    const row=document.createElement('div');
    row.className='lb-row';
    row.innerHTML='<img src="'+(b?b.img:'')+'" style="width:40px;height:40px;object-fit:contain" onerror="this.style.display=\'none\'"><div style="flex:1"><b>'+l.blook+'</b><div class="muted" style="font-size:12px">'+l.seller+' · '+l.price+' tokens</div></div><button class="btn btn-primary btn-sm">Buy</button>';
    row.querySelector('button').onclick=()=>buyListing(i,l);
    list.appendChild(row);
  });
}
function createListing(){
  const u=currentUser();const d=getData(u);
  const name=document.getElementById('listBlook').value;
  const price=parseInt(document.getElementById('listPrice').value,10);
  if(!name||!price||price<1){alert('Pick a blook and price');return}
  if((d.inventory[name]||0)<1){alert('You do not own that');return}
  d.inventory[name]--;saveData(u,d);
  const listings=getGlobal('listings',[]);
  listings.push({blook:name,price,seller:u,ts:Date.now()});
  setGlobal('listings',listings);refreshUI();
}
function buyListing(i,l){
  const u=currentUser();if(l.seller===u){alert('That is your listing');return}
  const d=getData(u);if(d.tokens<l.price){alert('Not enough tokens');return}
  let listings=getGlobal('listings',[]);
  const idx=listings.findIndex(x=>x.ts===l.ts&&x.seller===l.seller&&x.blook===l.blook);
  if(idx<0){alert('Gone');return}
  listings.splice(idx,1);setGlobal('listings',listings);
  d.tokens-=l.price;d.inventory[l.blook]=(d.inventory[l.blook]||0)+1;saveData(u,d);
  const sd=getData(l.seller);sd.tokens+=l.price;saveData(l.seller,sd);
  refreshUI();
}
function showMyListings(){bazaarPackFilter=null;const u=currentUser();document.getElementById('bazaarSearch').value=u;renderBazaar()}
function renderCraft(){
  const slots=document.getElementById('craftSlots');if(!slots)return;
  slots.innerHTML='';
  for(let i=0;i<5;i++){
    const s=document.createElement('div');
    s.className='slot-plus'+(craftSlots[i]?' filled':'');
    if(craftSlots[i]){
      const b=blookByName[craftSlots[i]];
      s.innerHTML=b?'<img src="'+b.img+'">':'×';
      s.onclick=()=>{craftSlots.splice(i,1);renderCraft()};
    } else s.textContent='+';
    slots.appendChild(s);
  }
  document.getElementById('craftCount').textContent=craftSlots.length;
  const res=document.getElementById('craftResults');
  if(craftSlots.length>=2){
    res.innerHTML='<p class="muted">Possible results from this combo (simulated):</p>';
    const pack=blookByName[craftSlots[0]]?.pack;
    const pool=BLOOKS.filter(b=>b.pack===pack).slice(0,5);
    pool.forEach(b=>{res.innerHTML+='<div style="display:flex;align-items:center;gap:8px;margin:6px 0"><img src="'+b.img+'" style="width:32px;height:32px" onerror="this.remove()"><span>'+b.name+'</span> <span class="muted">'+b.rarity+'</span></div>'});
  } else res.innerHTML='<div class="big">🔨</div>Add 2–5 blooks to craft.';
  renderCraftInv();
}
function renderCraftInv(){
  const inv=document.getElementById('craftInv');if(!inv)return;inv.innerHTML='';
  const q=(document.getElementById('craftSearch')?.value||'').toLowerCase();
  const d=getData(currentUser());
  Object.entries(d.inventory).forEach(([name,qty])=>{
    if(qty<1)return;if(q&&!name.toLowerCase().includes(q))return;
    const b=blookByName[name];if(!b)return;
    const slot=document.createElement('div');slot.className='blook-slot owned';
    slot.innerHTML='<img src="'+b.img+'" onerror="this.remove()"><span class="qty">'+qty+'</span>';
    slot.onclick=()=>{if(craftSlots.length>=5)return;craftSlots.push(name);renderCraft()};
    inv.appendChild(slot);
  });
}
function doCraft(){
  if(craftSlots.length<2){alert('Add at least 2 blooks');return}
  const u=currentUser();const d=getData(u);
  if(d.tokens<50){alert('Need 50 tokens');return}
  for(const name of craftSlots){
    if((d.inventory[name]||0)<1){alert('Missing '+name);return}
    d.inventory[name]--;
  }
  d.tokens-=50;
  const pack=blookByName[craftSlots[0]]?.pack;
  const result=rollPack(pack,d.starter?2.5:1)||BLOOKS[0];
  d.inventory[result.name]=(d.inventory[result.name]||0)+1;
  d.exp+=(RARITIES[result.rarity]?.exp||0);
  saveData(u,d);craftSlots=[];
  document.getElementById('openImg').src=result.img;
  document.getElementById('openName').textContent=result.name;
  document.getElementById('openRarity').innerHTML='Crafted · '+result.rarity;
  document.getElementById('openModal').classList.add('open');
  refreshUI();
}
function doMine(){
  const u=currentUser();const d=getData(u);
  const now=Date.now();
  if(now-(d.lastMine||0)<3000){
    var left=Math.ceil((3000-(now-d.lastMine))/1000);
    var st=document.getElementById('mineStatus');
    if(st)st.textContent='Mine sealed · wait '+left+'s';
    return;
  }
  var base=25+Math.floor(Math.random()*56);
  var bonus=(d.miners||0)*5;
  var gained=base+bonus;
  d.tokens+=gained;d.mined=(d.mined||0)+gained;d.lastMine=now;d.exp+=(5+Math.floor(Math.random()*10));
  saveData(u,d);
  var hop=document.getElementById('mineHopper');if(hop)hop.textContent=(d.mined||0).toLocaleString();
  var tot=document.getElementById('mineTotal');if(tot)tot.textContent=(d.mined||0).toLocaleString();
  var res=document.getElementById('mineResult');if(res)res.textContent='+'+gained+' tokens!';
  var st=document.getElementById('mineStatus');if(st)st.textContent='Heading down the shaft...';
  setTimeout(function(){var s=document.getElementById('mineStatus');if(s)s.textContent='Click to dig · cooldown applies'},800);
  refreshUI();
}
function hireMiner(){
  var u=currentUser();var d=getData(u);
  if(d.tokens<500){alert('Need 500 tokens');return}
  d.tokens-=500;d.miners=(d.miners||0)+1;saveData(u,d);refreshMine();refreshUI();
}
function refreshMine(){
  var d=getData(currentUser());
  var hop=document.getElementById('mineHopper');if(hop)hop.textContent=(d.mined||0).toLocaleString();
  var tot=document.getElementById('mineTotal');if(tot)tot.textContent=(d.mined||0).toLocaleString();
  var rate=document.getElementById('mineRate');if(rate)rate.textContent='+'+(25+(d.miners||0)*5)+'–'+(80+(d.miners||0)*5);
  var crew=document.getElementById('mineCrew');
  if(crew){if(d.miners)crew.innerHTML='<b style="color:#fff">'+d.miners+'</b> miner(s) · +'+(d.miners*5)+' / dig';else crew.textContent='No hired miners yet. Dig or hire to boost.';}
}
function claimDaily(){
  const u=currentUser();const d=getData(u);
  const day=new Date().toDateString();
  if(d.lastClaim===day){alert('Already claimed today');return}
  d.tokens+=(CATALOG.claimAmount||4000);d.lastClaim=day;saveData(u,d);refreshUI();alert('Claimed '+(CATALOG.claimAmount||4000)+' tokens!');
}
function renderTrade(){
  const list=document.getElementById('tradeList');if(!list)return;
  const trades=getGlobal('trades',[]).filter(t=>t.to===currentUser()||t.from===currentUser());
  if(!trades.length){list.innerHTML='<p class="muted">No active trade requests.</p>';return}
  list.innerHTML='';
  trades.forEach(t=>{
    const row=document.createElement('div');row.className='lb-row';
    row.innerHTML='<div style="flex:1">'+t.from+' → '+t.to+' <span class="muted">'+t.status+'</span></div>';
    list.appendChild(row);
  });
}
function sendTradeRequest(){
  const to=(document.getElementById('tradeUser').value||'').trim();
  if(!to||to===currentUser()){alert('Enter another username');return}
  if(!getUsers()[to]){alert('User not found');return}
  const trades=getGlobal('trades',[]);
  trades.push({from:currentUser(),to,status:'pending',ts:Date.now()});
  setGlobal('trades',trades);alert('Request sent');renderTrade();
}
function renderClans(){
  const list=document.getElementById('clanList');if(!list)return;
  const q=(document.getElementById('clanSearch')&&document.getElementById('clanSearch').value||'').toLowerCase();
  let clans=getGlobal('clans',[]);
  if(q)clans=clans.filter(c=>c.name.toLowerCase().includes(q)||(c.owner||'').toLowerCase().includes(q));
  const d=getData(currentUser());
  const myPanel=document.getElementById('myClanPanel');
  if(myPanel){
    if(d.clan){
      const mine=clans.find(c=>c.name===d.clan);
      myPanel.innerHTML='<div class="card" style="border-color:rgba(139,92,246,.4);margin-bottom:12px"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:12px;font-weight:800;color:hsl(var(--muted));letter-spacing:.1em">YOUR CLAN</div><h2 style="font-size:22px;margin:4px 0">'+d.clan+'</h2><div class="muted" style="font-size:13px">'+(mine?(mine.members||[]).length:1)+' members · Owner '+(mine?mine.owner:'?')+'</div></div><button class="btn btn-ghost btn-sm" onclick="leaveClan()">Leave Clan</button></div></div>';
    } else myPanel.innerHTML='';
  }
  if(!clans.length){list.innerHTML='<div class="empty"><div class="big">🚩</div><strong>No clans yet</strong><div class="muted">Create one to get started</div></div>';return}
  list.innerHTML='';
  clans.forEach(c=>{
    const row=document.createElement('div');row.className='card';row.style.marginBottom='10px';row.style.display='flex';row.style.alignItems='center';row.style.gap='14px';
    const members=(c.members||[]).length;
    row.innerHTML='<div style="width:48px;height:48px;border-radius:14px;background:rgba(139,92,246,.2);display:grid;place-items:center;font-size:22px">🚩</div><div style="flex:1"><b style="font-size:17px">'+c.name+'</b><div class="muted" style="font-size:12px">Owner '+c.owner+' · '+members+' members</div></div>';
    const btn=document.createElement('button');btn.className='btn btn-primary btn-sm';
    if(d.clan===c.name){btn.textContent='Joined';btn.disabled=true;btn.style.opacity='.6'}
    else{btn.textContent='Join';btn.onclick=function(){d.clan=c.name;saveData(currentUser(),d);c.members=c.members||[];if(!c.members.includes(currentUser()))c.members.push(currentUser());var all=getGlobal('clans',[]).map(function(x){return x.name===c.name?c:x});setGlobal('clans',all);refreshUI()}}
    row.appendChild(btn);list.appendChild(row);
  });
}
function leaveClan(){
  var u=currentUser();var d=getData(u);var name=d.clan;if(!name)return;
  d.clan='';saveData(u,d);
  var all=getGlobal('clans',[]).map(function(c){if(c.name===name)c.members=(c.members||[]).filter(function(m){return m!==u});return c});
  setGlobal('clans',all);refreshUI();
}
function createClan(){
  const name=prompt('Clan name?');if(!name)return;
  const clans=getGlobal('clans',[]);
  if(clans.some(c=>c.name===name)){alert('Name taken');return}
  clans.push({name,owner:currentUser(),members:[currentUser()]});
  setGlobal('clans',clans);
  const d=getData(currentUser());d.clan=name;saveData(currentUser(),d);refreshUI();
}
function renderFriends(){
  const d=getData(currentUser());
  const el=document.getElementById('friendList');
  const cnt=document.getElementById('friendCount');
  if(cnt)cnt.textContent=(d.friends||[]).length;
  if(!el)return;
  if(!(d.friends||[]).length){el.innerHTML='<p class="muted">No friends yet. Add someone above.</p>';return}
  el.innerHTML='';
  d.friends.forEach(f=>{
    const row=document.createElement('div');row.className='lb-row';
    row.innerHTML='<div style="flex:1">'+f+'</div><button class="btn btn-ghost btn-sm">Remove</button>';
    row.querySelector('button').onclick=()=>{d.friends=d.friends.filter(x=>x!==f);saveData(currentUser(),d);refreshUI()};
    el.appendChild(row);
  });
}
function addFriend(){
  const name=(document.getElementById('friendUser').value||'').trim();
  if(!name||name===currentUser()){alert('Enter a username');return}
  if(!getUsers()[name]){alert('User not found');return}
  const d=getData(currentUser());
  d.friends=d.friends||[];
  if(d.friends.includes(name)){alert('Already friends');return}
  d.friends.push(name);saveData(currentUser(),d);refreshUI();
}
function renderChat(){
  const box=document.getElementById('chatMsgs');if(!box)return;
  const msgs=getGlobal('chat',[]).slice(-100);
  box.innerHTML='';
  msgs.forEach(m=>{
    const row=document.createElement('div');row.className='chat-msg';
    row.innerHTML='<span class="who">'+m.user+'</span><span class="txt">'+m.text+'</span>';
    box.appendChild(row);
  });
  box.scrollTop=box.scrollHeight;
  const on=document.getElementById('chatOnline');if(on)on.textContent=Object.keys(getUsers()).length;
}
function sendChat(){
  const input=document.getElementById('chatInput');
  const text=(input.value||'').trim();if(!text)return;
  const msgs=getGlobal('chat',[]);
  msgs.push({user:currentUser(),text,ts:Date.now()});
  setGlobal('chat',msgs.slice(-200));
  const d=getData(currentUser());d.messages=(d.messages||0)+1;saveData(currentUser(),d);
  input.value='';renderChat();refreshUI();
}
function setLbMode(mode){
  lbMode=mode;
  const xp=document.getElementById('lbXp');const mn=document.getElementById('lbMine');
  if(xp)xp.classList.toggle('active',mode==='xp');
  if(mn)mn.classList.toggle('active',mode==='mine');
  renderLB();
}
function renderLB(){
  const list=document.getElementById('lbList');if(!list)return;
  const users=getUsers();
  let rows=[];
  Object.keys(users).forEach(u=>{const d=getData(u);rows.push({user:u,exp:d.exp||0,mined:d.mined||0,level:levelForExp(d.exp||0)})});
  if(lbMode==='mine') rows.sort((a,b)=>b.mined-a.mined);else rows.sort((a,b)=>b.exp-a.exp);
  if(!rows.length){list.innerHTML='<div class="empty"><div class="big">🏆</div><strong>No players yet</strong></div>';return}
  list.innerHTML='';
  const me=currentUser();
  rows.slice(0,50).forEach((r,i)=>{
    const row=document.createElement('div');row.className='lb-row';
    if(r.user===me)row.style.borderColor='rgba(139,92,246,.5)';
    const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':String(i+1);
    const val=lbMode==='mine'?(r.mined.toLocaleString()+' dug'):(r.exp.toLocaleString()+' XP · Lv '+r.level);
    row.innerHTML='<div class="rank">'+medal+'</div><div style="flex:1;font-weight:800">'+r.user+(r.user===me?' <span class="muted">(You)</span>':'')+'</div><div style="font-weight:800;color:var(--gold)">'+val+'</div>';
    list.appendChild(row);
  });
}
function renderGifts(){
  const sel=document.getElementById('giftBlook');if(!sel)return;
  const d=getData(currentUser());
  sel.innerHTML='';
  Object.entries(d.inventory).forEach(([name,qty])=>{
    if(qty<1)return;
    const o=document.createElement('option');o.value=name;o.textContent=name+' ×'+qty;sel.appendChild(o);
  });
  const list=document.getElementById('giftList');
  const gifts=getGlobal('gifts_'+currentUser(),[]);
  if(list){
    if(!gifts.length)list.innerHTML='No gifts received yet.';
    else list.innerHTML=gifts.map(g=>'<div class="lb-row"><div style="flex:1">'+g.from+' sent <b>'+g.blook+'</b></div></div>').join('');
  }
}
function sendGift(){
  const name=document.getElementById('giftBlook').value;
  const to=(document.getElementById('giftUser').value||'').trim();
  if(!name||!to){alert('Pick blook and user');return}
  if(!getUsers()[to]){alert('User not found');return}
  const d=getData(currentUser());
  if((d.inventory[name]||0)<1){alert('You do not own that');return}
  d.inventory[name]--;saveData(currentUser(),d);
  const td=getData(to);td.inventory[name]=(td.inventory[name]||0)+1;saveData(to,td);
  const gifts=getGlobal('gifts_'+to,[]);gifts.push({from:currentUser(),blook:name,ts:Date.now()});setGlobal('gifts_'+to,gifts);
  alert('Gift sent!');refreshUI();
}
function fillSelects(){
  const d=getData(currentUser());
  ['listBlook','giftBlook'].forEach(id=>{
    const sel=document.getElementById(id);if(!sel)return;
    const cur=sel.value;sel.innerHTML='';
    Object.entries(d.inventory).forEach(([name,qty])=>{
      if(qty<1)return;
      const o=document.createElement('option');o.value=name;o.textContent=name+' ×'+qty;sel.appendChild(o);
    });
    if(cur)sel.value=cur;
  });
}
function buyStarter(){
  const u=currentUser();const d=getData(u);
  if(d.starter){alert('Already owned');return}
  d.starter=true;d.tokens+=(CATALOG.startTokens||1500)+75000;saveData(u,d);alert('Starter unlocked (demo)');refreshUI();
}
function adminGive(){
  const who=(document.getElementById('admUser').value||'').trim();
  const amt=parseInt(document.getElementById('admAmt').value,10)||0;
  if(!getUsers()[who]){alert('User not found');return}
  const d=getData(who);d.tokens+=amt;saveData(who,d);alert('Gave '+amt+' to '+who);refreshUI();
}
function adminRole(){
  const who=(document.getElementById('admUser').value||'').trim();
  const role=document.getElementById('admRole').value;
  if(!getUsers()[who]){alert('User not found');return}
  const d=getData(who);d.role=role;saveData(who,d);alert('Role set');refreshUI();
}
function changeUsername(){
  const neu=(document.getElementById('setUser').value||'').trim();
  if(neu.length<3){alert('Too short');return}
  const users=getUsers();const old=currentUser();
  if(users[neu]){alert('Taken');return}
  users[neu]=users[old];delete users[old];safeSet('ck_users',JSON.stringify(users));
  const d=getData(old);saveData(neu,d);safeSet('ck_current',neu);
  try{localStorage.removeItem('ck_data_'+old)}catch(e){}
  refreshUI();alert('Username changed');
}
function changePassword(){
  const p=document.getElementById('setPass').value||'';
  if(p.length<8){alert('At least 8 chars');return}
  const users=getUsers();users[currentUser()]=p;safeSet('ck_users',JSON.stringify(users));alert('Password updated');
}
function deleteAccount(){
  if(!confirm('Delete account forever?'))return;
  const u=currentUser();const users=getUsers();delete users[u];safeSet('ck_users',JSON.stringify(users));
  try{localStorage.removeItem('ck_data_'+u)}catch(e){}
  logout();
}
function viewPlayerStats(){
  const name=(document.getElementById('playerSearch').value||'').trim();
  if(!name||!getUsers()[name]){alert('Player not found');return}
  const d=getData(name);
  alert(name+'\nTokens: '+d.tokens+'\nXP: '+d.exp+'\nOpened: '+(d.packsOpened||0));
}
(function init(){
  if(currentUser()&&getUsers()[currentUser()])afterLogin(currentUser());
})();
