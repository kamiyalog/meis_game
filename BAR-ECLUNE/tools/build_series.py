"""Compile CASE02–06 from FIX scripts. Text remains byte-identical after escape decoding.
Manual point award maps for CASE02/03: their polished script omits SYSTEM awards.
CASE04–06 awards and conditions are read from the polished row notes.
"""
import json,re,pathlib,openpyxl
ROOT=pathlib.Path(__file__).resolve().parents[1];BASE=ROOT.parents[2]
SCRIPT=BASE/'upload/BAR_ECLUNE_CASE01-06_全体収録台本_完成版(1).xlsx'
SPEC=BASE/'game-inputs/BAR_ECLUNE_ゲーム仕様書_v6.2_CASE04時刻ロジック_FIX(1).xlsx'
w=openpyxl.load_workbook(SCRIPT,data_only=True);spec=openpyxl.load_workbook(SPEC,data_only=True)
c1=json.loads((ROOT/'data.js').read_text().split(' = ',1)[1].rstrip(';\n'))
NAMES=['消えた売上金','消えた婚約指輪','帰ってこない娘','事故死した男','存在しない男','騙された女']
SERIES={1:c1};AUDIT=[]
# UI point boundaries in CASE02/03 correspond exactly to selected original sequences.
AWARDS={
2:{'紅':{226:[1],254:[2],295:[3],324:[4],348:[5]},'藍':{485:[6,7],550:[8],601:[9,10]},'翠':{737:[11,12],787:[13],839:[14],873:[15],898:[16]},'紅→藍':{975:[6],978:[7],990:[9,10]},'紅→翠':{1050:[35],1070:[34]},'藍→紅':{1141:[17,18,19]},'藍→翠':{1294:[20,21,22,23]},'翠→紅':{1427:[24],1481:[25],1523:[26,27]},'翠→藍':{1592:[28,29],1610:[30,31],1626:[32,33]}},
3:{'紅':{189:[1],206:[2,3],230:[4],237:[5],245:[6],250:[7]},'藍':{326:[8,9],358:[10,11,12],441:[13]},'翠':{522:[14],536:[15],583:[16],630:[17,18,19,20],705:[21]},'紅→藍':{759:[22],794:[23,24,25,26,27]},'紅→翠':{933:[14,15],955:[18,19,23,24,25,26,27]},'藍→紅':{1044:[28],1047:[29],1050:[30],1059:[23,24,25,26,27]},'藍→翠':{1100:[31],1109:[32],1117:[33],1125:[34,23,24,25,26,27]},'翠→紅':{1187:[28],1190:[29],1193:[35],1207:[36,23,24,25,26,27]},'翠→藍':{1254:[8],1265:[10,11,12],1291:[37],1301:[38,23,24,25,26,27]}}
}
# Explicit required evidence from the FIX specification (only current-day awards count).
REQ={2:{'紅':[1,2,3,4,5],'藍':[6,7,8,9,10],'翠':[11,12,13,14,15,16],'紅→藍':[6,7,9,10],'紅→翠':[34,35],'藍→紅':[17,18,19],'藍→翠':[20,21,22,23],'翠→紅':[25,26,27],'翠→藍':[28,29,30,31,32,33]},3:{'紅':[1,2,3,5,7],'藍':[8,10,11,12,13],'翠':[14,15,16,18,19,21],'紅→藍':[22,23,24,25,26,27],'紅→翠':[14,15,18,19,23,24,25,26,27],'藍→紅':[28,29,30,23,24,25,26,27],'藍→翠':[31,32,33,34,23,24,25,26,27],'翠→紅':[28,29,35,36,23,24,25,26,27],'翠→藍':[8,10,11,12,37,38,23,24,25,26,27]}}
# Scene changes are mapped only to places shown in the source.
SCENES={2:[('寝室',72),('リビング',71)],3:[('梨沙の部屋',74),('洗面所',75),('管理人室',77),('エントランス',76),('マンション',73),('本町駅',78),('駅窓口',78),('西崎商事',79),('受付',79),('休憩スペース',80),('不動産会社',81),('喫茶店',67)],4:[('警察署',68),('5F・非常階段',84),('非常階段',84),('発見地点',85),('5階・社内',90),('5階・会社',90),('管理室',83),('小会議室',87),('野村亮',89),('石田美穂',88),('久保隆司',87),('雑居ビル・5階',86),('雑居ビル',82)],5:[('居酒屋',91),('マンション',93),('コンビニ',94),('最後に会った店',95),('三浦の自宅',96),('本棚',96),('勤務先',97),('旧事務所',98),('街中',101),('駅前広場',103),('駅周辺',103),('喫茶店',67)],6:[('交流会',104),('会場の外',111),('ホテルラウンジ',105),('貸会議室',107),('打ち合わせ室',107),('新店舗',108),('レストラン',109),('喫茶店',67),('名刺の住所',110)]}
NPC={2:{'佐伯':17,'千夏':18,'健吾':19,'奈々':20,'美咲':21,'客':22,'知らない客':22,'男':17},3:{'恵子':23,'梨沙':24,'香織':25,'真帆':26,'管理人':27,'駅員':28,'受付':29,'担当者':30,'女性':23},4:{'千尋':31,'久保':32,'久保隆司':32,'野村':33,'野村亮':33,'石田':34,'石田美穂':34,'管理責任者':35,'受付':36,'警察官':37,'刑事':38,'受付警察官':37,'女性':31,'男':38},5:{'三浦':39,'男':39,'店主':41,'管理人':42,'店員':43,'店長':44,'受付':45,'管理責任者':46,'管理担当者':47,'女性':48},6:{'佳奈':50,'相沢':51,'黒川':51,'真紀':52,'主催者':53,'スタッフ':54,'受付':55,'担当者':56,'店員':57,'警察官':58,'客':59}}
# Evidence-to-image mapping; revised shared evidence image 150 replaces removed 152.
IMAGES={
2:{1:['121'],5:[],6:['120'],9:['120'],17:[],25:[],28:['120']},
3:{2:['130'],3:['130'],4:['134'],5:['132'],6:['133'],7:['125-01','125-02'],8:['128'],10:[],12:['129'],13:['129'],14:[],22:['125-02','138'],28:['130','131','132'],29:['136'],35:['137'],36:['135'],37:['129']},
4:{1:['140'],2:['141'],3:['140'],4:['153'],5:['146'],7:['142'],8:['143-01','143-02'],9:['145'],10:['143-01'],11:['143-02'],12:['148'],13:['149'],17:['151'],20:['144-01','144-02','144-03'],21:['146'],22:['147'],23:['149'],24:['150'],25:['148'],26:['148'],27:['149'],28:['150'],30:['148'],31:['150'],32:['150'],33:['149'],35:['151'],37:['153'],38:['141'],39:['140'],40:['150'],41:['143-01','143-02'],42:['147'],43:['148'],44:['150']},
5:{2:['154'],6:['155-01','155-02'],9:['157'],10:['157'],12:['159'],13:['158-01','158-02'],14:['160'],17:['159'],26:['155-01','155-02'],27:['155-01','155-02'],28:['155-01','155-02'],32:['161','162'],33:['163'],34:['163'],35:['161','162'],44:['163'],45:['164'],53:['156-01','156-02'],54:['156-01','156-02'],64:['158-01','158-02'],66:['161','162']},
6:{1:['170','171'],2:['173-01'],3:['175'],4:['174'],5:['177'],6:['187'],9:['184-03'],10:['179'],11:['180'],12:['167','186'],13:['166'],14:['185-01'],15:['170','173-01','173-02'],18:['184-01'],19:['184-01'],20:['184-02'],21:['184-01','184-02'],22:['184-02'],23:['184-02'],24:['184-03'],25:['177','184-02'],27:['184-03','165'],29:['185-02'],30:['182'],31:['173-01'],32:['185-01','185-02'],33:['184-04'],36:['188'],37:['188'],38:['188'],39:['188'],41:['177','188'],46:['175'],47:['174','175'],48:['176'],51:['177'],55:['184-01'],57:['184-03'],58:['175','184-01'],60:['184-03'],61:['165'],64:['178'],65:['174','178'],66:['178'],67:['185-01'],69:['165'],70:['165'],73:['179'],74:['181'],75:['182'],76:['182'],77:['167'],78:['183'],79:['184-03','184-04'],80:['186'],81:['166'],85:['172'],86:['168','172'],88:['188'],89:['189'],90:['169']}
}
def ids(text):return list(dict.fromkeys(re.findall(r'E\d{2}',str(text))))
def playable(r):return bool(r['text']) and (r['kind'] in ['台詞','地の文','見出し'] or r['kind']=='UI' and (r['text'].startswith('不正解') or r['text'].startswith('【') and len(r['text'])<40 and '条件' not in r['note']))
def isstop(r):return r['kind']=='台詞' and ('必須未完了' in r['note'] or '必須証拠不足' in r['note'] or '全必須証拠取得済み' in r['note'] or '最後の必須証拠' in r['note'] or '必須完了' in r['note'])
def awardIDs(note):return list(dict.fromkeys(re.findall(r'《(E\d{2})[^》]*》\s*取得',note)))
def locBG(c,text,current):
 if 'BAR' in text:return 66 if any(v in text for v in ['昼','翌日']) else 65
 for word,img in SCENES[c]:
  if word in text:return img
 return current
