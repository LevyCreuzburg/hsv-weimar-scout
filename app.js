const KEY = 'handball-scout-v1';
const defaults = { team:'', opponent:'', date:new Date().toISOString().slice(0,10), half:'1. Halbzeit', players:[{number:'1',name:'Torwart/in',position:'Torwart/in'}], events:[], history:[], clockSeconds:0 };
let state = JSON.parse(localStorage.getItem(KEY) || 'null') || defaults;
state.history = state.history || [];
state.seasons = state.seasons || [{name:'Saison 1',history:state.history}];
state.activeSeason = Number.isInteger(state.activeSeason) ? state.activeSeason : 0;
if(!state.seasons[state.activeSeason])state.activeSeason=0;
state.history = state.seasons[state.activeSeason].history || [];
state.clockSeconds = Number(state.clockSeconds || 0);
let selectedAction = null;
const $ = id => document.getElementById(id);
const actionInfo = { goal:{label:'Tor',icon:'＋',color:'green'}, miss:{label:'Fehlwurf',icon:'↗',color:'red'}, save:{label:'Parade',icon:'◉',color:'blue'}, conceded:{label:'Gegentor',icon:'−',color:'orange'}, error:{label:'Technischer Fehler',icon:'!',color:'red'}, assist:{label:'Assist',icon:'↝',color:'purple'} };
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function init(){ $('teamName').value=state.team;$('opponentName').value=state.opponent;$('gameDate').value=state.date;$('half').value=state.half; renderRoster(); renderAll(); renderHistory(); }
function renderAll(){ $('teamNameLabel').textContent=(state.team||'HEIM').toUpperCase(); const goals=state.events.filter(e=>e.type==='goal').length;const against=state.events.filter(e=>e.type==='conceded').length;$('homeScore').textContent=goals;$('awayScore').textContent=against;renderEvents();renderStats(); }
function gameTitle(game){return `${game.date||'Ohne Datum'} · ${game.team||'Heim'} ${game.events.filter(e=>e.type==='goal').length}:${game.events.filter(e=>e.type==='conceded').length} ${game.opponent||'Gegner'}`;}
function scoreFor(game){return {home:game.events.filter(e=>e.type==='goal').length,away:game.events.filter(e=>e.type==='conceded').length};}
function renderOpponentSuggestions(){const opponents=[...new Set(state.history.map(game=>game.opponent).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'));$('opponentSuggestions').innerHTML=opponents.map(name=>`<option value="${name}"></option>`).join('');}
function renderHistory(){const select=$('savedGames'),query=($('historySearch')?.value||'').trim().toLocaleLowerCase('de'),filter=$('historyFilter')?.value||'all';const games=state.history.map((game,index)=>({game,index})).filter(({game})=>{const score=scoreFor(game),searchText=[game.date,game.team,game.opponent].join(' ').toLocaleLowerCase('de');const matchesSearch=!query||searchText.includes(query);const result=score.home>score.away?'win':score.home===score.away?'draw':'loss';return matchesSearch&&(filter==='all'||filter===result);});select.innerHTML='<option value="">Aktuelles Spiel</option>'+games.map(({game,index})=>`<option value="${index}">${gameTitle(game)}</option>`).join('');renderOpponentSuggestions();}
function archiveCurrent(){if(!state.events.length&&!state.team&&!state.opponent)return false;const snapshot={team:state.team,opponent:state.opponent,date:state.date,half:state.half,players:state.players.map(p=>({...p})),events:state.events.map(e=>({...e})),currentLineup:currentLineup(),lineupChanges:(state.lineupChanges||[]).map(change=>({...change,lineup:[...(change.lineup||[])],previousLineup:[...(change.previousLineup||[])]})),clockSeconds:state.clockSeconds||0};state.history=[snapshot,...state.history].slice(0,20);return true;}
function resetCurrentGame(){const team=state.team,players=state.players,seasons=state.seasons,activeSeason=state.activeSeason;state={...defaults,date:new Date().toISOString().slice(0,10),team,players,events:[],history:state.history,seasons,activeSeason};save();init();}
function renderRoster(){const select=$('eventPlayer');select.innerHTML=state.players.map(p=>`<option value="${p.number} — ${p.name}">#${p.number} · ${p.name}</option>`).join('');$('rosterList').innerHTML=state.players.map((p,i)=>`<div class="player"><span class="number">${p.number}</span><div class="player-info"><b>${p.name}</b><small>Spieler/in</small></div><button class="remove" data-remove="${i}">×</button></div>`).join('');document.querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=()=>{state.players.splice(Number(btn.dataset.remove),1);save();renderRoster();toast('Spieler/in entfernt');});}
function renderEvents(){const list=$('eventList');if(!state.events.length){list.innerHTML='<div class="empty">Noch keine Aktionen erfasst.<br /><small>Wähle links eine Aktion aus.</small></div>';return}list.innerHTML=[...state.events].reverse().map(e=>{const isOpponent=e.player==='Gegner';const playerLabel=isOpponent?'Gegner':'#'+e.player.split(' — ')[0];const playerName=isOpponent?'Gegner':e.player.split(' — ')[1]||'';return `<div class="event-item"><span class="event-icon" style="background:${e.color==='green'?'#e5f7ee':e.color==='blue'?'#e8efff':e.color==='orange'?'#fff2de':'#ffebeb'};color:${e.color==='green'?'#15965a':e.color==='blue'?'#416ed0':e.color==='orange'?'#d88b22':'#db5555'}">${e.icon}</span><div class="event-meta"><b>${e.label} · ${playerLabel}</b><small>${playerName} · ${e.zone}${e.note?' · '+e.note:''}</small></div><span class="event-time">${e.time||'—'}</span></div>`}).join('');}
function renderStats(){const count=t=>state.events.filter(e=>e.type===t).length;const cards=[['Tore',count('goal'),'green'],['Wurfquote',`${count('goal')+count('miss')?Math.round(count('goal')/(count('goal')+count('miss'))*100):0}%`,'blue'],['Paraden',count('save'),'blue'],['Technische Fehler',count('error'),'orange']];$('statsGrid').innerHTML=cards.map(c=>`<div class="stat ${c[2]}"><span>${c[0]}</span><b>${c[1]}</b></div>`).join('');$('playerTable').innerHTML=state.players.map(p=>{const es=state.events.filter(e=>e.player.startsWith(p.number+' — '));return `<tr><td><b>#${p.number} ${p.name}</b></td><td>${es.filter(e=>e.type==='goal').length}</td><td>${es.filter(e=>e.type==='miss').length}</td><td>${es.filter(e=>e.type==='save').length}</td><td>${es.filter(e=>e.type==='conceded').length}</td><td>${es.filter(e=>e.type==='error').length}</td></tr>`}).join('')||'<tr><td colspan="6">Noch keine Spieler/innen angelegt.</td></tr>';}
document.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.tab,.tab-panel').forEach(x=>x.classList.remove('active'));btn.classList.add('active');$(btn.dataset.tab).classList.add('active');});
document.querySelectorAll('[data-action]').forEach(btn=>btn.onclick=()=>{selectedAction=btn.dataset.action;$('eventForm').classList.remove('hidden');$('eventTitle').textContent=actionInfo[selectedAction].label+' erfassen';$('eventForm').scrollIntoView({behavior:'smooth',block:'nearest'});});
$('saveEvent').onclick=()=>{if(!selectedAction)return;const info=actionInfo[selectedAction];state.events.push({type:selectedAction,...info,player:$('eventPlayer').value,zone:$('eventZone').value,time:$('eventTime').value,note:$('eventNote').value});save();renderAll();$('eventTime').value='';$('eventNote').value='';toast(info.label+' gespeichert');};
$('clearEvents').onclick=()=>{if(state.events.length&&confirm('Alle Aktionen dieser Chronik löschen?')){state.events=[];save();renderAll();toast('Chronik gelöscht');}};
['teamName','opponentName','gameDate','half'].forEach(id=>$(id).onchange=()=>{state.team=$('teamName').value;state.opponent=$('opponentName').value;state.date=$('gameDate').value;state.half=$('half').value;save();renderAll();});
$('savedGames').onchange=()=>{const index=$('savedGames').value;if(index==='')return;const game=state.history[Number(index)];if(!game)return;state={...game,history:state.history};save();init();toast('Gespeichertes Spiel geöffnet');};
$('addPlayer').onclick=()=>{const number=$('playerNumber').value.trim(),name=$('playerName').value.trim();if(!number||!name)return toast('Bitte Nummer und Namen eingeben');state.players.push({number,name});save();$('playerNumber').value='';$('playerName').value='';renderRoster();toast('Spieler/in hinzugefügt');};
$('saveGameBtn').onclick=()=>{if(!state.events.length)return toast('Noch keine Aktionen zum Speichern erfasst');if(!archiveCurrent())return;state.seasons[state.activeSeason].history=state.history;resetCurrentGame();toast('Spiel gespeichert · neues Spiel ist bereit');};
$('newGameBtn').onclick=()=>{if(state.events.length&&!confirm('Neues Spiel beginnen? Nicht gespeicherte Aktionen werden gelöscht.'))return;resetCurrentGame();toast('Neues Spiel gestartet');};
$('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`handball-spiel-${state.date||'export'}.json`;a.click();URL.revokeObjectURL(a.href);toast('Spiel exportiert');};
$('importInput').onchange=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{state=JSON.parse(reader.result);save();init();toast('Spiel importiert')}catch{toast('Datei konnte nicht gelesen werden')}};reader.readAsText(file);};
Object.assign(actionInfo,{penalty:{label:'Zeitstrafe',icon:'2′',color:'orange'},yellow:{label:'Gelbe Karte',icon:'▮',color:'yellow'},red:{label:'Rote Karte',icon:'▮',color:'red'},substitution:{label:'Auswechslung',icon:'↔',color:'blue'}});
function renderSeason(){const games=state.history,allPlayers={};games.forEach(game=>game.events.forEach(e=>{if(e.player==='Gegner')return;const name=e.player||'Unbekannt';if(!allPlayers[name])allPlayers[name]={games:0,goals:0,saves:0,errors:0,penalties:0,cards:0};const p=allPlayers[name];if(e.type==='goal')p.goals++;if(e.type==='save')p.saves++;if(e.type==='error')p.errors++;if(e.type==='penalty')p.penalties++;if(e.type==='yellow'||e.type==='red')p.cards++;}));Object.keys(allPlayers).forEach(name=>{allPlayers[name].games=games.filter(g=>g.events.some(e=>e.player===name)).length});const rows=Object.entries(allPlayers);$('seasonGrid').innerHTML=[['Spiele',games.length],['Saisontore',rows.reduce((n,[,p])=>n+p.goals,0)],['Paraden',rows.reduce((n,[,p])=>n+p.saves,0)],['Zeitstrafen',rows.reduce((n,[,p])=>n+p.penalties,0)]].map(c=>`<div class="stat"><span>${c[0]}</span><b>${c[1]}</b></div>`).join('');$('seasonTable').innerHTML=rows.map(([name,p])=>`<tr><td><b>${name}</b></td><td>${p.games}</td><td>${p.goals}</td><td>${p.saves}</td><td>${p.errors}</td><td>${p.penalties}</td><td>${p.cards}</td></tr>`).join('')||'<tr><td colspan="7">Noch keine Saisonaktionen erfasst.</td></tr>';}
function applyTheme(){document.body.classList.toggle('dark',localStorage.getItem('handball-dark')==='1');$('themeToggle').textContent=document.body.classList.contains('dark')?'☀ Hell':'☾ Dunkel';}
$('themeToggle').onclick=()=>{localStorage.setItem('handball-dark',document.body.classList.contains('dark')?'0':'1');applyTheme();};
document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>{const field=$('errorCategoryField');if(field)field.remove();if(btn.dataset.action==='error'){const category=document.createElement('div');category.className='field';category.id='errorCategoryField';category.innerHTML='<label>Fehlerkategorie</label><select id="errorCategory"><option>Schrittfehler</option><option>Stürmerfoul</option><option>Fehlpass</option><option>Ball verloren</option><option>Doppeldribbling</option><option>Passives Spiel</option><option>Sonstiger Fehler</option></select>';$('eventForm').querySelector('.form-row').appendChild(category);}}));
$('saveEvent').onclick=()=>{if(!selectedAction)return;const info=actionInfo[selectedAction];const category=$('errorCategory')?.value||'';const note=selectedAction==='error'&&category?category+($('eventNote').value?' · '+$('eventNote').value:''):$('eventNote').value;state.events.push({type:selectedAction,...info,player:$('eventPlayer').value,zone:$('eventZone').value,time:$('eventTime').value,note,category});save();renderAll();$('eventTime').value='';$('eventNote').value='';toast(info.label+' gespeichert');};
const originalRenderAll=renderAll;renderAll=function(){originalRenderAll();renderSeason();};
const extraStyle=document.createElement('style');extraStyle.textContent='.dark{--bg:#111827;--ink:#e5e7eb;--muted:#a8b3c4;--line:#2d3a4f;--shadow:0 12px 35px #0005}.dark .card,.dark .action,.dark .field input,.dark .field select,.dark .add-player input{background:#182235;color:var(--ink);border-color:var(--line)}.dark .hero{background:linear-gradient(115deg,#182235 65%,#1c304b)}.dark .event-form{background:#111a2b}.dark .toolbar,.dark .table-card,.dark .roster-card{background:#182235}.dark th{color:#9aa7b9}.penalty span{color:#d88b22}.card-action span{color:#e8b42e}.red-card span{color:#dc5555}.substitution span{color:#416ed0}';document.head.appendChild(extraStyle);
const positions=['Torwart/in','Außen links','Außen rechts','Rückraum links','Rückraum Mitte','Rückraum rechts','Kreis','7-Meter-Spezialist/in'];
function ensurePositionSelect(){if($('playerPosition'))return;const select=document.createElement('select');select.id='playerPosition';select.innerHTML=positions.map(p=>`<option>${p}</option>`).join('');select.setAttribute('aria-label','Position');$('playerName').parentElement.insertBefore(select,$('addPlayer'));}
function renderRoster(){ensurePositionSelect();const select=$('eventPlayer');select.innerHTML=state.players.map(p=>`<option value="${p.number} — ${p.name}">#${p.number} · ${p.name}</option>`).join('');$('rosterList').innerHTML=state.players.map((p,i)=>`<div class="player"><span class="number">${p.number}</span><div class="player-info"><b>${p.name}</b><small>${p.position||'Feldspieler/in'}</small></div><button class="remove" data-remove="${i}">×</button></div>`).join('');document.querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=()=>{state.players.splice(Number(btn.dataset.remove),1);save();renderRoster();toast('Spieler/in entfernt');});}
function fillPlayers(select,goaliesOnly=false){const players=state.players.filter(p=>!goaliesOnly||p.position==='Torwart/in'||(!p.position&&p.number==='1'));select.innerHTML=players.length?players.map(p=>`<option value="${p.number} — ${p.name}">#${p.number} · ${p.name}</option>`).join(''):'<option value="">Keine Torwart/innen eingetragen</option>';}
function fieldVisible(id,visible){const el=$(id);if(el)el.closest('.field').classList.toggle('hidden',!visible);}
function removeDynamicField(id){const el=$(id);if(el)el.closest('.field').remove();}
function configureAction(type){fillPlayers($('eventPlayer'),type==='save'||type==='conceded');const playerLabel=$('eventPlayer').closest('.field')?.querySelector('label');if(playerLabel)playerLabel.textContent=type==='conceded'?'Torwart/in':'Spieler/in';fieldVisible('eventPlayer',true);fieldVisible('eventZone',!['substitution','penalty','yellow','red'].includes(type));fieldVisible('eventTime',true);fieldVisible('eventNote',!['substitution','penalty','yellow','red'].includes(type));removeDynamicField('eventPlayerIn');removeDynamicField('eventPlayerOut');removeDynamicField('eventReason');if(type==='substitution'){fieldVisible('eventPlayer',false);const row=$('eventPlayer').closest('.form-row');['eventPlayerOut','eventPlayerIn'].forEach((id,i)=>{const field=document.createElement('div');field.className='field';field.innerHTML=`<label>${i?'Kommt rein':'Geht raus'}</label><select id="${id}"></select>`;row.insertBefore(field,row.firstChild);fillPlayers(field.querySelector('select'));});}if(['penalty','yellow','red'].includes(type)){const row=$('eventTime').closest('.form-row');const field=document.createElement('div');field.className='field';field.innerHTML='<label>Warum?</label><select id="eventReason"><option>Arm oder Hand im Gesicht</option><option>Festhalten</option><option>Stoßen</option><option>Zu harte Abwehr</option><option>Unsportliches Verhalten</option><option>Sonstiger Grund</option></select>';row.insertBefore(field,row.firstChild);}}
document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>configureAction(btn.dataset.action)));
$('addPlayer').onclick=()=>{const number=$('playerNumber').value.trim(),name=$('playerName').value.trim(),position=$('playerPosition').value;if(!number||!name)return toast('Bitte Nummer und Namen eingeben');state.players.push({number,name,position});save();$('playerNumber').value='';$('playerName').value='';renderRoster();toast('Spieler/in hinzugefügt');};
$('saveEvent').onclick=()=>{if(!selectedAction)return;const info=actionInfo[selectedAction];let player=$('eventPlayer').value,note=$('eventNote').value,playerIn='',playerOut='';if(selectedAction==='conceded'&&!player)return toast('Bitte den Torwart auswählen');if(selectedAction==='substitution'){playerIn=$('eventPlayerIn')?.value||'';playerOut=$('eventPlayerOut')?.value||'';player=playerOut;note=`Kommt rein: ${playerIn}`;}if(['penalty','yellow','red'].includes(selectedAction))note=$('eventReason')?.value||'';const category=$('errorCategory')?.value||'';if(selectedAction==='error'&&category)note=category+(note?' · '+note:'');state.events.push({type:selectedAction,...info,player,playerIn,playerOut,zone:['substitution','penalty','yellow','red'].includes(selectedAction)?'':$('eventZone').value,time:$('eventTime').value,note,category});save();renderAll();$('eventTime').value='';$('eventNote').value='';toast(info.label+' gespeichert');};
function renderStats(){const events=state.events,count=t=>events.filter(e=>e.type===t).length,shots=count('goal')+count('miss'),cards=[['Tore',count('goal'),'green'],['Wurfquote',`${shots?Math.round(count('goal')/shots*100):0}%`,'blue'],['Paraden',count('save'),'blue'],['Assists',count('assist'),'purple'],['Fehler',count('error'),'orange'],['Zeitstrafen',count('penalty'),'orange'],['Gelbe Karten',count('yellow'),'orange'],['Rote Karten',count('red'),'red']];$('statsGrid').innerHTML=cards.map(c=>`<div class="stat ${c[2]}"><span>${c[0]}</span><b>${c[1]}</b></div>`).join('');$('playerTable').closest('table').querySelector('thead').innerHTML='<tr><th>Spieler/in</th><th>Tore</th><th>Würfe</th><th>Quote</th><th>Paraden</th><th>Assists</th><th>Fehler</th><th>Strafen</th><th>Karten</th><th>Rein/Raus</th></tr>';$('playerTable').innerHTML=state.players.map(p=>{const es=events.filter(e=>e.player&&e.player.startsWith(p.number+' '));const goals=es.filter(e=>e.type==='goal').length,misses=es.filter(e=>e.type==='miss').length,shots=goals+misses,ins=events.filter(e=>e.type==='substitution'&&e.playerIn&&e.playerIn.startsWith(p.number+' ')).length,outs=events.filter(e=>e.type==='substitution'&&e.playerOut&&e.playerOut.startsWith(p.number+' ')).length;return `<tr><td><b>#${p.number} ${p.name}</b><small class="table-sub">${p.position||'Feldspieler/in'}</small></td><td>${goals}</td><td>${shots}</td><td>${shots?Math.round(goals/shots*100):0}%</td><td>${es.filter(e=>e.type==='save').length}</td><td>${es.filter(e=>e.type==='assist').length}</td><td>${es.filter(e=>e.type==='error').length}</td><td>${es.filter(e=>e.type==='penalty').length}</td><td>${es.filter(e=>e.type==='yellow').length}/${es.filter(e=>e.type==='red').length}</td><td>${ins}/${outs}</td></tr>`}).join('')||'<tr><td colspan="10">Noch keine Spieler/innen angelegt.</td></tr>';let breakdown=document.getElementById('errorBreakdown');if(!breakdown){breakdown=document.createElement('div');breakdown.id='errorBreakdown';$('stats').appendChild(breakdown);}const errorTypes={};events.filter(e=>e.type==='error').forEach(e=>{const key=e.category||e.note||'Sonstiger Fehler';errorTypes[key]=(errorTypes[key]||0)+1;});breakdown.className='card table-card error-breakdown';breakdown.innerHTML='<div class="section-head"><div><p class="eyebrow">FEHLERANALYSE</p><h2>Technische Fehler nach Kategorie</h2></div></div><div class="breakdown-list">'+(Object.entries(errorTypes).map(([name,total])=>`<div class="breakdown-row"><span>${name}</span><b>${total}</b></div>`).join('')||'<span class="muted">Noch keine technischen Fehler erfasst.</span>')+'</div>';}
function setupSeasonControls(){if($('seasonControls'))return;const head=$('season').querySelector('.section-head');const controls=document.createElement('div');controls.id='seasonControls';controls.className='season-controls';controls.innerHTML='<select id="seasonSelect"></select><button class="primary" id="newSeasonBtn">＋ Neue Saison</button><button class="icon-btn" id="deleteSeasonBtn" title="Saison löschen">⌫</button>';head.appendChild(controls);$('newSeasonBtn').onclick=()=>{if(state.events.length){archiveCurrent();}const name=prompt('Name der neuen Saison:',`Saison ${state.seasons.length+1}`);if(!name)return;state.seasons[state.activeSeason].history=state.history;state.seasons.push({name,history:[]});state.activeSeason=state.seasons.length-1;state={...state,history:[],events:[],date:new Date().toISOString().slice(0,10)};save();init();toast('Neue Saison angelegt');};$('deleteSeasonBtn').onclick=()=>{const current=state.seasons[state.activeSeason];if(!confirm(`Saison „${current.name}“ wirklich löschen? Alle Spiele dieser Saison werden gelöscht.`))return;state.seasons.splice(state.activeSeason,1);if(!state.seasons.length)state.seasons.push({name:'Saison 1',history:[]});state.activeSeason=Math.min(state.activeSeason,state.seasons.length-1);state.history=state.seasons[state.activeSeason].history;state.events=[];save();init();toast('Saison gelöscht');};$('seasonSelect').onchange=()=>{state.seasons[state.activeSeason].history=state.history;state.activeSeason=Number($('seasonSelect').value);state.history=state.seasons[state.activeSeason].history||[];state.events=[];save();init();toast('Saison gewechselt');};}
function saveSeasonState(){if(state.seasons?.[state.activeSeason])state.seasons[state.activeSeason].history=state.history;localStorage.setItem(KEY,JSON.stringify(state));}
save=saveSeasonState;
const oldRenderSeason=renderSeason;renderSeason=function(){if(!state.seasons){state.seasons=[{name:'Saison 1',history:state.history||[]}];state.activeSeason=0;}if(!state.seasons[state.activeSeason])state.activeSeason=0;state.history=state.seasons[state.activeSeason].history||[];oldRenderSeason();setupSeasonControls();const select=$('seasonSelect');if(select){select.innerHTML=state.seasons.map((s,i)=>`<option value="${i}">${s.name}</option>`).join('');select.value=String(state.activeSeason);}const title=$('season').querySelector('h2');if(title)title.textContent=`${state.seasons[state.activeSeason]?.name||'Saison'} · Spielerstatistik`;};
function playerEvents(player){const games=state.history.concat(state.events.length?[{events:state.events}]:[]);return games.flatMap(g=>g.events||[]).filter(e=>{const key=player.number+' ';return (e.player&&e.player.startsWith(key))||(e.playerIn&&e.playerIn.startsWith(key))||(e.playerOut&&e.playerOut.startsWith(key));});}
function detailList(items,empty='Keine Einträge'){if(!items.length)return `<span class="muted">${empty}</span>`;const counts={};items.forEach(item=>{counts[item]=(counts[item]||0)+1;});return Object.entries(counts).map(([name,total])=>`<div class="detail-row"><span>${name}</span><b>${total}×</b></div>`).join('');}
function showPlayerDetail(player){let modal=$('playerDetailModal');if(!modal){modal=document.createElement('div');modal.id='playerDetailModal';modal.innerHTML='<div class="detail-backdrop"></div><div class="detail-dialog"><button class="detail-close">×</button><div id="playerDetailContent"></div></div>';document.body.appendChild(modal);modal.querySelector('.detail-backdrop').onclick=()=>modal.remove();modal.querySelector('.detail-close').onclick=()=>modal.remove();}const events=playerEvents(player),goals=events.filter(e=>e.type==='goal').length,misses=events.filter(e=>e.type==='miss').length;const errors=events.filter(e=>e.type==='error').map(e=>e.category||e.note||'Sonstiger Fehler'),penalties=events.filter(e=>e.type==='penalty').map(e=>e.note||'Kein Grund angegeben'),yellow=events.filter(e=>e.type==='yellow').map(e=>e.note||'Kein Grund angegeben'),red=events.filter(e=>e.type==='red').map(e=>e.note||'Kein Grund angegeben'),ins=events.filter(e=>e.type==='substitution'&&e.playerIn&&e.playerIn.startsWith(player.number+' ')).length,outs=events.filter(e=>e.type==='substitution'&&e.playerOut&&e.playerOut.startsWith(player.number+' ')).length;$('playerDetailContent').innerHTML=`<p class="eyebrow">SPIELERDETAILS</p><h2>#${player.number} ${player.name}</h2><p class="muted">${player.position||'Feldspieler/in'}</p><div class="detail-kpis"><div><b>${goals}</b><span>Tore</span></div><div><b>${misses}</b><span>Fehlwürfe</span></div><div><b>${events.filter(e=>e.type==='save').length}</b><span>Paraden</span></div><div><b>${events.filter(e=>e.type==='assist').length}</b><span>Assists</span></div></div><div class="detail-columns"><section><h3>Technische Fehler</h3><div class="detail-list">${detailList(errors)}</div></section><section><h3>Zeitstrafen · Grund</h3><div class="detail-list">${detailList(penalties)}</div></section><section><h3>Gelbe Karten · Grund</h3><div class="detail-list">${detailList(yellow)}</div></section><section><h3>Rote Karten · Grund</h3><div class="detail-list">${detailList(red)}</div></section><section><h3>Auswechslungen</h3><div class="detail-list"><div class="detail-row"><span>Rein / Raus</span><b>${ins} / ${outs}</b></div></div></section></div>`;modal.classList.add('open');}
function enablePlayerDetails(){document.querySelectorAll('#playerTable tr').forEach((row,index)=>{const player=state.players[index];if(!player||!row.querySelector('td'))return;row.classList.add('clickable-row');row.title='Für Details anklicken';row.onclick=()=>showPlayerDetail(player);});}
const renderAllWithDetails=renderAll;renderAll=function(){renderAllWithDetails();enablePlayerDetails();};
const detailStyle=document.createElement('style');detailStyle.textContent='.clickable-row{cursor:pointer}.clickable-row:hover{background:#f0f5ff}.detail-backdrop{position:fixed;inset:0;background:#09142699}.detail-dialog{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(720px,calc(100% - 28px));max-height:85vh;overflow:auto;background:#fff;color:var(--ink);border-radius:15px;padding:27px;box-shadow:0 20px 70px #07132655}.dark .detail-dialog{background:#182235;color:var(--ink)}.detail-close{position:absolute;right:15px;top:10px;border:0;background:none;color:var(--muted);font-size:25px;cursor:pointer}.detail-dialog h2{margin:0;font-size:24px}.detail-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:20px 0}.detail-kpis div{background:#f4f7fb;border-radius:9px;padding:12px}.dark .detail-kpis div{background:#111a2b}.detail-kpis b,.detail-kpis span{display:block}.detail-kpis b{font-size:24px}.detail-kpis span{font-size:11px;color:var(--muted)}.detail-columns{display:grid;grid-template-columns:1fr 1fr;gap:17px}.detail-columns h3{font-size:14px;margin:0 0 8px}.detail-list{font-size:13px}.detail-row{display:flex;justify-content:space-between;gap:12px;padding:8px 10px;border:1px solid var(--line);border-radius:7px;margin-bottom:5px}.detail-row span{color:var(--muted)}@media(max-width:600px){.detail-kpis{grid-template-columns:repeat(2,1fr)}.detail-columns{grid-template-columns:1fr}}';document.head.appendChild(detailStyle);
$('historySearch').oninput=renderHistory;
 $('historyFilter').onchange=renderHistory;
