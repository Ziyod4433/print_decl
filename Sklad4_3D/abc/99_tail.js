/* ---------------------------------------------------------------- при открытии — сохранённый вариант; наружу — API */
{ const v=ST().v; if(v&&v!=='cur') setVariant(v); else UIX.sync(); }
return {setVariant,resetVariant,get v(){ return VCUR; },SIMX,NAV,UIX,GEN,KAT,VAR,LIBX,recsOf,southZones,kzSlots,aislesOf,levFor,
  get spawned(){ return spawned; },get fix(){ return fixG; },tick:dt=>SIMX.tick(dt)};
})();
