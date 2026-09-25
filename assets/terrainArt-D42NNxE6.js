import{B as z,G as u1,F as h1,U as y1,C as v,a as u,b as p1}from"./prefs-BxWH-71a.js";const g=42,Dt=g*.55;function bt(e,t=g){const o=t*(Math.sqrt(3)*e.q+Math.sqrt(3)/2*e.r),n=t*(1.5*e.r);return{x:o,y:n}}function C1(e,t,o=g){const n=30-60*t,c=Math.PI/180*n;return{x:e.x+o*Math.cos(c),y:e.y+o*Math.sin(c)}}function V(e,t=g){return Array.from({length:6},(o,n)=>C1(e,n,t))}function W(e){const t=Math.min(Math.max(e,0),1);return t<=.0031308?12.92*t:1.055*Math.pow(t,1/2.4)-.055}function x1(e,t,o){const n=o*Math.PI/180,c=t*Math.cos(n),r=t*Math.sin(n),l=e+.3963377774*c+.2158037573*r,s=e-.1055613458*c-.0638541728*r,a=e-.0894841775*c-1.291485548*r,d=l*l*l,h=s*s*s,p=a*a*a,x=4.0767416621*d-3.3077115913*h+.2309699292*p,f=-1.2684380046*d+2.6097574011*h-.3413193965*p,y=-.0041960863*d-.7034186147*h+1.707614701*p,w=Math.round(W(x)*255),R=Math.round(W(f)*255),O=Math.round(W(y)*255);return Math.min(Math.max(w,0),255)<<16|Math.min(Math.max(R,0),255)<<8|Math.min(Math.max(O,0),255)}function i(e,t,o){return x1(e/100,t,o)}function Pt(e){e.destroy({children:!0,context:!0,style:!0,texture:!0,textureSource:!0})}function Nt(e){e.destroy({children:!0,context:!0,style:!0})}const U=new WeakSet;function w1(e){return U.add(e),e}function g1(e){const t=e.filters;if(t){const o=Array.isArray(t)?t:[t],n=[];for(const c of o){if(!U.has(c)){n.push(c);continue}U.delete(c),c.destroy(!1)}n.length!==o.length&&(e.filters=n)}for(const o of e.children)g1(o)}const $=2.2,A=new z({strength:4*$,quality:3}),m1=new z({strength:9*$,quality:3}),j=new z({strength:2*$,quality:2}),E1=`
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void)
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;

    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void)
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`,O1=`
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;

// This object's own local bounds (pre-filter-padding), in local pixel
// space, so the shader can recover a stable local coordinate from
// vTextureCoord regardless of the filter's padding/output-frame size.
uniform vec2 uLocalOrigin;
uniform vec2 uLocalSize;
// Local px -> "design px" (the coordinate space the mottle frequencies
// below were tuned against, ~150px-scale hex art) so blotch density looks
// right regardless of this engine's actual hex pixel size.
uniform float uDesignScale;

uniform vec3 uDryColor;
uniform vec3 uRockyColor;
uniform float uSeedDry;
uniform float uSeedRocky;
uniform float uSeedGrain;
uniform float uIntensity;

float hash(vec2 p, float seed) {
    return fract(sin(dot(p, vec2(127.1, 311.7)) + seed * 0.017) * 43758.5453123);
}

float gradientDot(vec2 latticePoint, vec2 offset, float seed) {
    float h = hash(latticePoint, seed) * 8.0;
    int gi = int(mod(floor(h), 8.0));
    vec2 g;
    if (gi == 0) g = vec2(1.0, 1.0);
    else if (gi == 1) g = vec2(-1.0, 1.0);
    else if (gi == 2) g = vec2(1.0, -1.0);
    else if (gi == 3) g = vec2(-1.0, -1.0);
    else if (gi == 4) g = vec2(1.0, 0.0);
    else if (gi == 5) g = vec2(-1.0, 0.0);
    else if (gi == 6) g = vec2(0.0, 1.0);
    else g = vec2(0.0, -1.0);
    return dot(g, offset);
}

float fade(float t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float noise2D(vec2 p, float seed) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = vec2(fade(f.x), fade(f.y));

    float n00 = gradientDot(i, f, seed);
    float n10 = gradientDot(i + vec2(1.0, 0.0), f - vec2(1.0, 0.0), seed);
    float n01 = gradientDot(i + vec2(0.0, 1.0), f - vec2(0.0, 1.0), seed);
    float n11 = gradientDot(i + vec2(1.0, 1.0), f - vec2(1.0, 1.0), seed);

    float nx0 = mix(n00, n10, u.x);
    float nx1 = mix(n01, n11, u.x);
    return (mix(nx0, nx1, u.y) + 1.0) / 2.0;
}

float fbm3(vec2 p, float seed) {
    float val = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    float maxAmp = 0.0;
    for (int i = 0; i < 3; i++) {
        val += noise2D(p * freq, seed) * amp;
        maxAmp += amp;
        amp *= 0.5;
        freq *= 2.0;
    }
    return val / maxAmp;
}

void main(void) {
    vec4 src = texture(uTexture, vTextureCoord);
    if (src.a < 0.003) {
        finalColor = src;
        return;
    }
    vec3 base = src.rgb / src.a;

    vec2 localPx = uLocalOrigin + vTextureCoord * uLocalSize;
    vec2 designPx = localPx * uDesignScale;

    // "dry" patch: feTurbulence baseFrequency 0.02, numOctaves 3, alpha
    // thresholded via slope 4 / intercept -1.5, then attenuated to 18% —
    // uIntensity scales all three effect strengths uniformly (1.0 for the
    // original design-handoff caps every existing caller still gets; only
    // gentle hills currently pass higher, see buildHills's own comment).
    float dryN = fbm3(designPx * 0.02, uSeedDry);
    float dryA = clamp(dryN * 4.0 - 1.5, 0.0, 1.0) * 0.18 * uIntensity;
    vec3 color = mix(base, uDryColor, dryA);

    // "rocky" patch: baseFrequency 0.022, slope 4 / intercept -1.55, 18%.
    float rockyN = fbm3(designPx * 0.022, uSeedRocky);
    float rockyA = clamp(rockyN * 4.0 - 1.55, 0.0, 1.0) * 0.18 * uIntensity;
    color = mix(color, uRockyColor, rockyA);

    // fine grain: baseFrequency 0.09, numOctaves 1, neutral tint, 30% cap.
    float grainN = noise2D(designPx * 0.09, uSeedGrain) - 0.5;
    color += grainN * vec3(0.12, 0.09, 0.06) * 0.3 * uIntensity;

    color = clamp(color, 0.0, 1.0);
    finalColor = vec4(color * src.a, src.a);
}
`;function S1(e,t,o,n,c,r=1){const l=u1.from({vertex:E1,fragment:O1,name:"terrain-mottle-filter"}),s=new h1({glProgram:l,resources:{mottleUniforms:new y1({uLocalOrigin:{value:[n.x,n.y],type:"vec2<f32>"},uLocalSize:{value:[n.width,n.height],type:"vec2<f32>"},uDesignScale:{value:c,type:"f32"},uDryColor:{value:e,type:"vec3<f32>"},uRockyColor:{value:t,type:"vec3<f32>"},uSeedDry:{value:o,type:"f32"},uSeedRocky:{value:o+1013,type:"f32"},uSeedGrain:{value:o+7919,type:"f32"},uIntensity:{value:r,type:"f32"}})},padding:8});return w1(s)}const Z={width:6,color:7029795},_={spacing:15,height:8.4,halfWidth:3.5,color:Z.color,outline:4861461},v1=80,F=g/v1;function E(e,t){return{x:(e-150)*F,y:(t-150)*F}}function k(e,t){return{x:e*F,y:t*F}}function C(e){return e*F}function J(e){return e==="M"||e==="C"||e==="L"||e==="Z"}function m(e,t){const o=t.match(/[MCLZ]|-?\d*\.?\d+/g)??[];let n=0;const c=()=>parseFloat(o[n++]),r=()=>E(c(),c());for(;n<o.length;){const l=o[n++];if(l==="M"){const s=r();e.moveTo(s.x,s.y)}else if(l==="C")for(;n<o.length&&!J(o[n]);){const s=r(),a=r(),d=r();e.bezierCurveTo(s.x,s.y,a.x,a.y,d.x,d.y)}else if(l==="L")for(;n<o.length&&!J(o[n]);){const s=r();e.lineTo(s.x,s.y)}else l==="Z"&&e.closePath()}}function Y(e,t,o,n,c,r,l){const s=c*Math.PI/180,a=Math.cos(s),d=Math.sin(s),h=[[e,t],[e+o,t],[e+o,t+n],[e,t+n]],p=[];for(const[x,f]of h){const y=x-r,w=f-l,R=y*a-w*d+r,O=y*d+w*a+l,L=E(R,O);p.push(L.x,L.y)}return p}function Q(e){return e.flatMap(([t,o])=>{const n=E(t,o);return[n.x,n.y]})}function R1(e){const t=new u,o=V({x:0,y:0},g*e);return t.poly(o.flatMap(n=>[n.x,n.y])),t.fill(16777215),t}function P(e,t){const o=new v;t(o);const n=R1(e);return o.addChild(n),o.mask=n,o}const D="M92,188 C68,162 74,124 102,104 C124,88 152,82 180,93 C208,104 226,126 221,155 C217,182 196,202 170,209 C146,215 122,218 104,209 C96,205 96,196 92,188 Z",S=[{fill:i(74,.065,82),path:D,dry:[.84,.77,.64],rocky:[.353,.323,.269],seed:100},{fill:i(70,.068,80),path:"M97.7,181.6 C77.3,159.4 82.4,127.2 106.2,110.2 C124.9,96.6 148.7,91.5 172.5,100.8 C196.3,110.2 211.6,128.8 207.3,153.5 C203.9,176.4 186.1,193.4 164,199.4 C143.6,204.5 123.2,207.1 107.9,199.4 C101.1,196 101.1,188.3 97.7,181.6 Z",dry:[.8,.73,.6],rocky:[.336,.307,.252],seed:120},{fill:i(66,.07,78),path:"M103.4,175.1 C86.6,156.9 90.8,130.3 110.4,116.3 C125.8,105.1 145.4,100.9 165,108.6 C184.6,116.3 197.2,131.7 193.7,152 C190.9,170.9 176.2,184.9 158,189.8 C141.2,194 124.4,196.1 111.8,189.8 C106.2,187 106.2,180.7 103.4,175.1 Z",dry:[.76,.69,.56],rocky:[.319,.29,.235],seed:140},{fill:i(62,.07,77),path:"M108.3,169.5 C94.7,154.7 98.1,133 114,121.6 C126.6,112.5 142.5,109.1 158.5,115.4 C174.5,121.6 184.7,134.2 181.9,150.7 C179.6,166.1 167.6,177.5 152.8,181.5 C139.1,184.9 125.4,186.6 115.2,181.5 C110.6,179.2 110.6,174.1 108.3,169.5 Z",dry:[.72,.65,.52],rocky:[.302,.273,.218],seed:160},{fill:i(58,.07,76),path:"M112.5,164.8 C101.5,152.8 104.2,135.3 117.1,126.1 C127.2,118.8 140.1,116 153,121.1 C165.9,126.1 174.2,136.3 171.9,149.6 C170,162 160.4,171.2 148.4,174.4 C137.4,177.2 126.3,178.6 118,174.4 C114.4,172.6 114.4,168.5 112.5,164.8 Z",dry:[.68,.61,.48],rocky:[.286,.256,.202],seed:180},{fill:i(53,.068,74),path:"M116.3,160.5 C107.7,151.1 109.8,137.4 119.9,130.2 C127.8,124.5 137.9,122.3 148,126.3 C158.1,130.2 164.6,138.2 162.8,148.6 C161.3,158.3 153.8,165.5 144.4,168 C135.8,170.2 127.1,171.3 120.6,168 C117.8,166.6 117.8,163.4 116.3,160.5 Z",dry:[.63,.56,.43],rocky:[.265,.235,.181],seed:200},{fill:i(48,.066,70),path:"M119.4,157 C112.6,149.8 114.3,139.1 122.2,133.5 C128.3,129 136.2,127.4 144,130.4 C151.8,133.5 156.9,139.7 155.5,147.8 C154.4,155.4 148.5,161 141.2,162.9 C134.5,164.6 127.8,165.4 122.7,162.9 C120.5,161.8 120.5,159.3 119.4,157 Z",dry:[.58,.51,.38],rocky:[.244,.214,.16],seed:220},{fill:i(42,.064,66),path:"M122,154 C117,148.6 118.2,140.6 124.1,136.4 C128.7,133 134.6,131.8 140.5,134.1 C146.4,136.4 150.2,141 149.1,147.1 C148.3,152.8 143.9,157 138.4,158.4 C133.4,159.7 128.3,160.3 124.5,158.4 C122.9,157.6 122.9,155.7 122,154 Z",dry:[.52,.45,.32],rocky:[.218,.189,.134],seed:240}],_1=[{fill:S[0].fill,path:D,dry:[.843,.769,.647],rocky:[.431,.353,.275],seed:3},{fill:i(70,.068,80),path:"M107.2,170.8 C92.8,155.2 96.4,132.4 113.2,120.4 C126.4,110.8 143.2,107.2 160,113.8 C176.8,120.4 187.6,133.6 184.6,151 C182.2,167.2 169.6,179.2 154,183.4 C139.6,187 125.2,188.8 114.4,183.4 C109.6,181 109.6,175.6 107.2,170.8 Z",dry:[.8,.73,.6],rocky:[.336,.307,.252],seed:120},{fill:i(66,.07,78),path:"M117.8,158.8 C110.2,150.4 112.1,138.3 121,131.9 C128.1,126.8 137,124.8 146,128.4 C155,131.9 160.7,138.9 159.1,148.2 C157.8,156.8 151.1,163.2 142.8,165.5 C135.1,167.4 127.4,168.4 121.7,165.5 C119.1,164.2 119.1,161.3 117.8,158.8 Z",dry:[.76,.69,.56],rocky:[.319,.29,.235],seed:140}],N=[{fill:i(94,.008,240),path:D,dry:[.97,.97,.98],rocky:[.3,.29,.28],seed:100},{fill:i(90,.012,238),path:S[1].path,dry:[.95,.96,.97],rocky:[.28,.27,.26],seed:120},{fill:i(85,.016,236),path:S[2].path,dry:[.93,.94,.96],rocky:[.26,.25,.24],seed:140},{fill:i(80,.02,234),path:S[3].path,dry:[.91,.92,.95],rocky:[.24,.23,.22],seed:160},{fill:i(74,.024,232),path:S[4].path,dry:[.88,.9,.93],rocky:[.22,.21,.2],seed:180},{fill:i(68,.028,230),path:S[5].path,dry:[.85,.87,.91],rocky:[.2,.19,.18],seed:200},{fill:i(61,.032,228),path:S[6].path,dry:[.82,.84,.89],rocky:[.18,.17,.16],seed:220},{fill:i(53,.036,226),path:S[7].path,dry:[.78,.81,.87],rocky:[.16,.15,.14],seed:240}],L1=[{fill:N[0].fill,path:D,dry:[.97,.97,.98],rocky:[.36,.35,.34],seed:3},{fill:N[1].fill,path:S[1].path,dry:[.95,.96,.97],rocky:[.28,.27,.26],seed:120},{fill:N[2].fill,path:S[2].path,dry:[.93,.94,.96],rocky:[.26,.25,.24],seed:140}];function t1(e,t="default"){const o=new v,n=new u;m(n,D),n.fill({color:0,alpha:.35});const c=k(6,8);n.position.set(c.x,c.y),n.filters=[A],o.addChild(n);const r=4,l=t==="snow"?{steep:N,gentle:L1}:{steep:S,gentle:_1};for(const s of e==="steep"?l.steep:l.gentle){const a=new u;m(a,s.path),a.fill(s.fill);const d=a.getLocalBounds();a.filters=[S1(s.dry,s.rocky,s.seed,{x:d.x,y:d.y,width:d.width,height:d.height},1/F,r)],o.addChild(a)}return o}function M1(e="default"){const t=e==="snow"?[{offset:0,color:i(88,.02,235)},{offset:.6,color:i(64,.035,220)},{offset:1,color:i(38,.045,210)}]:[{offset:0,color:i(58,.1,145)},{offset:.6,color:i(42,.09,150)},{offset:1,color:i(26,.06,155)}];return new p1({type:"radial",center:{x:.32,y:.26},innerRadius:0,outerCenter:{x:.32,y:.26},outerRadius:.85,colorStops:t,textureSpace:"local"})}const T1=[{cx:130,cy:130,r:26},{cx:175,cy:118,r:22},{cx:100,cy:165,r:20},{cx:225,cy:155,r:20},{cx:150,cy:195,r:18},{cx:78,cy:188,r:11,opacity:.75}],A1=[{cx:112,cy:130,r:26},{cx:142,cy:110,r:24},{cx:172,cy:122,r:22},{cx:90,cy:158,r:22},{cx:122,cy:154,r:24},{cx:152,cy:146,r:20},{cx:182,cy:154,r:22},{cx:208,cy:138,r:20},{cx:105,cy:186,r:20},{cx:135,cy:190,r:18},{cx:165,cy:182,r:20},{cx:120,cy:218,r:18},{cx:70,cy:180,r:11,opacity:.75}];function o1(e,t="default"){const o=new v,n=e==="dense"?A1:T1,c=new u;for(const l of n){const s=E(l.cx,l.cy);c.circle(s.x,s.y,C(l.r))}c.fill({color:0,alpha:.35}),c.filters=[A],o.addChild(c);const r=M1(t);for(const l of n){const s=E(l.cx,l.cy),a=new u;a.circle(s.x,s.y,C(l.r)),a.fill(r),l.opacity!==void 0&&(a.alpha=l.opacity),o.addChild(a)}return o}const b=i(62,.015,80),I=i(56,.09,40),T=i(68,.015,90),k1=i(55,.015,75),F1=i(62,.012,75),D1=i(40,.012,70),b1=i(58,.015,76),P1=i(48,.014,74),N1=[{x:106,y:108,w:34,h:24,rot:-4,aboutX:123,aboutY:120,fill:I},{x:146,y:96,w:28,h:30,rot:6,aboutX:160,aboutY:111,fill:T},{x:85,y:138,w:30,h:22,rot:3,aboutX:100,aboutY:149,fill:T},{x:126,y:133,w:26,h:26,rot:-5,aboutX:139,aboutY:146,fill:I},{x:161,y:128,w:24,h:20,rot:4,aboutX:173,aboutY:138,fill:T},{x:190,y:150,w:26,h:20,rot:5,aboutX:203,aboutY:160,fill:T}],I1=[{x:106,y:108,w:34,h:24,rot:-4,aboutX:123,aboutY:120,fill:I},{x:148,y:100,w:28,h:30,rot:6,aboutX:162,aboutY:115,fill:T},{x:90,y:138,w:30,h:22,rot:3,aboutX:105,aboutY:149,fill:T},{x:126,y:133,w:26,h:26,rot:-5,aboutX:139,aboutY:146,fill:I},{x:161,y:128,w:24,h:20,rot:4,aboutX:173,aboutY:138,fill:T},{x:180,y:152,w:26,h:20,rot:5,aboutX:193,aboutY:162,fill:T}],e1="M90.8,126 C95.6,108.4 116.4,98 142,94 C167.6,90 191.6,95.6 204.4,111.6 C217.2,127.6 215.6,150 212.4,167.6 C209.2,185.2 198,198 178.8,204.4 C159.6,210.8 135.6,209.2 116.4,199.6 C97.2,190 86,174 82.8,156.4 C80.4,143.6 86,134 90.8,126 Z",G1=[[100.4,107.6],[111.6,99.6],[124.4,94],[138,90.8],[151.6,89.2],[165.2,90],[178.8,94],[190,100.4]],n1=[[88.6,101.4],[184.6,88.6],[202.2,178.2],[90.2,183]];function K(e){const t=new v,o=1.15;if(e==="fortified"){const s=P(o,p=>{const x=new u;m(x,"M150,150 C145,175 138,195 133,207"),x.stroke({width:C(8),color:b,alpha:.5,cap:"round"}),p.addChild(x)});t.addChild(s);const a=new u;m(a,e1),a.fill({color:0,alpha:.28});const d=k(3,4);a.position.set(d.x,d.y),a.filters=[A],t.addChild(a);const h=new u;m(h,e1),h.stroke({width:C(6),color:k1}),t.addChild(h)}else{const s=P(o,a=>{const d=new u;m(d,"M60,180 C95,192 122,172 160,178 C205,185 235,205 300,212"),d.stroke({width:C(11),color:b,alpha:.55,cap:"round"}),a.addChild(d);const h=new u;m(h,"M150,150 C140,190 128,225 118,258"),h.stroke({width:C(8),color:b,alpha:.5,cap:"round"}),a.addChild(h)});t.addChild(s)}const n=e==="fortified"?I1:N1,c=new u;for(const s of n)c.poly(Y(s.x,s.y,s.w,s.h,s.rot,s.aboutX,s.aboutY));c.fill({color:0,alpha:.4});const r=k(3,4);c.position.set(r.x,r.y),c.filters=[j],t.addChild(c);const l=new u;for(const s of n)l.poly(Y(s.x,s.y,s.w,s.h,s.rot,s.aboutX,s.aboutY)).fill(s.fill);if(t.addChild(l),e==="fortified"){const s=new u;for(const[f,y]of G1){const w=E(f,y);s.rect(w.x,w.y,C(7),C(7))}s.fill(F1).stroke({width:C(1),color:D1}),t.addChild(s);const a=new u;for(const[f,y]of n1){const w=E(f,y);a.roundRect(w.x,w.y,C(14),C(14),C(2))}a.fill({color:0,alpha:.4});const d=k(3,4);a.position.set(d.x,d.y),a.filters=[j],t.addChild(a);const h=new u;for(const[f,y]of n1){const w=E(f,y);h.roundRect(w.x,w.y,C(14),C(14),C(2))}h.fill(b1),t.addChild(h);const p=new u;p.poly(Y(180,194.5,16,13,20,188,201)).fill(P1),t.addChild(p);const x=P(o,f=>{const y=new u;m(y,"M188,201 C215,203 260,207 300,212"),y.stroke({width:C(11),color:b,alpha:.55,cap:"round"}),f.addChild(y)});t.addChild(x)}return t}const H1=i(30,.03,80),W1=i(36,.035,85),Y1=i(26,.035,140),B1=i(19,.03,145),X1=i(58,.13,130),q1=i(26,.045,140),c1=i(52,.02,80),U1={d:"M50,130 C90,120 95,150 130,155 C165,160 160,190 195,195 C230,200 235,175 270,180 C305,185 320,205 355,210",widths:[30,18,7]},Z1={d:"M165,160 C170,190 145,210 155,245 C165,278 145,300 130,330",widths:[24,14,5]},K1=[[138,156,2.5],[143,159,2],[140,163,2.5],[146,154,2]],z1=[[200,127],[212,123],[222,130],[196,140],[221,146],[206,150]],V1=1,B=.5,$1=[[4,-12],[8,-8],[-4,-10]];function j1(e,t,o,n){const c=n*Math.PI/180,r=Math.cos(c),l=Math.sin(c);for(const[s,a]of $1){const d=s*r-a*l,h=s*l+a*r;m(e,`M${t},${o} L${t+d},${o+h}`)}}const J1=[[116,150,0],[185,172,55],[150,197,-55],[172,122,115],[122,188,-110]];function Q1(){const e=new v,t=new u,o=E(180,210);t.ellipse(o.x,o.y,C(140),C(110)),t.fill({color:H1,alpha:.55}),t.filters=[m1],e.addChild(t);const n=P(V1,x=>{for(const f of[U1,Z1]){const[y,w,R]=f.widths,O=new u;m(O,f.d),O.stroke({width:C(y*B),color:W1,alpha:.5,cap:"round",join:"round"}),x.addChild(O);const L=new u;m(L,f.d),L.stroke({width:C(w*B),color:Y1,cap:"round",join:"round"}),x.addChild(L);const M=new u;m(M,f.d),M.stroke({width:C(R*B),color:B1,alpha:.8,cap:"round",join:"round"}),x.addChild(M)}});e.addChild(n);const c=new u;for(const[x,f,y]of K1){const w=E(x,f);c.circle(w.x,w.y,C(y))}c.fill({color:X1,alpha:.85}),e.addChild(c);const r=new u;for(const[x,f,y]of J1)j1(r,x,f,y);r.stroke({width:C(1.5),color:q1,alpha:.8}),e.addChild(r);const l=new u,s=E(216,146);l.ellipse(s.x,s.y,C(10),C(5)),l.fill({color:0,alpha:.4});const a=k(6,7);l.position.set(a.x,a.y),l.filters=[A],e.addChild(l);const d=new u,h=E(210,139);d.circle(h.x,h.y,C(2.5)),d.fill(c1),e.addChild(d);const p=new u;for(const[x,f]of z1)m(p,`M210,139 L${x},${f}`);return p.stroke({width:C(1.3),color:c1}),e.addChild(p),e}const tt=i(34,.015,75),ot=i(50,.06,55),et=i(42,.065,50),nt=i(36,.055,45),ct=i(56,.01,80),st=i(52,.04,100),rt="M112,202 L108,188 M112,202 L114,186",X={cx:86,cy:158,r:4},lt=[{offsets:[[-7,-7],[8,-10],[14,4],[1,11],[-12,4]],shadowOffset:[3,4],fill:ot},{offsets:[[-7,-5],[5,-7],[8,5],[-4,8]],shadowOffset:[3,4],fill:et},{offsets:[[-6,-4],[4,-6],[6,4],[-5,6]],shadowOffset:[2,3],fill:nt}];function at(e,t,o,n,c){const r=n*Math.PI/180,l=Math.cos(r),s=Math.sin(r);return e.offsets.map(([a,d])=>{const h=a*c,p=d*c;return[t+h*l-p*s,o+h*s+p*l]})}const it=[{shape:0,cx:140,cy:160,rot:0,scale:1},{shape:1,cx:160,cy:173,rot:0,scale:1},{shape:2,cx:126,cy:175,rot:0,scale:1},{shape:0,cx:170,cy:140,rot:40,scale:.9},{shape:1,cx:110,cy:145,rot:-30,scale:.85},{shape:2,cx:185,cy:160,rot:70,scale:.8},{shape:0,cx:150,cy:195,rot:-50,scale:.9},{shape:1,cx:120,cy:120,rot:100,scale:.75},{shape:2,cx:175,cy:190,rot:-90,scale:.85}];function dt(){const e=new v,t=new u,o=E(150,165);t.ellipse(o.x,o.y,C(70),C(45)),t.fill({color:tt,alpha:.4}),t.filters=[A],e.addChild(t);for(const l of it){const s=lt[l.shape],a=at(s,l.cx,l.cy,l.rot,l.scale),d=new u;d.poly(Q(a)),d.fill({color:0,alpha:.3});const h=k(s.shadowOffset[0],s.shadowOffset[1]);d.position.set(h.x,h.y),e.addChild(d);const p=new u;p.poly(Q(a)),p.fill(s.fill),e.addChild(p)}const n=new u,c=E(X.cx,X.cy);n.circle(c.x,c.y,C(X.r)),n.fill({color:ct,alpha:.85}),e.addChild(n);const r=new u;return m(r,rt),r.stroke({width:C(1.5),color:st,alpha:.3}),e.addChild(r),e}const ft=1851218;function ut(e){const t=new v,o=new u,n=V({x:0,y:0},g);return o.poly(n.flatMap(c=>[c.x,c.y])),o.fill(e),t.addChild(o),t}function q(e,t,o,n,c){e.moveTo(t,o-n),e.quadraticCurveTo(t+c*.5,o-n*.6,t+c*.38,o-n*.15),e.quadraticCurveTo(t+c*.28,o+n*.05,t+c*.15,o+n*.08),e.quadraticCurveTo(t,o+n*.16,t-c*.15,o+n*.08),e.quadraticCurveTo(t-c*.28,o+n*.05,t-c*.38,o-n*.15),e.quadraticCurveTo(t-c*.5,o-n*.6,t,o-n),e.closePath()}const ht=i(56,.19,38),yt=i(70,.18,55),pt=i(88,.14,90),Ct=i(85,.13,70),xt=i(22,.01,30);function wt(e,t,o,n,c){const r=new u;q(r,t,o,n,c),r.fill({color:ht,alpha:.95}),e.addChild(r);const l=new u;q(l,t,o-n*.06,n*.72,c*.7),l.fill({color:yt,alpha:.95}),e.addChild(l);const s=new u;q(s,t,o-n*.12,n*.4,c*.46),s.fill({color:pt,alpha:.9}),e.addChild(s)}const gt=[{x:-.58,y:.32,h:.62,w:.42},{x:-.22,y:.4,h:.95,w:.5},{x:.16,y:.36,h:1.05,w:.54},{x:.52,y:.3,h:.68,w:.42},{x:-.02,y:.14,h:.55,w:.34}],mt=[[-.4,-.05,2.2],[.05,-.25,1.8],[.35,-.4,2.4],[-.15,-.5,1.6],[.5,-.1,1.9]];function Et(){const e=new v;e.addChild(K("standard"));const t=new v;t.filters=[A];for(const[o,n,c]of[[-.15,-.62,.34],[.28,-.72,.26],[-.4,-.78,.22]]){const r=new u;r.circle(o*g,n*g,c*g),r.fill({color:xt,alpha:.4}),t.addChild(r)}e.addChild(t);for(const o of gt)wt(e,o.x*g,o.y*g,o.h*g,o.w*g);for(const[o,n,c]of mt){const r=new u;r.circle(o*g,n*g,c),r.fill({color:Ct,alpha:.85}),e.addChild(r)}return e}function Ot(){const e=new v,t=V({x:0,y:0},g),o=new u;o.moveTo(t[0].x,t[0].y);for(let l=1;l<t.length;l++)o.lineTo(t[l].x,t[l].y);o.closePath(),o.stroke({width:Z.width,color:Z.color,join:"round"}),e.addChild(o);const n=new u;let c=_.spacing;const r=24;for(let l=0;l<t.length;l++){const s=t[l],a=t[(l+1)%t.length],d=a.x-s.x,h=a.y-s.y,p=Math.hypot(d,h),x=d/p,f=h/p,y=(s.x+a.x)/2,w=(s.y+a.y)/2;let R=-f,O=x;R*y+O*w<0&&(R=-R,O=-O);const L=p/r;for(let M=1;M<=r;M++){if(c+=L,c<_.spacing)continue;c=0;const G=s.x+d*(M/r),H=s.y+h*(M/r),r1=G+R*_.height,l1=H+O*_.height,a1=G-x*_.halfWidth,i1=H-f*_.halfWidth,d1=G+x*_.halfWidth,f1=H+f*_.halfWidth;n.poly([a1,i1,r1,l1,d1,f1]),n.fill(_.color),n.stroke({width:1,color:_.outline})}}return e.addChild(n),e}const s1=i(62,.008,110),St=i(52,.008,110),vt=i(52,.07,130),Rt=i(58,.02,120),_t=i(42,.006,100),Lt=i(74,.006,110),Mt=i(46,.006,110),Tt=[{kind:"cross",x:-.5,y:-.34,s:1},{kind:"grave",x:-.18,y:-.3,s:.95},{kind:"grave",x:.16,y:-.32,s:1},{kind:"cross",x:.5,y:-.32,s:1.05},{kind:"grave",x:-.34,y:.06,s:1},{kind:"cross",x:.06,y:.1,s:1.1},{kind:"grave",x:.42,y:.12,s:.95}];function At(e,t,o,n,c){const r=g,l={x:.02*r,y:.03*r},s=(h,p,x)=>{if(t==="grave"){const f=.058*r*c,y=.082*r*c;h.roundRect(o-f+p,n-y+x,f*2,y*2,f)}else{const f=.03*r*c,y=.1*r*c,w=.062*r*c;h.rect(o-f/2+p,n-y+x,f,y*2),h.rect(o-w+p,n-y*.35+x,w*2,f)}},a=new u;s(a,l.x,l.y),a.fill({color:0,alpha:.28}),e.addChild(a);const d=new u;s(d,0,0),d.fill(Lt),d.stroke({width:Math.max(1,.012*r),color:Mt}),e.addChild(d)}function kt(){const e=new v,t=g,o=.86*t,n=.6*t,c=.1*t,r=.15*t,l=new u;l.rect(-o,-n,o*2,n*2),l.fill({color:Rt,alpha:.32}),e.addChild(l);const s=new u;s.rect(-o-c/2,-n-c/2,o*2+c,n*2+c),s.fill({color:0,alpha:.22}),s.position.set(.03*t,.04*t),s.filters=[A],e.addChild(s);const a=new u;a.rect(-o,-n-c/2,o*2,c),a.rect(-o-c/2,-n,c,n*2),a.rect(o-c/2,-n,c,n*2),a.rect(-o,n-c/2,o-r,c),a.rect(r,n-c/2,o-r,c),a.fill(s1);for(const[f,y]of[[-o,-n],[o,-n],[-o,n],[o,n]])a.rect(f-c*.7,y-c*.7,c*1.4,c*1.4);a.fill(s1),e.addChild(a);const d=new u;for(const[f,y]of[[-o*.4,-n-c/2],[o*.2,-n-c/2],[o*.6,-n-c/2],[-o-c/2,-n*.3],[-o-c/2,n*.5],[o-c/2,n*.1]])d.rect(f-.05*t,y-c*.35,.1*t,c*.7);d.fill({color:St,alpha:.55});for(const[f,y]of[[-o*.7,-n-c/2],[o*.45,-n-c/2],[-o-c/2,n*.1],[o-c/2,-n*.4],[-o*.2,n-c/2]])d.circle(f,y,.03*t);d.fill({color:vt,alpha:.5}),e.addChild(d);const h=new u,p=n-c*.8,x=n+c*.5;for(let f=0;f<5;f++){const y=-r+r*2*f/4;h.rect(y-.012*t,p,.024*t,x-p)}h.rect(-r,p+.01*t,r*2,.022*t),h.rect(-r,x-.032*t,r*2,.022*t),h.fill(_t),e.addChild(h);for(const f of Tt)At(e,f.kind,f.x*t,f.y*t,f.s);return e.scale.set(.855),e}function It(e,t="default"){switch(e){case"gentleHill":return t1("gentle",t);case"difficultHill":return t1("steep",t);case"lightWoodsOrOrchard":return o1("light",t);case"woodsOrForest":return o1("dense",t);case"villageOrLargeFarm":return K("standard");case"walledVillageOrRedoubt":return K("fortified");case"redoubt":return Ot();case"bogOrSwamp":return Q1();case"rough":return dt();case"walledCemetery":return kt();case"ocean":return ut(ft);case"conflagration":return Et();default:return null}}export{Z as F,g as H,Dt as M,bt as a,It as b,C1 as c,g1 as d,Nt as e,_ as f,Pt as g,V as h,w1 as m};