const originalStatsWithErrors=renderStats;
renderStats=function(){originalStatsWithErrors();const breakdown=$('errorBreakdown');if(!breakdown)return;const rows=[...breakdown.querySelectorAll('.breakdown-row')].sort((a,b)=>Number(b.querySelector('b').textContent)-Number(a.querySelector('b').textContent));const list=breakdown.querySelector('.breakdown-list');rows.forEach(row=>list.appendChild(row));const heading=breakdown.querySelector('h2');if(heading)heading.textContent='Häufigste Fehler';const first=rows[0];let summary=breakdown.querySelector('.error-summary');if(!summary){summary=document.createElement('p');summary.className='muted error-summary';breakdown.querySelector('.section-head > div').appendChild(summary);}summary.textContent=first?`Am häufigsten: ${first.querySelector('span').textContent} (${first.querySelector('b').textContent}×)`:'Noch keine technischen Fehler erfasst.';};
const sortedStats=renderStats;
renderStats=function(){sortedStats();const breakdown=$('errorBreakdown');if(!breakdown)return;const rows=[...breakdown.querySelectorAll('.breakdown-row')].sort((a,b)=>Number(b.querySelector('b').textContent)-Number(a.querySelector('b').textContent));const list=breakdown.querySelector('.breakdown-list');rows.forEach(row=>list.appendChild(row));const heading=breakdown.querySelector('h2');if(heading)heading.textContent='H\\u00e4ufigste Fehler';const first=rows[0];let summary=breakdown.querySelector('.error-summary');if(!summary){summary=document.createElement('p');summary.className='muted error-summary';breakdown.querySelector('.section-head > div').appendChild(summary);}summary.textContent=first?`Am h\\u00e4ufigsten: ${first.querySelector('span').textContent} (${first.querySelector('b').textContent}x)`:'Noch keine technischen Fehler erfasst.';};
function goalkeeperQuote(events,player){const relevant=events.filter(e=>e.player===player||e.player?.startsWith(player+' '));const saves=relevant.filter(e=>e.type==='save').length,conceded=relevant.filter(e=>e.type==='conceded').length,total=saves+conceded;return {saves,conceded,quote:total?Math.round(saves/total*100):null};}
function addGoalkeeperQuoteColumns(){const statsTable=$('playerTable')?.closest('table'),seasonTable=$('seasonTable')?.closest('table');if(statsTable&&!statsTable.querySelector('tbody td[data-goalkeeper-column]')){const header=statsTable.querySelector('thead tr');if(!header.querySelector('[data-goalkeeper-column]'))header.insertAdjacentHTML('beforeend','<th data-goalkeeper-column="true">Gegentore</th><th data-goalkeeper-column="true">Torwartquote</th>');[...$('playerTable').rows].forEach((row,index)=>{const player=state.players[index],stats=player?goalkeeperQuote(state.events,player.number+' — '+player.name):{conceded:0,quote:null};row.insertAdjacentHTML('beforeend',`<td data-goalkeeper-column="true">${stats.conceded}</td><td data-goalkeeper-column="true">${stats.quote===null?'—':stats.quote+'%'}</td>`);});}if(seasonTable&&!seasonTable.querySelector('tbody td[data-goalkeeper-column]')){const header=seasonTable.querySelector('thead tr');if(!header.querySelector('[data-goalkeeper-column]'))header.insertAdjacentHTML('beforeend','<th data-goalkeeper-column="true">Gegentore</th><th data-goalkeeper-column="true">Torwartquote</th>');[...$('seasonTable').rows].forEach(row=>{const name=row.cells[0]?.textContent.trim(),stats=goalkeeperQuote(state.history.flatMap(game=>game.events||[]),name);row.insertAdjacentHTML('beforeend',`<td data-goalkeeper-column="true">${stats.conceded}</td><td data-goalkeeper-column="true">${stats.quote===null?'—':stats.quote+'%'}</td>`);});}}
const renderStatsWithGoalkeeperQuote=renderStats;renderStats=function(){renderStatsWithGoalkeeperQuote();addGoalkeeperQuoteColumns();};
const renderSeasonWithGoalkeeperQuote=renderSeason;renderSeason=function(){renderSeasonWithGoalkeeperQuote();addGoalkeeperQuoteColumns();};
init();applyTheme();

