import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:4000/api";
async function apiFetch(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const today = () => new Date().toISOString().split("T")[0];
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDur = (m) => m ? `${Math.floor(m/60)}h ${m%60}m` : "—";
const ini = (n="") => n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);

const C = {
  bg:"#07090F", surface:"#0E1117", card:"#13171F", cardH:"#181D27",
  border:"rgba(255,255,255,0.07)", borderHi:"rgba(56,189,248,0.4)",
  teal:"#38BDF8", tealD:"#0EA5E9", tealG:"rgba(56,189,248,0.1)",
  gold:"#FBBF24", goldG:"rgba(251,191,36,0.1)",
  green:"#34D399", red:"#F87171", yellow:"#FBBF24",
  white:"#F1F5F9", muted:"#64748B", mutedHi:"#94A3B8",
};

const injectCSS = () => {
  if (document.getElementById("ri-css2")) return;
  const s = document.createElement("style");
  s.id = "ri-css2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{min-height:100%;background:${C.bg};font-family:'Plus Jakarta Sans',sans-serif;color:${C.white}}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${C.surface}}::-webkit-scrollbar-thumb{background:${C.teal}55;border-radius:4px}
    input,select{font-family:'Plus Jakarta Sans',sans-serif;color:${C.white}}
    input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.6)}
    @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse3{0%,100%{opacity:1}50%{opacity:0.35}}
    @keyframes glowT{0%,100%{box-shadow:0 0 14px rgba(56,189,248,0.25)}50%{box-shadow:0 0 30px rgba(56,189,248,0.55)}}
    .fu{animation:fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both}
    .fi{animation:fadeIn 0.3s ease both}
    .sp{animation:spin 0.9s linear infinite}
    tr:hover td{background:rgba(255,255,255,0.015)}
  `;
  document.head.appendChild(s);
};

// ─── Atoms ───────────────────────────────────────────────────────────────────
const Spin = ({sz=18}) => <div className="sp" style={{width:sz,height:sz,border:`2px solid ${C.border}`,borderTop:`2px solid ${C.teal}`,borderRadius:"50%"}} />;

const Badge = ({label,color=C.teal,dot}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:5,background:`${color}18`,color,border:`1px solid ${color}30`,borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase"}}>
    {dot && <span style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0,animation:"pulse3 2s infinite"}}/>}
    {label}
  </span>
);

const Av = ({name,sz=38,color=C.teal}) => (
  <div style={{width:sz,height:sz,borderRadius:"50%",background:`linear-gradient(135deg,${color}22,${color}44)`,border:`1.5px solid ${color}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:sz*0.33,fontWeight:800,color,flexShrink:0}}>
    {typeof name==="string"?ini(name):name}
  </div>
);

const Btn = ({children,onClick,v="primary",sz="md",loading,disabled,full,style={}}) => {
  const [hov,setHov]=useState(false);
  const vs={
    primary:{bg:hov?C.tealD:C.teal,col:"#07090F",sh:hov?`0 6px 24px rgba(56,189,248,0.35)`:"none"},
    gold:{bg:hov?"#D97706":C.gold,col:"#07090F",sh:hov?`0 6px 24px rgba(251,191,36,0.35)`:"none"},
    ghost:{bg:hov?C.tealG:"transparent",col:C.teal,sh:"none",bdr:`1px solid ${C.border}`},
    danger:{bg:hov?"#DC2626":C.red,col:"#fff",sh:"none"},
    subtle:{bg:hov?C.cardH:C.card,col:C.mutedHi,sh:"none",bdr:`1px solid ${C.border}`},
  };
  const vv=vs[v];
  const pad=sz==="sm"?"7px 14px":sz==="lg"?"13px 32px":"10px 22px";
  return (
    <button onClick={loading||disabled?undefined:onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,background:vv.bg,color:vv.col,border:vv.bdr||"none",borderRadius:10,padding:pad,fontSize:sz==="sm"?12:sz==="lg"?15:13,fontWeight:700,fontFamily:"inherit",cursor:loading||disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,transition:"all 0.18s",boxShadow:vv.sh,width:full?"100%":undefined,...style}}>
      {loading?<Spin sz={14}/>:children}
    </button>
  );
};

