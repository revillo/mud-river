(()=>{"use strict";var e,t,n,r,o,i,c,u,a,s,d,_,b,f,l,p,g,w,m,v,h,x,y,E,A,j,S,P,T,k,O,W={479:(e,t,n)=>{n.e(401).then(n.bind(n,401)).then((e=>{window.RAPIER=e,window.dispatchEvent(new Event("RAPIER"))}))}},C={};function N(e){if(C[e])return C[e].exports;var t=C[e]={id:e,loaded:!1,exports:{}};return W[e](t,t.exports,N),t.loaded=!0,t.exports}N.m=W,N.c=C,N.d=(e,t)=>{for(var n in t)N.o(t,n)&&!N.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})},N.f={},N.e=e=>Promise.all(Object.keys(N.f).reduce(((t,n)=>(N.f[n](e,t),t)),[])),N.u=e=>e+".rapier.js",N.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),N.hmd=e=>((e=Object.create(e)).children||(e.children=[]),Object.defineProperty(e,"exports",{enumerable:!0,set:()=>{throw new Error("ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: "+e.id)}}),e),N.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),e={},t="webgame:",N.l=(n,r,o,i)=>{if(e[n])e[n].push(r);else{var c,u;if(void 0!==o)for(var a=document.getElementsByTagName("script"),s=0;s<a.length;s++){var d=a[s];if(d.getAttribute("src")==n||d.getAttribute("data-webpack")==t+o){c=d;break}}c||(u=!0,(c=document.createElement("script")).charset="utf-8",c.timeout=120,N.nc&&c.setAttribute("nonce",N.nc),c.setAttribute("data-webpack",t+o),c.src=n),e[n]=[r];var _=(t,r)=>{c.onerror=c.onload=null,clearTimeout(b);var o=e[n];if(delete e[n],c.parentNode&&c.parentNode.removeChild(c),o&&o.forEach((e=>e(r))),t)return t(r)},b=setTimeout(_.bind(null,void 0,{type:"timeout",target:c}),12e4);c.onerror=_.bind(null,c.onerror),c.onload=_.bind(null,c.onload),u&&document.head.appendChild(c)}},N.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},(()=>{var e;N.g.importScripts&&(e=N.g.location+"");var t=N.g.document;if(!e&&t&&(t.currentScript&&(e=t.currentScript.src),!e)){var n=t.getElementsByTagName("script");n.length&&(e=n[n.length-1].src)}if(!e)throw new Error("Automatic publicPath is not supported in this browser");e=e.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^\/]+$/,"/"),N.p=e})(),(()=>{var e={179:0};N.f.j=(t,n)=>{var r=N.o(e,t)?e[t]:void 0;if(0!==r)if(r)n.push(r[2]);else{var o=new Promise(((n,o)=>{r=e[t]=[n,o]}));n.push(r[2]=o);var i=N.p+N.u(t),c=new Error;N.l(i,(n=>{if(N.o(e,t)&&(0!==(r=e[t])&&(e[t]=void 0),r)){var o=n&&("load"===n.type?"missing":n.type),i=n&&n.target&&n.target.src;c.message="Loading chunk "+t+" failed.\n("+o+": "+i+")",c.name="ChunkLoadError",c.type=o,c.request=i,r[1](c)}}),"chunk-"+t,t)}};var t=(t,n)=>{for(var r,o,[i,c,u]=n,a=0,s=[];a<i.length;a++)o=i[a],N.o(e,o)&&e[o]&&s.push(e[o][0]),e[o]=0;for(r in c)N.o(c,r)&&(N.m[r]=c[r]);for(u&&u(N),t&&t(n);s.length;)s.shift()()},n=self.webpackChunkwebgame=self.webpackChunkwebgame||[];n.forEach(t.bind(null,0)),n.push=t.bind(null,n.push.bind(n))})(),T={},k={519:function(){return{"./rapier_wasm3d_bg.js":{__wbindgen_number_new:function(e){return void 0===n&&(n=N.c[184].exports),n.pT(e)},__wbindgen_object_drop_ref:function(e){return void 0===r&&(r=N.c[184].exports),r.ug(e)},__wbg_rawraycolliderintersection_new:function(e){return void 0===o&&(o=N.c[184].exports),o.Ne(e)},__wbindgen_string_new:function(e,t){return void 0===i&&(i=N.c[184].exports),i.h4(e,t)},__wbg_now_5ae3d18d57dd226f:function(e){return void 0===c&&(c=N.c[184].exports),c.NV(e)},__wbg_get_4bab9404e99a1f85:function(e,t){return void 0===u&&(u=N.c[184].exports),u.xF(e,t)},__wbg_call_ab183a630df3a257:function(e,t){return void 0===a&&(a=N.c[184].exports),a.Kt(e,t)},__wbindgen_object_clone_ref:function(e){return void 0===s&&(s=N.c[184].exports),s.m_(e)},__wbg_newnoargs_ab5e899738c0eff4:function(e,t){return void 0===d&&(d=N.c[184].exports),d.dM(e,t)},__wbg_call_7a2b5e98ac536644:function(e,t,n){return void 0===_&&(_=N.c[184].exports),_.uG(e,t,n)},__wbg_call_d237e9c8a2b68244:function(e,t,n,r,o){return void 0===b&&(b=N.c[184].exports),b.xl(e,t,n,r,o)},__wbg_bind_187525371102ee20:function(e,t,n,r){return void 0===f&&(f=N.c[184].exports),f.AV(e,t,n,r)},__wbg_buffer_bc64154385c04ac4:function(e){return void 0===l&&(l=N.c[184].exports),l.gW(e)},__wbg_self_77eca7b42660e1bb:function(){return void 0===p&&(p=N.c[184].exports),p.U()},__wbg_window_51dac01569f1ba70:function(){return void 0===g&&(g=N.c[184].exports),g.KF()},__wbg_globalThis_34bac2d08ebb9b58:function(){return void 0===w&&(w=N.c[184].exports),w.fe()},__wbg_global_1c436164a66c9c22:function(){return void 0===m&&(m=N.c[184].exports),m.mm()},__wbindgen_is_undefined:function(e){return void 0===v&&(v=N.c[184].exports),v.XP(e)},__wbg_newwithbyteoffsetandlength_3c8748473807c7cf:function(e,t,n){return void 0===h&&(h=N.c[184].exports),h.tT(e,t,n)},__wbg_length_e9f6f145de2fede5:function(e){return void 0===x&&(x=N.c[184].exports),x.FW(e)},__wbg_new_22a33711cf65b661:function(e){return void 0===y&&(y=N.c[184].exports),y.xC(e)},__wbg_set_b29de3f25280c6ec:function(e,t,n){return void 0===E&&(E=N.c[184].exports),E.GD(e,t,n)},__wbindgen_boolean_get:function(e){return void 0===A&&(A=N.c[184].exports),A.HT(e)},__wbindgen_debug_string:function(e,t){return void 0===j&&(j=N.c[184].exports),j.RA(e,t)},__wbindgen_throw:function(e,t){return void 0===S&&(S=N.c[184].exports),S.Or(e,t)},__wbindgen_memory:function(){return void 0===P&&(P=N.c[184].exports),P.oH()}}}}},O={401:[519]},N.w={},N.f.wasm=function(e,t){(O[e]||[]).forEach((function(n,r){var o=T[n];if(o)t.push(o);else{var i,c=k[n](),u=fetch(N.p+""+{401:{519:"817ce2f966d0e64eb99b"}}[e][n]+".module.wasm");i=c instanceof Promise&&"function"==typeof WebAssembly.compileStreaming?Promise.all([WebAssembly.compileStreaming(u),c]).then((function(e){return WebAssembly.instantiate(e[0],e[1])})):"function"==typeof WebAssembly.instantiateStreaming?WebAssembly.instantiateStreaming(u,c):u.then((function(e){return e.arrayBuffer()})).then((function(e){return WebAssembly.instantiate(e,c)})),t.push(T[n]=i.then((function(e){return N.w[n]=(e.instance||e).exports})))}}))},N(479)})();