const ASSET_BASE="https://raw.githubusercontent.com/EthanM32122/Bazaar-Pack21/main/artifacts/api-server/public";
function assetUrl(path){if(!path)return"";const p=String(path).split("?")[0].replace("/api/content/","/content/");return ASSET_BASE+p}
let CATALOG={startTokens:1500,claimAmount:4000,packs:[],blooks:[],rarities:{}};
Promise.all([fetch("cat1.json").then(r=>r.json()),fetch("cat2.json").then(r=>r.json())]).then(([a,b])=>{
  CATALOG=Object.assign({},a,{blooks:(a.blooks||[]).concat(b.blooks||[])});
  CATALOG.blooks.forEach(x=>x.img=assetUrl(x.image));
  CATALOG.packs.forEach(x=>x.img=assetUrl(x.image));
  window.CATALOG=CATALOG;
  window.__catalogReady=true;
  window.dispatchEvent(new Event("catalogready"));
}).catch(e=>console.error(e));