const Fld = ({label,value,onChange,type="text",placeholder,required,error,icon,select,options}) => {
  const [foc,setFoc]=useState(false);
  const base={width:"100%",background:C.surface,border:`1.5px solid ${foc?C.teal:error?C.red:C.border}`,borderRadius:10,padding:icon?"11px 14px 11px 40px":"11px 14px",color:C.white,fontSize:14,outline:"none",transition:"border 0.2s,box-shadow 0.2s",boxShadow:foc?`0 0 0 3px ${C.tealG}`:error?`0 0 0 3px rgba(248,113,113,0.1)`:"none",fontFamily:"inherit",background:C.surface};
  return (
    <div style={{marginBottom:18}}>
      {label&&<label style={{display:"block",color:C.mutedHi,fontSize:11,fontWeight:700,marginBottom:6,letterSpacing:"0.07em",textTransform:"uppercase"}}>{label}{required&&<span style={{color:C.red,marginLeft:3}}>*</span>}</label>}
      <div style={{position:"relative"}}>
        {icon&&<span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:15,color:C.muted,pointerEvents:"none"}}>{icon}</span>}
        {select
          ? <select value={value} onChange={e=>onChange(e.target.value)} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)} style={{...base,cursor:"pointer"}}>{options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}</select>
          : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)} style={base}/>}
      </div>
      {error&&<div style={{color:C.red,fontSize:12,marginTop:5}}>{error}</div>}
    </div>
  );
};