/* Live-Aufstellung und zeitliche Ereignisverknüpfung. Die Felder sind bewusst
   additiv, damit ältere gespeicherte Spiele weiterhin gelesen werden können. */
const playerId = player => String(player.number);
const playerById = id => state.players.find(player => playerId(player) === String(id));
const parseMatchTime = value => {
  if (value === undefined || value === null || value === '') return Number(state.clockSeconds || 0);
  const parts = String(value).trim().split(':').map(Number);
  if (parts.some(Number.isNaN)) return Number(state.clockSeconds || 0);
  return parts.length === 1 ? parts[0] : parts[parts.length - 1] + parts[parts.length - 2] * 60;
};
const formatMatchTime = seconds => `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2,'0')}:${String(Math.max(0, seconds) % 60).padStart(2,'0')}`;
const currentLineup = () => Array.isArray(state.currentLineup) ? state.currentLineup.map(String) : [];
const lineupSnapshot = () => currentLineup().map(id => ({id, player: playerById(id)?.name || ''}));
function normalizeLiveData(){
  state.currentLineup = currentLineup().filter(id => playerById(id));
  state.lineupChanges = Array.isArray(state.lineupChanges) ? state.lineupChanges : [];
  state.events = (state.events || []).map(event => ({
    ...event,
    timestampSeconds: Number.isFinite(event.timestampSeconds) ? event.timestampSeconds : parseMatchTime(event.time),
    lineup: Array.isArray(event.lineup) ? event.lineup : [],
    lineupSnapshot: Array.isArray(event.lineupSnapshot) ? event.lineupSnapshot : (Array.isArray(event.lineup) ? event.lineup.map(id => ({id:String(id), player:playerById(id)?.name || ''})) : [])
  }));
}
normalizeLiveData();
function lineupTime(){return $('lineupTime')?.value || '';}
function persistLineupChange(previous, next, seconds){
  if (JSON.stringify(previous) === JSON.stringify(next)) return;
  state.lineupChanges.push({type:'lineup', timestampSeconds:seconds, time:formatMatchTime(seconds), lineup:next.slice(), lineupSnapshot:next.map(id=>({id,player:playerById(id)?.name||''})), previousLineup:previous.slice()});
}
function setLineup(next, seconds=parseMatchTime(lineupTime())){
  const previous=currentLineup();
  if (next.length > 7) return false;
  state.currentLineup=next.map(String);
  persistLineupChange(previous,state.currentLineup,seconds);
  save(); renderRoster();
  return true;
}
function toggleLineup(id){
  const next=currentLineup();
  const index=next.indexOf(String(id));
  if(index >= 0) next.splice(index,1);
  else if(next.length >= 7) return toast('Maximal 7 Spieler auf der Platte');
  else next.push(String(id));
  setLineup(next);
}
function renderLineupStatus(){
  const status=$('lineupStatus'); if(!status)return;
  const names=currentLineup().map(id=>playerById(id)?.name || `#${id}`);
  status.textContent=names.length ? `${names.length}/7 auf der Platte: ${names.join(', ')}` : 'Noch keine Spieler auf der Platte ausgewählt.';
}
function renderLiveRoster(){
  const list=$('rosterList'); if(!list)return;
  list.innerHTML=state.players.map((p,i)=>{const active=currentLineup().includes(playerId(p));return `<div class="player ${active?'on-court':''}" data-lineup-player="${i}" role="button" tabindex="0" aria-pressed="${active}"><span class="number">${p.number}</span><div class="player-info"><b>${p.name}</b><small>${p.position||'Feldspieler/in'}${active?' · auf der Platte':''}</small></div><button class="remove" data-remove="${i}" type="button">×</button></div>`}).join('');
  list.querySelectorAll('[data-lineup-player]').forEach(card=>{const index=Number(card.dataset.lineupPlayer);card.onclick=event=>{if(event.target.closest('[data-remove]'))return;toggleLineup(playerId(state.players[index]));};card.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleLineup(playerId(state.players[index]));}};});
  list.querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=event=>{event.stopPropagation();const index=Number(btn.dataset.remove),removed=playerId(state.players[index]);state.currentLineup=currentLineup().filter(id=>id!==removed);state.players.splice(index,1);save();renderRoster();toast('Spieler/in entfernt');});
  renderLineupStatus();
}
const baseRenderRoster=renderRoster;
renderRoster=function(){
  ensurePositionSelect();
  const select=$('eventPlayer');
  if(select && !selectedAction) fillPlayers(select);
  baseRenderRoster();
  renderLiveRoster();
};
function activeOptions(select, ids=currentLineup()){
  const players=ids.map(id=>playerById(id)).filter(Boolean);
  select.innerHTML=players.length ? players.map(p=>`<option value="${p.number} ${p.name}">${p.number} · ${p.name}</option>`).join('') : '<option value="">Keine Spieler auf der Platte</option>';
}
const toPlayerId=value=>String(value||'').trim().split(/\s+/)[0];
const baseConfigureAction=configureAction;
configureAction=function(type){
  baseConfigureAction(type);
  if(type==='conceded'||type==='save'){
    const activeGoalkeepers=currentLineup().filter(id=>playerById(id)?.position==='Torwart/in');
    activeOptions($('eventPlayer'),activeGoalkeepers);
  } else if(['goal','miss','error','assist','yellow','red','penalty'].includes(type)) activeOptions($('eventPlayer'));
  if(type==='goal' && !currentLineup().length) toast('Zuerst Spieler auf der Platte auswählen');
};
function eventTimeValue(){const input=$('eventTime');const seconds=parseMatchTime(input?.value);return {time:input?.value || formatMatchTime(seconds),timestampSeconds:seconds};}
const saveEventWithLineup=()=>{
  if(!selectedAction)return;
  const info=actionInfo[selectedAction], before=currentLineup(), timing=eventTimeValue();
  let player=$('eventPlayer')?.value||'', playerIn='', playerOut='', note=$('eventNote')?.value||'';
  if(selectedAction==='substitution'){playerIn=$('eventPlayerIn')?.value||'';playerOut=$('eventPlayerOut')?.value||'';if(!playerOut||!playerIn)return toast('Bitte Spieler/in raus und rein auswählen');}
  if(selectedAction!=='substitution'&&!player)return toast('Bitte einen Spieler auf der Platte auswählen');
  if(selectedAction==='substitution'){
    playerOut=toPlayerId(playerOut);playerIn=toPlayerId(playerIn);player=playerOut;
    if(!before.includes(playerOut))return toast('Der Spieler zum Auswechseln ist nicht auf der Platte');
    if(before.includes(playerIn))return toast('Der einwechselnde Spieler ist bereits auf der Platte');
    note=`Kommt rein: ${playerIn}`;
  }
  const eventPlayerIn=selectedAction==='substitution' ? `${playerIn} ${playerById(playerIn)?.name||''}`.trim() : '';
  const eventPlayerOut=selectedAction==='substitution' ? `${playerOut} ${playerById(playerOut)?.name||''}`.trim() : '';
  const event={type:selectedAction,...info,player:selectedAction==='substitution'?eventPlayerOut:player,playerId:player?toPlayerId(player):null,playerIn:eventPlayerIn,playerOut:eventPlayerOut,zone:['substitution','penalty','yellow','red'].includes(selectedAction)?'':$('eventZone')?.value||'',time:timing.time,timestampSeconds:timing.timestampSeconds,note,category:$('errorCategory')?.value||'',lineup:before.slice(),lineupSnapshot:lineupSnapshot(),lineupAtEvent:before.slice()};
  if(selectedAction==='substitution'){
    const after=before.filter(id=>id!==playerOut);after.push(playerIn);
    event.lineupAfter=after.slice(); persistLineupChange(before,after,timing.timestampSeconds); state.currentLineup=after;
  }
  state.events.push(event);save();renderAll();renderRoster();$('eventTime').value='';$('eventNote').value='';toast(info.label+' gespeichert');
};
$('saveEvent').onclick=saveEventWithLineup;
const oldRenderEvents=renderEvents;
renderEvents=function(){
  const list=$('eventList');
  if(!state.events.length){oldRenderEvents();return;}
  list.innerHTML=[...state.events].reverse().map(e=>{
    const id=e.playerId||toPlayerId(e.player);
    const known=playerById(id), opponent=e.player==='Gegner';
    const label=opponent?'Gegner':known?`#${known.number}`:(e.player||'Spieler');
    const name=opponent?'Gegner':known?.name||'';
    const bg=e.color==='green'?'#e5f7ee':e.color==='blue'?'#e8efff':e.color==='orange'?'#fff2de':'#ffebeb';
    const color=e.color==='green'?'#15965a':e.color==='blue'?'#416ed0':e.color==='orange'?'#d88b22':'#db5555';
    return `<div class="event-item"><span class="event-icon" style="background:${bg};color:${color}">${e.icon}</span><div class="event-meta"><b>${e.label} · ${label}</b><small>${name}${e.zone?' · '+e.zone:''}${e.note?' · '+e.note:''}</small></div><span class="event-time">${e.time||'—'}</span></div>`;
  }).join('');
};
renderRoster();