for c in range(2,7):
 rows={};last='PROLOGUE';bg=65;phone=False
 for i,t in enumerate(w[f'{c:02}_CASE{c:02}全体台本'].values,1):
  if i==1:continue
  last=t[1] or last;ref=re.search(r'参照ID：([^\s]+)',str(t[7] or ''));text=str(t[4] or '').replace('\\n','\n').replace('\\u3000','\u3000');kind=t[2] or ''
  if kind=='見出し' and (text.startswith('DAY') or 'CASE' in text):bg=65;phone=False
  if kind=='見出し' or kind=='UI' and text.startswith('【'):bg=locBG(c,text,bg)
  if kind=='見出し' and ('通話' in text or '電話' in text):phone=True
  if kind=='地の文' and any(x in text for x in ['電話を掛け','電話をかけ','電話を掛けた','へ電話','電話を取り','通話を始め','電話を入れ']):phone=True
  if kind=='見出し' and not any(x in text for x in ['通話','電話','再確認']) and any(x in text for x in ['BAR','自宅','部屋','会場','店','マンション','会議','室']):phone=False
  r={'row':i,'id':ref[1] if ref else f'C{c:02}-ROW-{i}','no':t[0],'section':last,'kind':kind,'speaker':t[3] or '', 'text':text,'note':t[5] or '', 'background':bg}
  r['awards']=awardIDs(r['note']);r['remote']=phone or '『' in text and r['speaker'] not in ['紅','藍','翠']
  if '通話を切' in text or '電話を切' in text:phone=False
  rows[i]=r
 # Show physical references only at their original reveal, never before it.
 if c==2:
  for i in [1741,1785,1834]:rows[i]['displayImages']=['122']
  for i in [246,251]:rows[i]['displayImages']=['123']
 if c==3:
  for i in [365,412,1266]:rows[i]['displayImages']=['127']
 def seq(a,b):return [dict(rows[i]) for i in range(a,b+1) if playable(rows[i]) and not isstop(rows[i]) and not (rows[i]['kind']=='UI' and not rows[i]['text'].startswith('不正解'))]
 # Evidence names and detailed definitions: most recent polished note/memo wins.
 ev={}
 specsheet={2:'10_CASE02確定仕様',3:'21_CASE03確定仕様',4:'24_CASE04確定仕様',5:'26_CASE05確定仕様',6:'28_CASE06確定仕様'}[c]
 for t in spec[specsheet].values:
  if isinstance(t[0],str) and re.fullmatch(r'E\d{2}',t[0]):ev[t[0]]={'id':t[0],'category':str(t[1] or '調査記録'),'name':str(t[2]),'description':str(t[4] or t[2]),'images':[]}
  if t[0] and '証拠' in str(t[0]):
   for k,name in re.findall(r'(E\d{2})\s+([^／\n]+)',str(t[1])):ev.setdefault(k,{'id':k,'category':'調査記録','name':name.strip(),'description':name.strip(),'images':[]})
 for t in w[f'{c:02}_CASE{c:02}本文外メモ'].values:
  text=str(t[2] or '')
  for m in re.finditer(r'《(E\d{2})\s+([^》]+)》取得\s*\n?([^《]*)',text):
   k,name,desc=m.groups();desc=re.split(r'\n(?:必須|補助|条件|表示|演技|既取得|帰還)',desc)[0].strip();ev[k]={'id':k,'category':'調査記録','name':name,'description':desc or name,'images':[]}
 for r in rows.values():
  for k,name in re.findall(r'《(E\d{2})\s+([^》]+)》\s*取得',r['note']):
   ev.setdefault(k,{'id':k,'category':'調査記録','name':name,'description':name,'images':[]});ev[k]['name']=name
 for n,imgs in IMAGES[c].items():
  k=f'E{n:02}';ev.setdefault(k,{'id':k,'name':k,'category':'調査記録','description':k,'images':[]});ev[k]['images']=imgs
 # CASE03 revised script intentionally does not disclose an address.
 if c==3 and 'E27' in ev:ev['E27']['description']='梨沙本人との通話で、現在の生活と母から距離を置く意思を確認した。所在地は開示しない。'
 routes={};starts=[]
 for i,r in rows.items():
  section=re.sub(r'\s+','',r['section']);m=re.fullmatch(r'DAY([12])([紅藍翠](?:→[紅藍翠])?)',section)
  if m and (not starts or starts[-1][1]!=m[2]):starts.append((i,m[2]))
 day3=next(i for i,r in rows.items() if r['section'].startswith('DAY3'))
 for z,(a,key) in enumerate(starts):
  b=starts[z+1][0]-1 if z+1<len(starts) else day3-1
  allr=[rows[i] for i in range(a,b+1)]
  endmark=next((r['row'] for r in allr if isstop(r)),None)
  # Existing ready/blocked lines can be moved into the return control without rewriting.
  blocked=next((r for r in allr if r['kind']=='台詞' and ('未完了' in r['note'] or '不足の場合' in r['note'])),None)
  ready=next((r for r in allr if r['kind']=='台詞' and (('必須完了' in r['note'] and '未完了' not in r['note']) or '全必須証拠取得済み' in r['note'] or '最後の必須' in r['note'])),None)
  if c in [5,6] and ready is None:
   bar=next(r['row'] for r in allr if r['kind']=='見出し' and 'BAR' in r['text'] and r['row']>a+10 and '夜' in r['text'])
   ready=rows[bar-1];endmark=bar-1
  elif ready and not endmark:endmark=ready['row']
  if c==4 and key=='紅':endmark=295;ready=rows[295] # source line: return after reconstruction
  if endmark is None:raise RuntimeError((c,key,'missing return boundary'))
  if ready is None:ready=rows[endmark+1]
  exitstart=ready['row']+1
  # Markers are actual UI items in CASE02/03, and actual scene/investigation headings in CASE04–06.
  if c<=3:markers=[r['row'] for r in allr if r['row']<endmark and r['text'].startswith('▶')]
  else:
   markers=[r['row'] for r in allr if r['row']<endmark and (r['text'].startswith('▶') or r['kind']=='見出し' and r['row']>a+2 and 'BAR' not in r['text'] and not re.match(r'CASE|DAY',r['text']))]
  # Keep intermediate scene headings inside UI point sequences; only split actual selected UI where present.
  if not markers:raise RuntimeError((c,key,'missing points'))
  intro=seq(a,markers[0]-1);points=[]
  for j,start in enumerate(markers):
   end=markers[j+1]-1 if j+1<len(markers) else endmark-1
   chunk=seq(start,end);label=rows[start]['text'].lstrip('▶').strip();label=re.sub(r'^[【]|[】]$','',label)
   # Anything visually marked as a selected item is a caption, not a spoken line.
   if chunk and chunk[0]['row']==start:chunk[0]['kind']='見出し'
   if not chunk:continue
   evs=list(dict.fromkeys(k for r in chunk for k in r['awards']))
   if c<=3:
    evs=[f'E{k:02}' for k in AWARDS[c].get(key,{}).get(start,[])];chunk[-1]['awards']=list(dict.fromkeys(chunk[-1]['awards']+evs))
   if c==4 and key=='紅' and start==285:evs.append('E06');chunk[-1]['awards'].append('E06')
   optional=bool(evs) and all(k in (['E05','E16'] if c==5 else ['E07'] if c==6 else []) for k in evs)
   typ='person' if any(name in label for name in NPC[c]) else 'record' if any(v in label for v in ['記録','映像','書','紙袋','カメラ','資料','ログ','通知','サイト','路線図']) else 'object'
   loc=label if c>=4 else ('佐伯宅・寝室' if c==2 and any(v in label for v in ['クローゼット','寝室','窓','ベッド']) else '佐伯宅・リビング' if c==2 else '梨沙の部屋' if key.endswith('紅') else '調査先')
   pointbg=rows[start]['background']
   if c==2:pointbg=72 if loc.endswith('寝室') else 71
   if c==3 and key.endswith('紅'):pointbg=75 if '洗面' in label else 74 if '恵子' not in label and '真帆' not in label else 67
   if c<=3:
    for r in chunk:
     if c==2:r['background']=pointbg
   # Optionality is refined against explicit requirements below.
   imgs=list(dict.fromkeys(img for k in evs for img in ev.get(k,{}).get('images',[])))
   points.append({'key':f'p{start}','label':label,'rows':chunk,'location':loc,'background':pointbg,'requires':[],'evidence':evs,'images':imgs,'type':typ,'optional':optional,'sourceRange':[start,end]})
  if c<=3:required=[f'E{x:02}' for x in REQ[c][key]]
  else:
   required=list(dict.fromkeys(k for p in points if not p['optional'] for k in p['evidence']))
   # CASE04 route-specific memo is authoritative for return requirements.
   for t in w[f'{c:02}_CASE{c:02}本文外メモ'].values:
    if c==4 and '帰還条件' in str(t[1]) and re.sub(r'\s+','',str(t[1])).startswith('DAY'+('2' if '→' in key else '1')+key) and '必須：' in str(t[2]):required=ids(str(t[2]).split('必須：',1)[1].split('\n',1)[0])
   if c==4 and key=='紅':required=['E01','E02','E03','E04','E06']
  prior=[]
  for p in points:
   # Fixed conversations contain observations made in earlier points: only core points become prerequisites.
   needed=any(e in required for e in p['evidence']) or not p['evidence'] and c>=4 and '整理' not in p['label']
   if c<=3:p['optional']=not any(e in required for e in p['evidence'])
   p['requires']=prior[-1:] if prior else []
   if not p['optional'] and needed:prior.append(p['key'])
  # Dependencies for conclusions include every core earlier point, never optional evidence.
  for j,p in enumerate(points):
   if any(v in p['label'] for v in ['整理','再構成','比較']):p['requires']=[x['key'] for x in points[:j] if not x['optional']]
  introev={k for r in intro for k in r['awards']};provided=introev|{k for p in points for k in p['evidence']}
  missing=set(required)-provided
  if missing:raise RuntimeError((c,key,'required IDs not provided',missing))
  location=points[0]['location'];exitrows=seq(exitstart,b)
  # Decorative next-day caption must not be replayed ahead of the character picker.
  exitrows=[r for r in exitrows if not r['text'].startswith('DAY') or '終了' in r['text']]
  routes[key]={'character':key[-1],'intro':intro,'exit':exitrows,'blocked':blocked,'ready':ready,'points':points,'requiredEvidence':required,'requiredPoints':[p['key'] for p in points if not p['optional'] and ('整理' in p['label'] or '再構成' in p['label'])],'location':location,'sourceRange':[a,b]}
  AUDIT.append({'case':c,'route':key,'range':[a,b],'required':required,'introAwards':sorted(introev),'points':[{'key':p['key'],'label':p['label'],'range':p['sourceRange'],'evidence':p['evidence'],'requires':p['requires'],'optional':p['optional']} for p in points]})
 # Questions: options come from exact prior FIX UI; current script keeps question labels in a single UI row.
 if c==2:
  questions=[{'text':'婚約指輪を持っているのは誰？','options':['健吾','奈々','千夏','美咲'],'correct':3},{'text':'美咲が指輪を手にした理由は？','options':['売るために盗んだ','佐伯への嫌がらせ','偶然見つけて試着した','奈々から預かった'],'correct':2},{'text':'なぜ指輪を戻さなかった？','options':['なくしてしまった','サイズが小さく、抜けなくなった','本当に欲しくなった','佐伯を試していた'],'correct':1},{'text':'婚約指輪は今どこにある？','options':['寝室','奈々のバッグ','美咲の左手','すでに売られている'],'correct':2}]
 else:
  memo=''.join(str(t[2] or '') for t in w[f'{c:02}_CASE{c:02}本文外メモ'].values if t[0]==f'C{c:02}-Q-DATA')
  vals=re.findall(r'旧Excel行\d+／No.[^：]+：([^\n]+)',memo);questions=[];q=None
  for val in vals:
   if re.fullmatch(r'Q\d|QUESTION\s+\d+',val):
    if q:questions.append(q)
    q={'text':'','options':[]}
   elif q and val.startswith('【'):q['options']+=re.findall(r'【([^】]+)】',val)
   elif q and not q['text']:q['text']=val
  if q:questions.append(q)
  correct={3:[1,0,2],4:[3,2,2,2,0],5:[0,1,[0,1],2,1,2],6:[0,2,[0,1,2,3],1,2]}[c]
  if c==6:
   text=''.join(str(t[2]) for t in w[f'{c:02}_CASE{c:02}本文外メモ'].values if t[0]=='C06-Q5-DAY4');questions[-1]={'text':text.split('\n')[1],'options':re.findall(r'【([^】]+)】',text)}
  assert len(questions)==len(correct),(c,questions)
  for q,k in zip(questions,correct):q['correct']=k;q['multi']=isinstance(k,list)
 # Do not expose grade marker headings, only one grade's dialogue and wrong-answer corrections.
 grade_start=next(i for i,r in rows.items() if i>=day3 and r['kind']=='見出し' and r['text']=='PERFECT')
 board=next(i for i,r in rows.items() if i>=day3 and r['kind']=='UI' and r['text'].startswith('推理パート'))
 if c==6:board=939
 verdict={}
 if c==2:
  verdict={'perfect':seq(1730,1749),'goodIntro':seq(1751,1754),'goodQuestions':[seq(a,b) for a,b in [(1756,1761),(1763,1768),(1770,1775),(1777,1781)]],'goodEnd':seq(1782,1787),'badIntro':seq(1789,1796),'badQuestions':[seq(a,b) for a,b in [(1797,1802),(1804,1813),(1815,1821),(1823,1829)]],'badEnd':seq(1830,1836),'cash':[],'truth':seq(1837,1940)+seq(1944,1965)}
 elif c==3:
  verdict={'perfect':seq(1367,1372),'goodIntro':seq(1374,1376),'badIntro':seq(1390,1392),'goodQuestions':[seq(1378,1380),seq(1382,1385),seq(1387,1388)],'badQuestions':[seq(1378,1380),seq(1382,1385),seq(1387,1388)],'goodEnd':[],'badEnd':[],'cash':[],'truth':seq(1393,1422)}
 else:
  bounds={4:(1428,1435,1439,1444,1464,1466,1585),5:(1311,1315,1319,1323,1341,1341,1470),6:(1076,1080,1084,1088,1108,1108,1199)}[c];ps,gs,bs,qs,qe,ts,te=bounds
  qmarks=[i for i in range(qs,qe) if rows[i]['kind']=='見出し' and re.match(r'Q\d',rows[i]['text'])];corrections=[seq(i+1,(qmarks[j+1] if j+1<len(qmarks) else qe)-1) for j,i in enumerate(qmarks)]
  verdict={'perfect':seq(ps+1,gs-1),'goodIntro':seq(gs+1,bs-1),'badIntro':seq(bs+1,qs-1),'goodQuestions':corrections,'badQuestions':corrections,'goodEnd':seq(1464,1465) if c==4 else [],'badEnd':seq(1464,1465) if c==4 else [],'cash':[],'truth':seq(ts,te)}
 for q in questions:q['text']=q['text'].replace('\\u3000','\u3000')
 data={'title':'BAR ECLUNE','case':c,'name':NAMES[c-1],'rows':list(rows.values()),'prologue':seq(2,starts[0][0]-1),'routes':routes,'day2End':[],'day3Intro':seq(day3,board-1),'questions':questions,'evidence':ev,'revisit':c1['revisit'],'verdict':verdict,'npc':NPC[c],'gradingCore':{3:[2],4:[0,1],5:[0,3,4],6:[0,3,4]}.get(c,[])}
 if c==3:data['finalChoice']={'text':rows[1424]['text'],'options':['伝える','伝えない'],'branches':[seq(1443,1460),seq(1430,1441)],'epilogue':seq(1461,1474)}
 if c==6:data['additionalIntro']=seq(941,953);data['additional']=seq(954,1009);data['day4']=seq(1010,1066)
 SERIES[c]=data
(ROOT/'series.js').write_text('window.ECLUNE_CASES = Object.assign({1:window.ECLUNE_DATA},'+json.dumps({k:v for k,v in SERIES.items() if k!=1},ensure_ascii=False,separators=(',',':'))+');\n')
(ROOT/'tools/series-audit.json').write_text(json.dumps({'script':str(SCRIPT),'spec':str(SPEC),'routes':AUDIT,'textRewrites':False},ensure_ascii=False,indent=2))
print('Compiled',len(SERIES),'cases;',sum(len(d['rows']) for d in SERIES.values()),'source rows;',sum(len(d['routes']) for d in SERIES.values()),'routes')
