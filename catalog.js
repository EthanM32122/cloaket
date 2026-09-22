const ASSET_BASE="https://raw.githubusercontent.com/EthanM32122/Bazaar-Pack21/main/artifacts/api-server/public";
function assetUrl(path){if(!path)return"";const p=String(path).split("?")[0].replace("/api/content/","/content/");return ASSET_BASE+p}
const CATALOG={"startTokens":1500,"claimAmount":4000,"rarities":{"Common":{"color":"#ffffff","exp":0},"Uncommon":{"color":"#29e629","exp":5},"Rare":{"color":"#0000ff","exp":10},"Epic":{"color":"#8000ff","exp":25},"Legendary":{"color":"#ffaf0f","exp":100},"Chroma":{"color":"#00ccff","exp":1000},"Supreme":{"color":"#be0000","exp":1000},"Unique":{"color":"#008080","exp":1000},"Mystical":{"color":"#843af2","exp":2500},"Iridescent":{"color":"rainbow","exp":3000}},"packs":[],"blooks":[]};
// Load full catalog data then init images
fetch("catalog-data.json").then(r=>r.json()).then(data=>{
  Object.assign(CATALOG,data);
  CATALOG.blooks.forEach(b=>b.img=assetUrl(b.image));
  CATALOG.packs.forEach(p=>p.img=assetUrl(p.image));
  window.__catalogReady=true;
  window.dispatchEvent(new Event("catalogready"));
}).catch(e=>console.error("catalog load failed",e));