// Torwartstatistik anhand der stabilen Trikotnummer auswerten. Dadurch bleiben
// neue Ereignisse und ältere Exporte mit unterschiedlichen Namensformaten kompatibel.
goalkeeperQuote=function(events,player){
  const id=toPlayerId(player);
  const relevant=events.filter(event=>event.playerId===id||toPlayerId(event.player)===id);
  const saves=relevant.filter(event=>event.type==='save').length;
  const conceded=relevant.filter(event=>event.type==='conceded').length;
  const total=saves+conceded;
  return {saves,conceded,quote:total?Math.round(saves/total*100):null};
};
addGoalkeeperQuoteColumns=function(){
  const addColumns=(table,rows,players)=>{
    if(!table)return;
    const header=table.querySelector('thead tr');
    header.querySelectorAll('[data-goalkeeper-column]').forEach(cell=>cell.remove());
    header.insertAdjacentHTML('beforeend','<th data-goalkeeper-column="true">Torwartquote</th><th data-goalkeeper-column="true"></th>');
    rows.forEach(row=>row.querySelectorAll('[data-goalkeeper-column]').forEach(cell=>cell.remove()));
    rows.forEach((row,index)=>{
      const player=players[index];
      const sourceEvents=table.querySelector('tbody#playerTable')?state.events:state.history.flatMap(game=>game.events||[]);
      const stats=player?goalkeeperQuote(sourceEvents,player):{saves:0,conceded:0,quote:null};
      row.insertAdjacentHTML('beforeend',`<td data-goalkeeper-column="true">${stats.quote===null?'—':stats.quote+'%'}</td><td data-goalkeeper-column="true">${stats.saves} / ${stats.saves+stats.conceded}</td>`);
    });
  };
  const statsTable=$('playerTable')?.closest('table');
  if(statsTable){
    const players=state.players,rows=[...$('playerTable').rows];
    addColumns(statsTable,rows,players.map(player=>`${player.number} ${player.name}`));
  }
  const seasonTable=$('seasonTable')?.closest('table');
  if(seasonTable){
    const players=[...$('seasonTable').rows].map(row=>row.cells[0]?.textContent.trim()||'');
    addColumns(seasonTable,[...$('seasonTable').rows],players);
  }
};
renderAll();