const Toast = ({msg,type="success",onClose}) => {
  useEffect(()=>{const t=setTimeout(onClose,3800);return()=>clearTimeout(t)},[onClose]);
  const col=type==="success"?C.green:type==="error"?C.red:C.gold;
  return (
    <div className="fi" style={{position:"fixed",bottom:28,right:28,zIndex:9999,background:C.card,border:`1px solid ${col}35`,borderLeft:`3px solid ${col}`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 40px rgba(0,0,0,0.6)",minWidth:260,maxWidth:360}}>
      <span style={{fontSize:18}}>{type==="success"?"✅":type==="error"?"❌":"⚠️"}</span>
      <span style={{color:C.white,fontSize:13,fontWeight:500,flex:1}}>{msg}</span>
      <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
    </div>
  );
};

const Modal = ({title,onClose,children,width=520}) => (
  <div className="fi" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(5px)"}}
    onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="fu" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:32,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div style={{color:C.white,fontSize:17,fontWeight:800}}>{title}</div>
        <button onClick={onClose} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:C.muted,fontSize:17,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const LiveClock = () => {
  const [t,setT]=useState(new Date());
  useEffect(()=>{const id=setInterval(()=>setT(new Date()),1000);return()=>clearInterval(id)},[]);
  return (
    <div style={{textAlign:"center"}}>
      <div style={{fontFamily:"'Fira Code',monospace",fontSize:50,fontWeight:500,color:C.teal,letterSpacing:"0.04em",lineHeight:1}}>
        {t.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
      </div>
      <div style={{color:C.muted,fontSize:13,marginTop:8,fontWeight:500}}>
        {t.toLocaleDateString("en-IN",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  LOGIN  PAGE
// ══════════════════════════════════════════════════════════════════════════════
const LoginPage = ({onLogin}) => {
  const [tab,setTab]=useState("employee");
  const [empId,setEmpId]=useState("");
  const [empPass,setEmpPass]=useState("");
  const [hrEmail,setHrEmail]=useState("");
  const [hrPass,setHrPass]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const doEmp = async () => {
    setErr("");setLoading(true);
    try { const d=await apiFetch("/auth/employee/login",{method:"POST",body:{employee_id:empId,password:empPass}});onLogin("employee",d.employee,d.token); }
    catch(e){setErr(e.message);}finally{setLoading(false);}
  };
  const doHR = async () => {
    setErr("");setLoading(true);
    try { const d=await apiFetch("/auth/hr/login",{method:"POST",body:{email:hrEmail,password:hrPass}});onLogin("hr",d.hr,d.token); }
    catch(e){setErr(e.message);}finally{setLoading(false);}
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",overflow:"hidden"}}>
      {/* Left panel */}
      <div style={{flex:"0 0 44%",background:`linear-gradient(150deg,#0a1628,#07090F 60%)`,position:"relative",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:60,borderRight:`1px solid ${C.border}`}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${C.teal}07 1px,transparent 1px),linear-gradient(90deg,${C.teal}07 1px,transparent 1px)`,backgroundSize:"48px 48px",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:"18%",left:"25%",width:300,height:300,background:`radial-gradient(circle,${C.teal}14,transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:"12%",right:"8%",width:180,height:180,background:`radial-gradient(circle,${C.gold}0C,transparent 70%)`,pointerEvents:"none"}}/>
        <div className="fu" style={{position:"relative",textAlign:"center"}}>
          <div style={{width:80,height:80,background:`linear-gradient(135deg,${C.teal},${C.tealD})`,borderRadius:22,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:36,marginBottom:26,boxShadow:`0 0 40px ${C.teal}40,0 8px 28px rgba(0,0,0,0.4)`}}>🏢</div>
          <div style={{fontSize:30,fontWeight:800,color:C.white,letterSpacing:"-0.03em",marginBottom:6}}>Ram Infosys</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:48,fontWeight:500}}>Employee Attendance & HR Portal</div>
          {[["⏱️","Real-time Check In / Out"],["📊","Live HR Analytics Dashboard"],["👥","Full Employee Management"],["🔐","MySQL-powered & JWT Secured"]].map(([ic,tx])=>(
            <div key={tx} style={{display:"flex",alignItems:"center",gap:12,marginBottom:13,padding:"11px 16px",background:`${C.teal}07`,border:`1px solid ${C.teal}14`,borderRadius:11,textAlign:"left"}}>
              <span style={{fontSize:17}}>{ic}</span>
              <span style={{color:C.mutedHi,fontSize:13,fontWeight:500}}>{tx}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 60px"}}>
        <div className="fu" style={{width:"100%",maxWidth:400}}>
          <div style={{marginBottom:32}}>
            <div style={{color:C.white,fontSize:26,fontWeight:800,letterSpacing:"-0.03em"}}>Welcome back</div>
            <div style={{color:C.muted,fontSize:13,marginTop:6}}>Sign in to your portal account</div>
          </div>

          {/* Toggle */}
          <div style={{display:"flex",background:C.surface,borderRadius:12,padding:4,marginBottom:30,border:`1px solid ${C.border}`}}>
            {[["employee","👤","Employee"],["hr","🛡️","HR Login"]].map(([v,ic,lb])=>(
              <button key={v} onClick={()=>{setTab(v);setErr("");}}
                style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,transition:"all 0.22s",
                  background:tab===v?(v==="hr"?C.gold:C.teal):"transparent",
                  color:tab===v?"#07090F":C.muted,
                  boxShadow:tab===v?(v==="hr"?`0 4px 18px ${C.gold}45`:`0 4px 18px ${C.teal}40`):"none"}}>
                {ic} {lb}
              </button>
            ))}
          </div>

          {tab==="employee"&&(
            <div key="e">
              <Fld label="Employee ID" value={empId} onChange={setEmpId} placeholder="e.g. EMP001" icon="🪪" required/>
              <Fld label="Password" value={empPass} onChange={setEmpPass} type="password" placeholder="Enter your password" icon="🔒" required/>
              {err&&<div style={{color:C.red,fontSize:13,marginBottom:18,padding:"11px 14px",background:`${C.red}10`,borderRadius:10,border:`1px solid ${C.red}28`}}>⚠️ {err}</div>}
              <Btn onClick={doEmp} sz="lg" full loading={loading}>Sign In to Portal →</Btn>
              <div style={{marginTop:18,padding:"12px 14px",background:C.surface,borderRadius:10,border:`1px solid ${C.border}`}}>
                <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>Demo Credentials</div>
                <div style={{fontFamily:"'Fira Code',monospace",fontSize:12,color:C.teal}}>EMP001–EMP006 · pass@123</div>
              </div>
            </div>
          )}
          {tab==="hr"&&(
            <div key="h">
              <Fld label="HR Email" value={hrEmail} onChange={setHrEmail} type="email" placeholder="hr@raminfosys.in" icon="📧" required/>
              <Fld label="Password" value={hrPass} onChange={setHrPass} type="password" placeholder="HR password" icon="🔒" required/>
              {err&&<div style={{color:C.red,fontSize:13,marginBottom:18,padding:"11px 14px",background:`${C.red}10`,borderRadius:10,border:`1px solid ${C.red}28`}}>⚠️ {err}</div>}
              <Btn onClick={doHR} v="gold" sz="lg" full loading={loading}>Access HR Dashboard →</Btn>
              <div style={{marginTop:18,padding:"12px 14px",background:C.surface,borderRadius:10,border:`1px solid ${C.border}`}}>
                <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>HR Demo Access</div>
                <div style={{fontFamily:"'Fira Code',monospace",fontSize:12,color:C.gold}}>hr@raminfosys.in · hr@Admin2024</div>
              </div>
            </div>
          )}
          <div style={{marginTop:36,textAlign:"center",color:C.muted,fontSize:11}}>© {new Date().getFullYear()} Ram Infosys · All rights reserved</div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  EMPLOYEE PORTAL
// ══════════════════════════════════════════════════════════════════════════════
const EmployeePortal = ({employee,token,onLogout,toast}) => {
  const [rec,setRec]=useState(null);
  const [hist,setHist]=useState([]);
  const [stats,setStats]=useState({present:0,onTime:0,late:0});
  const [loading,setLoading]=useState(false);
  const [rk,setRk]=useState(0);

  useEffect(()=>{
    const load=async()=>{
      try {
        const [r,h]=await Promise.all([apiFetch("/attendance/today",{token}),apiFetch("/attendance/history?limit=30",{token})]);
        setRec(r);setHist(h);
        const p=h.filter(x=>x.check_in).length,ot=h.filter(x=>x.check_in&&new Date(x.check_in).getHours()<10).length;
        setStats({present:p,onTime:ot,late:p-ot});
      }catch{}
    };load();
  },[token,rk]);

  const act=async(action)=>{
    setLoading(true);
    try{await apiFetch(`/attendance/${action}`,{method:"POST",token});toast(`${action==="checkin"?"Checked in":"Checked out"} successfully!`);setRk(k=>k+1);}
    catch(e){toast(e.message,"error");}finally{setLoading(false);}
  };

  const ci=!!rec?.check_in,co=!!rec?.check_out,active=ci&&!co;
  const sc=active?C.green:co?C.muted:C.yellow;
  const sl=active?"In Office":co?"Completed":"Not Checked In";

  const Nav=()=>(
    <nav style={{background:C.surface,borderBottom:`1px solid ${C.border}`,height:60,display:"flex",alignItems:"center",padding:"0 28px",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,background:`linear-gradient(135deg,${C.teal},${C.tealD})`,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏢</div>
        <span style={{color:C.white,fontWeight:800,fontSize:15}}>Ram Infosys</span>
        <span style={{color:C.muted,fontSize:13,marginLeft:2}}>· Employee Portal</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <Badge label={sl} color={sc} dot={active}/>
        <Av name={employee.name} sz={34}/>
        <div><div style={{color:C.white,fontSize:13,fontWeight:700}}>{employee.name}</div><div style={{color:C.muted,fontSize:11}}>{employee.employee_id}</div></div>
        <Btn v="ghost" sz="sm" onClick={onLogout}>Sign Out</Btn>
      </div>
    </nav>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg}}>
      <Nav/>
      <div style={{maxWidth:980,margin:"0 auto",padding:"32px 24px"}}>
        <div className="fu" style={{marginBottom:26}}>
          <div style={{color:C.muted,fontSize:13}}>{new Date().getHours()<12?"Good Morning":new Date().getHours()<17?"Good Afternoon":"Good Evening"},</div>
          <div style={{color:C.white,fontSize:29,fontWeight:800,letterSpacing:"-0.03em"}}>{employee.name} 👋</div>
          <div style={{color:C.muted,fontSize:13,marginTop:4}}>{employee.role} · {employee.department}</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:22}}>
          {[{l:"Days Present",v:stats.present,ic:"📅",c:C.teal},{l:"On Time",v:stats.onTime,ic:"✅",c:C.green},{l:"Late Arrivals",v:stats.late,ic:"🕐",c:C.yellow}].map(s=>(
            <div key={s.l} className="fu" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:7}}>{s.l}</div><div style={{color:s.c,fontSize:38,fontWeight:800,fontFamily:"'Fira Code',monospace"}}>{s.v}</div></div>
              <span style={{fontSize:24}}>{s.ic}</span>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:22}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"34px 22px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:18,animation:"glowT 4s ease-in-out infinite"}}>
            <LiveClock/><Badge label={sl} color={sc} dot={active}/>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22,display:"flex",flexDirection:"column",gap:16}}>
            <div style={{color:C.white,fontWeight:800,fontSize:16}}>Today's Attendance</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{l:"Check In",v:fmtTime(rec?.check_in),c:C.green},{l:"Check Out",v:fmtTime(rec?.check_out),c:C.red}].map(f=>(
                <div key={f.l} style={{background:C.surface,borderRadius:10,padding:"13px",border:`1px solid ${C.border}`}}>
                  <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:5}}>{f.l}</div>
                  <div style={{color:f.v!=="—"?f.c:C.muted,fontFamily:"'Fira Code',monospace",fontSize:16,fontWeight:600}}>{f.v}</div>
                </div>
              ))}
            </div>
            {rec?.duration_minutes&&(
              <div style={{background:`${C.teal}0E`,border:`1px solid ${C.teal}22`,borderRadius:10,padding:"12px",textAlign:"center"}}>
                <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Duration</div>
                <div style={{color:C.teal,fontFamily:"'Fira Code',monospace",fontSize:22,fontWeight:700}}>{fmtDur(rec.duration_minutes)}</div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:9,marginTop:"auto"}}>
              {!ci&&<Btn onClick={()=>act("checkin")} sz="lg" full loading={loading}>✅ Check In</Btn>}
              {active&&<Btn onClick={()=>act("checkout")} v="danger" sz="lg" full loading={loading}>🚪 Check Out</Btn>}
              {co&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"12px",background:C.surface,borderRadius:10}}>✨ Attendance complete for today!</div>}
            </div>
          </div>
        </div>

        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
          <div style={{color:C.white,fontWeight:800,fontSize:16,marginBottom:18}}>Attendance History</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                {["Date","Check In","Check Out","Duration","Status"].map(h=><th key={h} style={{textAlign:"left",color:C.muted,fontSize:11,fontWeight:700,padding:"8px 14px",textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {hist.length===0&&<tr><td colSpan={5} style={{textAlign:"center",color:C.muted,padding:40}}>No records yet.</td></tr>}
                {hist.map((r,i)=>{const late=r.check_in&&new Date(r.check_in).getHours()>=10,act2=r.check_in&&!r.check_out;return(
                  <tr key={i} style={{borderBottom:`1px solid ${C.border}14`}}>
                    <td style={{padding:"12px 14px",color:C.white,fontSize:13,fontWeight:600}}>{fmtDate(r.date)}</td>
                    <td style={{padding:"12px 14px",color:C.green,fontFamily:"'Fira Code',monospace",fontSize:13}}>{fmtTime(r.check_in)}</td>
                    <td style={{padding:"12px 14px",color:C.red,fontFamily:"'Fira Code',monospace",fontSize:13}}>{fmtTime(r.check_out)}</td>
                    <td style={{padding:"12px 14px",color:C.teal,fontFamily:"'Fira Code',monospace",fontSize:13}}>{fmtDur(r.duration_minutes)}</td>
                    <td style={{padding:"12px 14px"}}>{!r.check_in?<Badge label="Absent" color={C.red}/>:act2?<Badge label="Active" color={C.green} dot/>:late?<Badge label="Late" color={C.yellow}/>:<Badge label="On Time" color={C.green}/>}</td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Employee Form Modal ───────────────────────────────────────────────────────
const EmpForm = ({initial,depts,token,onSave,onClose,toast}) => {
  const editing=!!initial;
  const [f,setF]=useState({name:initial?.name||"",email:initial?.email||"",password:"",dept_id:initial?.dept_id||"",role:initial?.role||"Employee",phone:initial?.phone||""});
  const [loading,setLoading]=useState(false);
  const s=k=>v=>setF(p=>({...p,[k]:v}));

  const submit=async()=>{
    if(!f.name||!f.email)return toast("Name & Email required","error");
    if(!editing&&!f.password)return toast("Password required","error");
    setLoading(true);
    try{
      const body={...f,dept_id:f.dept_id||null};
      if(editing&&!f.password)delete body.password;
      if(editing){await apiFetch(`/employees/${initial.id}`,{method:"PUT",body,token});toast("Employee updated!");}
      else{const r=await apiFetch("/employees",{method:"POST",body,token});toast(`Added! ID: ${r.employee_id}`);}
      onSave();
    }catch(e){toast(e.message,"error");}finally{setLoading(false);}
  };

  const deptOpts=[{value:"",label:"Select Department"},...depts.map(d=>({value:d.id,label:d.name}))];

  return (
    <Modal title={editing?`Edit — ${initial.name}`:"Add New Employee"} onClose={onClose}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
        <div style={{gridColumn:"1/-1"}}><Fld label="Full Name" value={f.name} onChange={s("name")} placeholder="Arjun Sharma" required/></div>
        <Fld label="Email" value={f.email} onChange={s("email")} type="email" placeholder="arjun@raminfosys.in" required/>
        <Fld label={editing?"New Password (optional)":"Password"} value={f.password} onChange={s("password")} type="password" placeholder={editing?"Leave blank to keep":"Min 8 chars"} required={!editing}/>
        <Fld label="Department" value={f.dept_id} onChange={s("dept_id")} select options={deptOpts}/>
        <Fld label="Role / Designation" value={f.role} onChange={s("role")} placeholder="Senior Developer"/>
        <div style={{gridColumn:"1/-1"}}><Fld label="Phone" value={f.phone} onChange={s("phone")} placeholder="9876543210"/></div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
        <Btn v="subtle" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit} loading={loading}>{editing?"Save Changes":"Add Employee"}</Btn>
      </div>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  HR DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
const HRDashboard = ({hr,token,onLogout,toast}) => {
  const [view,setView]=useState("today");
  const [stats,setStats]=useState({});
  const [daily,setDaily]=useState([]);
  const [allRec,setAllRec]=useState([]);
  const [emps,setEmps]=useState([]);
  const [depts,setDepts]=useState([]);
  const [loading,setLoading]=useState(false);
  const [search,setSearch]=useState("");
  const [deptF,setDeptF]=useState("All");
  const [dateF,setDateF]=useState(today());
  const [showAdd,setShowAdd]=useState(false);
  const [editEmp,setEditEmp]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [rk,setRk]=useState(0);

  useEffect(()=>{
    const load=async()=>{
      setLoading(true);
      try{
        const [s,d,e,dep]=await Promise.all([
          apiFetch("/attendance/hr/stats",{token}),
          apiFetch(`/attendance/hr/daily?date=${today()}${deptF!=="All"?`&dept=${deptF}`:""}`,{token}),
          apiFetch("/employees",{token}),
          apiFetch("/employees/meta/departments",{token}),
        ]);
        setStats(s);setDaily(d);setEmps(e);setDepts(dep);
      }catch{}finally{setLoading(false);}
    };load();
  },[token,deptF,rk]);

  useEffect(()=>{
    if(view!=="all")return;
    const load=async()=>{
      try{
        const q=new URLSearchParams();
        if(dateF)q.set("date",dateF);
        if(deptF!=="All")q.set("dept",deptF);
        const rows=await apiFetch(`/attendance/hr/all?${q}`,{token});
        setAllRec(rows);
      }catch{}
    };load();
  },[token,view,dateF,deptF,rk]);

  const refresh=()=>setRk(k=>k+1);

  const deact=async(id,name)=>{
    try{await apiFetch(`/employees/${id}`,{method:"DELETE",token});toast(`${name} deactivated.`,"warning");setConfirmDel(null);refresh();}
    catch(e){toast(e.message,"error");}
  };

  const filtEmps=emps.filter(e=>(e.name.toLowerCase().includes(search.toLowerCase())||e.employee_id.toLowerCase().includes(search.toLowerCase()))&&(deptF==="All"||e.department===deptF));
  const deptOpts=["All",...depts.map(d=>d.name)];

  const Kpi=({label,value,icon,color})=>(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div><div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:7}}>{label}</div><div style={{color,fontSize:38,fontWeight:800,fontFamily:"'Fira Code',monospace"}}>{value??0}</div></div>
      <span style={{fontSize:26}}>{icon}</span>
    </div>
  );

  const TH=({children})=><th style={{textAlign:"left",color:C.muted,fontSize:11,fontWeight:700,padding:"11px 16px",textTransform:"uppercase",letterSpacing:"0.06em"}}>{children}</th>;
  const TD=({children,style={}})=><td style={{padding:"12px 16px",...style}}>{children}</td>;

  return (
    <div style={{minHeight:"100vh",background:C.bg}}>
      <nav style={{background:C.surface,borderBottom:`1px solid ${C.border}`,height:60,display:"flex",alignItems:"center",padding:"0 28px",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,background:`linear-gradient(135deg,${C.gold},#D97706)`,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🛡️</div>
          <span style={{color:C.white,fontWeight:800,fontSize:15}}>Ram Infosys</span>
          <span style={{color:C.gold,fontSize:13,marginLeft:2,fontWeight:700}}>· HR Dashboard</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {stats.active_now>0&&<Badge label={`${stats.active_now} active`} color={C.green} dot/>}
          <div style={{color:C.white,fontSize:13,fontWeight:700}}>{hr.full_name}</div>
          <Btn v="ghost" sz="sm" onClick={onLogout}>Sign Out</Btn>
        </div>
      </nav>

      <div style={{maxWidth:1260,margin:"0 auto",padding:"30px 24px"}}>
        <div className="fu" style={{marginBottom:26}}>
          <div style={{color:C.white,fontSize:27,fontWeight:800,letterSpacing:"-0.03em"}}>HR Overview</div>
          <div style={{color:C.muted,fontSize:13,marginTop:3}}>{fmtDate(today())} · Ram Infosys</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:13,marginBottom:26}}>
          <Kpi label="Total Employees" value={stats.total}     icon="👥" color={C.teal}/>
          <Kpi label="Present Today"   value={stats.present}   icon="✅" color={C.green}/>
          <Kpi label="Absent Today"    value={stats.absent}    icon="❌" color={C.red}/>
          <Kpi label="On Time"         value={stats.on_time}   icon="⏰" color={C.green}/>
          <Kpi label="In Office Now"   value={stats.active_now}icon="🟢" color={C.gold}/>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:2,borderBottom:`1px solid ${C.border}`,marginBottom:22}}>
          {[["today","📋 Today"],["all","📊 All Records"],["employees","👥 Employees"]].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)}
              style={{padding:"10px 20px",background:"none",border:"none",borderBottom:`2px solid ${view===v?C.teal:"transparent"}`,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,color:view===v?C.teal:C.muted,marginBottom:-1,transition:"all 0.2s"}}>
              {l}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,minWidth:200}}>
            <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:14}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee…"
              style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px 10px 34px",color:C.white,fontFamily:"inherit",fontSize:13,outline:"none"}}/>
          </div>
          <select value={deptF} onChange={e=>setDeptF(e.target.value)}
            style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontFamily:"inherit",fontSize:13,outline:"none",cursor:"pointer"}}>
            {deptOpts.map(d=><option key={d}>{d}</option>)}
          </select>
          {view==="all"&&(
            <input type="date" value={dateF} onChange={e=>setDateF(e.target.value)}
              style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontFamily:"inherit",fontSize:13,outline:"none"}}/>
          )}
          {view==="employees"&&<Btn onClick={()=>setShowAdd(true)}>＋ Add Employee</Btn>}
        </div>

        {/* TODAY */}
        {view==="today"&&(
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`,background:C.surface}}><TH>Employee</TH><TH>Department</TH><TH>Check In</TH><TH>Check Out</TH><TH>Duration</TH><TH>Status</TH></tr></thead>
              <tbody>
                {loading&&<tr><td colSpan={6} style={{textAlign:"center",padding:40}}><Spin/></td></tr>}
                {!loading&&daily.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())).map((r,i)=>{
                  const late=r.check_in&&new Date(r.check_in).getHours()>=10,ac=r.check_in&&!r.check_out;
                  return(<tr key={i} style={{borderBottom:`1px solid ${C.border}12`}}>
                    <TD><div style={{display:"flex",alignItems:"center",gap:10}}><Av name={r.avatar||r.name} sz={30}/><div><div style={{color:C.white,fontSize:13,fontWeight:700}}>{r.name}</div><div style={{color:C.muted,fontSize:11}}>{r.employee_id}</div></div></div></TD>
                    <TD><span style={{color:C.mutedHi,fontSize:13}}>{r.department||"—"}</span></TD>
                    <TD><span style={{color:C.green,fontFamily:"'Fira Code',monospace",fontSize:13}}>{fmtTime(r.check_in)}</span></TD>
                    <TD><span style={{color:C.red,fontFamily:"'Fira Code',monospace",fontSize:13}}>{fmtTime(r.check_out)}</span></TD>
                    <TD><span style={{color:C.teal,fontFamily:"'Fira Code',monospace",fontSize:13}}>{fmtDur(r.duration_minutes)}</span></TD>
                    <TD>{!r.check_in?<Badge label="Absent" color={C.red}/>:ac?<Badge label="Active" color={C.green} dot/>:late?<Badge label="Late" color={C.yellow}/>:<Badge label="On Time" color={C.green}/>}</TD>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ALL RECORDS */}
        {view==="all"&&(
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`,background:C.surface}}><TH>Employee</TH><TH>Date</TH><TH>Check In</TH><TH>Check Out</TH><TH>Duration</TH><TH>Status</TH></tr></thead>
              <tbody>
                {allRec.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())).slice(0,100).map((r,i)=>{
                  const late=r.check_in&&new Date(r.check_in).getHours()>=10;
                  return(<tr key={i} style={{borderBottom:`1px solid ${C.border}12`}}>
                    <TD><div style={{display:"flex",alignItems:"center",gap:9}}><Av name={r.avatar||r.name} sz={28}/><div><div style={{color:C.white,fontSize:13,fontWeight:600}}>{r.name}</div><div style={{color:C.muted,fontSize:11}}>{r.department}</div></div></div></TD>
                    <TD><span style={{color:C.mutedHi,fontSize:13,fontWeight:600}}>{fmtDate(r.date)}</span></TD>
                    <TD><span style={{color:C.green,fontFamily:"'Fira Code',monospace",fontSize:13}}>{fmtTime(r.check_in)}</span></TD>
                    <TD><span style={{color:C.red,fontFamily:"'Fira Code',monospace",fontSize:13}}>{fmtTime(r.check_out)}</span></TD>
                    <TD><span style={{color:C.teal,fontFamily:"'Fira Code',monospace",fontSize:13}}>{fmtDur(r.duration_minutes)}</span></TD>
                    <TD>{!r.check_in?<Badge label="Absent" color={C.red}/>:late?<Badge label="Late" color={C.yellow}/>:<Badge label="On Time" color={C.green}/>}</TD>
                  </tr>);
                })}
                {allRec.length===0&&<tr><td colSpan={6} style={{textAlign:"center",color:C.muted,padding:48}}>No records found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* EMPLOYEES */}
        {view==="employees"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:15}}>
            {filtEmps.map(emp=>(
              <div key={emp.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,transition:"border-color 0.2s,transform 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.teal+"40";e.currentTarget.style.transform="translateY(-2px)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:11}}>
                    <Av name={emp.avatar||emp.name} sz={42} color={emp.is_active?C.teal:C.muted}/>
                    <div><div style={{color:C.white,fontSize:14,fontWeight:800}}>{emp.name}</div><div style={{color:C.muted,fontSize:11}}>{emp.employee_id} · {emp.department||"No Dept"}</div></div>
                  </div>
                  <Badge label={emp.is_active?"Active":"Inactive"} color={emp.is_active?C.green:C.muted}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
                  {[{l:"Role",v:emp.role},{l:"Phone",v:emp.phone||"—"},{l:"Email",v:emp.email,full:true}].map(f=>(
                    <div key={f.l} style={{gridColumn:f.full?"1/-1":undefined,background:C.surface,borderRadius:8,padding:"9px 11px"}}>
                      <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>{f.l}</div>
                      <div style={{color:C.mutedHi,fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:7}}>
                  <Btn v="ghost" sz="sm" onClick={()=>setEditEmp(emp)} style={{flex:1}}>✏️ Edit</Btn>
                  {emp.is_active&&<Btn v="danger" sz="sm" onClick={()=>setConfirmDel(emp)} style={{flex:1}}>🗑 Deactivate</Btn>}
                </div>
              </div>
            ))}
            {filtEmps.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",color:C.muted,padding:60,fontSize:14}}>No employees found.</div>}
          </div>
        )}
      </div>

      {showAdd&&<EmpForm depts={depts} token={token} onSave={()=>{setShowAdd(false);refresh();}} onClose={()=>setShowAdd(false)} toast={toast}/>}
      {editEmp&&<EmpForm initial={editEmp} depts={depts} token={token} onSave={()=>{setEditEmp(null);refresh();}} onClose={()=>setEditEmp(null)} toast={toast}/>}
      {confirmDel&&(
        <Modal title="Confirm Deactivation" onClose={()=>setConfirmDel(null)} width={400}>
          <div style={{color:C.mutedHi,fontSize:14,marginBottom:22,lineHeight:1.7}}>
            Deactivate <strong style={{color:C.white}}>{confirmDel.name}</strong>? They will lose portal access.
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn v="subtle" onClick={()=>setConfirmDel(null)}>Cancel</Btn>
            <Btn v="danger" onClick={()=>deact(confirmDel.id,confirmDel.name)}>Yes, Deactivate</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  useEffect(()=>{injectCSS();},[]);
  const [session,setSession]=useState(null);
  const [toastD,setToastD]=useState(null);
  const toast=useCallback((msg,type="success")=>setToastD({msg,type,id:Date.now()}),[]);
  return (
    <>
      {!session&&<LoginPage onLogin={(role,user,token)=>setSession({role,user,token})}/>}
      {session?.role==="employee"&&<EmployeePortal employee={session.user} token={session.token} onLogout={()=>setSession(null)} toast={toast}/>}
      {session?.role==="hr"&&<HRDashboard hr={session.user} token={session.token} onLogout={()=>setSession(null)} toast={toast}/>}
      {toastD&&<Toast key={toastD.id} msg={toastD.msg} type={toastD.type} onClose={()=>setToastD(null)}/>}
    </>
  );
}
