// Original, editable engineering symbol definitions. Coordinates are drawing units.
const pin = (id,x,y)=>({id,x,y});
const line=(...points)=>({kind:'polyline',points});
const rect=(x,y,w,h)=>({kind:'rect',x,y,w,h});
const circle=(x,y,r)=>({kind:'circle',x,y,r});
const text=(x,y,value,size=11)=>({kind:'text',x,y,value,size});
export const symbols = new Map();
export function registerSymbol(def){if(!def.id||!Array.isArray(def.pins)||!Array.isArray(def.shapes))throw Error('Invalid symbol definition');symbols.set(def.id,structuredClone(def));}
const defs=[
{id:'breaker',name:'Circuit breaker',category:'Protection',prefix:'Q',pins:[pin('1',0,-32),pin('2',0,32)],shapes:[line(0,-32,0,-13),line(0,-13,11,10),line(0,13,0,32),rect(-8,-12,16,24),line(-12,-4,12,-4)],part:'CB-1P-16A',description:'Single-pole protective circuit breaker'},
{id:'fuse',name:'Fuse',category:'Protection',prefix:'F',pins:[pin('1',0,-32),pin('2',0,32)],shapes:[line(0,-32,0,32),rect(-7,-16,14,32)],part:'FU-10A'},
{id:'contact_no',name:'Normally open contact',category:'Switching',prefix:'K',pins:[pin('13',0,-32),pin('14',0,32)],shapes:[line(0,-32,0,-10),line(-11,-10,11,-10),line(-11,10,11,10),line(0,10,0,32)],part:'AUX-1NO'},
{id:'contact_nc',name:'Normally closed contact',category:'Switching',prefix:'K',pins:[pin('21',0,-32),pin('22',0,32)],shapes:[line(0,-32,0,-10),line(-11,-10,11,-10),line(-11,10,11,10),line(-13,17,13,-17),line(0,10,0,32)],part:'AUX-1NC'},
{id:'coil',name:'Relay coil',category:'Switching',prefix:'K',pins:[pin('A1',0,-32),pin('A2',0,32)],shapes:[line(0,-32,0,-14),rect(-18,-14,36,28),line(0,14,0,32)],part:'RE-24DC'},
{id:'contactor',name:'Power contact',category:'Switching',prefix:'K',pins:[pin('1',0,-32),pin('2',0,32)],shapes:[line(0,-32,0,-12),line(0,-12,14,9),line(0,14,0,32),line(-6,14,6,14)],part:'CT-9A'},
{id:'push_no',name:'Pushbutton · NO',category:'Operator devices',prefix:'S',pins:[pin('13',0,-32),pin('14',0,32)],shapes:[line(0,-32,0,-10),line(-10,-10,10,-10),line(-10,10,10,10),line(0,10,0,32),line(-23,-10,-23,10),line(-23,0,-12,0)],part:'PB-GN'},
{id:'push_nc',name:'Pushbutton · NC',category:'Operator devices',prefix:'S',pins:[pin('21',0,-32),pin('22',0,32)],shapes:[line(0,-32,0,-10),line(-10,-10,10,-10),line(-10,10,10,10),line(-12,15,12,-15),line(0,10,0,32),line(-23,-10,-23,10),line(-23,0,-12,0)],part:'PB-RD'},
{id:'lamp',name:'Indicator light',category:'Operator devices',prefix:'H',pins:[pin('X1',0,-32),pin('X2',0,32)],shapes:[circle(0,0,16),line(-11,-11,11,11),line(-11,11,11,-11),line(0,-32,0,-16),line(0,16,0,32)],part:'LED-24GN'},
{id:'motor',name:'Three-phase motor',category:'Machines',prefix:'M',pins:[pin('U1',-20,-40),pin('V1',0,-40),pin('W1',20,-40),pin('PE',40,0)],shapes:[circle(0,0,30),text(0,2,'M',24),text(0,18,'3~',12),line(-20,-40,-20,-23),line(0,-40,0,-30),line(20,-40,20,-23),line(30,0,40,0)],part:'MTR-3P-4KW'},
{id:'terminal',name:'Terminal',category:'Terminals',prefix:'X',pins:[pin('1',0,-20),pin('2',0,20)],shapes:[circle(0,0,5),line(0,-20,0,20),line(-8,-8,8,8)],part:'TB-2.5'},
{id:'ground',name:'Protective earth',category:'Potentials',prefix:'PE',pins:[pin('PE',0,-24)],shapes:[line(0,-24,0,0),line(-16,0,16,0),line(-10,6,10,6),line(-4,12,4,12)],part:''},
{id:'potential',name:'Potential definition',category:'Potentials',prefix:'L',pins:[pin('1',0,0)],shapes:[line(-12,-10,0,0,12,-10),text(0,-18,'↧',14)],part:''},
{id:'plc',name:'PLC I/O module',category:'PLC',prefix:'A',pins:[pin('I0.0',-48,-40),pin('I0.1',-48,-10),pin('I0.2',-48,20),pin('I0.3',-48,50),pin('Q0.0',48,-40),pin('Q0.1',48,-10),pin('L+',0,-72),pin('M',0,72)],shapes:[rect(-36,-60,72,120),text(0,-40,'PLC',16),text(0,-21,'DI / DQ',10),line(-48,-40,-36,-40),line(-48,-10,-36,-10),line(-48,20,-36,20),line(-48,50,-36,50),line(36,-40,48,-40),line(36,-10,48,-10),line(0,-72,0,-60),line(0,60,0,72)],part:'PLC-8DI-8DQ'},
{id:'supply',name:'DC power supply',category:'Power',prefix:'G',pins:[pin('L',-20,-40),pin('N',20,-40),pin('+',-20,40),pin('-',20,40)],shapes:[rect(-40,-28,80,56),line(-40,28,40,-28),text(-19,-5,'~',20),text(19,16,'⎓',20),line(-20,-40,-20,-28),line(20,-40,20,-28),line(-20,28,-20,40),line(20,28,20,40)],part:'PSU-24-5A'},
{id:'transformer',name:'Transformer',category:'Power',prefix:'T',pins:[pin('1',-20,-36),pin('2',20,-36),pin('3',-20,36),pin('4',20,36)],shapes:[circle(0,-12,20),circle(0,12,20),line(-20,-36,-20,-12),line(20,-36,20,-12),line(-20,12,-20,36),line(20,12,20,36)],part:'TR-230-24'},
{id:'resistor',name:'Resistor',category:'Electronics',prefix:'R',pins:[pin('1',0,-32),pin('2',0,32)],shapes:[rect(-7,-18,14,36),line(0,-32,0,-18),line(0,18,0,32)],part:'R-1K'},
{id:'diode',name:'Diode',category:'Electronics',prefix:'V',pins:[pin('A',0,-32),pin('K',0,32)],shapes:[line(0,-32,0,-12),line(-12,-12,12,-12,0,12,-12,-12),line(-12,12,12,12),line(0,12,0,32)],part:'D-1A'},
{id:'capacitor',name:'Capacitor',category:'Electronics',prefix:'C',pins:[pin('1',0,-32),pin('2',0,32)],shapes:[line(0,-32,0,-6),line(-14,-6,14,-6),line(-14,6,14,6),line(0,6,0,32)],part:'C-100UF'},
{id:'connector',name:'Plug connection',category:'Terminals',prefix:'X',pins:[pin('1',0,-24),pin('2',0,24)],shapes:[line(0,-24,0,0),line(-8,-6,-8,8,8,8,8,-6),line(0,8,0,24)],part:'PL-1P'},
{id:'sensor',name:'Proximity sensor',category:'Sensors',prefix:'B',pins:[pin('BN',-16,-32),pin('BU',16,-32),pin('BK',0,32)],shapes:[rect(-24,-20,48,40),text(0,5,'↗',24),line(-16,-32,-16,-20),line(16,-32,16,-20),line(0,20,0,32)],part:'SEN-PNP'},
{id:'junction',name:'Connection junction',category:'Potentials',prefix:'J',pins:[pin('1',0,0)],shapes:[circle(0,0,3)],part:''}
];
defs.forEach(registerSymbol);
export function getSymbol(id){return symbols.get(id);}
export function transformPoint(x,y,entity){const a=(entity.rotation||0)*Math.PI/180;return {x:entity.x+x*Math.cos(a)-y*Math.sin(a),y:entity.y+x*Math.sin(a)+y*Math.cos(a)};}
export function getPins(entity){return (getSymbol(entity.symbol)?.pins||[]).map(p=>({...p,...transformPoint(p.x,p.y,entity),entityId:entity.id}));}
export function symbolBounds(e){const pts=getPins(e); const b=e.symbol==='plc'?76:e.symbol==='motor'?48:48;return {x:e.x-b,y:e.y-b,w:b*2,h:b*2};}
