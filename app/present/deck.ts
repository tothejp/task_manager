// 발표/시연용 소개 자료의 원본 HTML. 앱의 나머지 부분과 스타일이 완전히 분리돼야 해서
// (독자적인 폰트/색상 토큰, 스크롤 스냅 슬라이드) Tailwind/전역 CSS를 타지 않는 완결된
// HTML 문서로 만들고, page.tsx에서 iframe srcDoc으로 그대로 띄운다.
export const deckHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>임무분담표 TaskShare — 소개 자료</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/moonspam/NanumSquare@2.0/nanumsquare.css">
<style>
:root{
  --ink:#0B2A5B;
  --ink-soft:#33507A;
  --accent:#1E8AE2;
  --accent-strong:#0F5798;
  --paper:#F6F8FB;
  --paper-raised:#FFFFFF;
  --steel:#55677E;
  --steel-faint:#DCE3EC;
  --line:#C9D3E0;
  --gold:#9C7A2E;
  --gold-bg:#F3ECDA;
  --danger:#B23A34;
  --danger-bg:#F8E6E4;
  --warn:#9C6A16;
  --warn-bg:#FBEEDA;
  --ok:#1C7A5E;
  --ok-bg:#E3F2EC;
  --radius:14px;
  --font-kr:'NanumSquare','Apple SD Gothic Neo','Malgun Gothic','Segoe UI',sans-serif;
  --font-mono:ui-monospace,'SF Mono','Cascadia Mono','Consolas','Roboto Mono',monospace;
}
@media (prefers-color-scheme: dark){
  :root{
    --ink:#E7EEF8;
    --ink-soft:#AEC1DA;
    --accent:#5FA8EE;
    --accent-strong:#8CC0F4;
    --paper:#0E1826;
    --paper-raised:#152436;
    --steel:#8CA0BA;
    --steel-faint:#25384F;
    --line:#2B4059;
    --gold:#D8B667;
    --gold-bg:#2E2712;
    --danger:#E68E88;
    --danger-bg:#3A1E1C;
    --warn:#E4B562;
    --warn-bg:#382C14;
    --ok:#7FCBAA;
    --ok-bg:#123528;
  }
}
:root[data-theme="dark"]{
  --ink:#E7EEF8;
  --ink-soft:#AEC1DA;
  --accent:#5FA8EE;
  --accent-strong:#8CC0F4;
  --paper:#0E1826;
  --paper-raised:#152436;
  --steel:#8CA0BA;
  --steel-faint:#25384F;
  --line:#2B4059;
  --gold:#D8B667;
  --gold-bg:#2E2712;
  --danger:#E68E88;
  --danger-bg:#3A1E1C;
  --warn:#E4B562;
  --warn-bg:#382C14;
  --ok:#7FCBAA;
  --ok-bg:#123528;
}
:root[data-theme="light"]{
  --ink:#0B2A5B;
  --ink-soft:#33507A;
  --accent:#1E8AE2;
  --accent-strong:#0F5798;
  --paper:#F6F8FB;
  --paper-raised:#FFFFFF;
  --steel:#55677E;
  --steel-faint:#DCE3EC;
  --line:#C9D3E0;
  --gold:#9C7A2E;
  --gold-bg:#F3ECDA;
  --danger:#B23A34;
  --danger-bg:#F8E6E4;
  --warn:#9C6A16;
  --warn-bg:#FBEEDA;
  --ok:#1C7A5E;
  --ok-bg:#E3F2EC;
}
*{box-sizing:border-box;}
html,body{margin:0;padding:0;}
.deck{
  font-family:var(--font-kr);
  color:var(--ink);
  background:var(--paper);
  scroll-snap-type:y proximity;
  overflow-y:auto;
  height:100vh;
  scroll-behavior:smooth;
}
.deck::-webkit-scrollbar{width:0;height:0;}
h1,h2,h3{text-wrap:balance;font-weight:500;margin:0;}
p{margin:0;}
.slide{
  min-height:100vh;
  scroll-snap-align:start;
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:5.5vh 9vw 5.5vh 12vw;
  position:relative;
  border-bottom:0.5px solid var(--line);
}
.eyebrow{
  font-family:var(--font-mono);
  font-size:12px;
  letter-spacing:0.14em;
  text-transform:uppercase;
  color:var(--accent);
  margin-bottom:14px;
  display:flex;
  align-items:center;
  gap:8px;
}
.eyebrow::before{
  content:"";
  width:18px;height:1px;
  background:var(--accent);
  display:inline-block;
}
.h-slide{font-size:clamp(26px,3.6vw,40px);line-height:1.28;letter-spacing:-0.01em;}
.lede{font-size:17px;line-height:1.75;color:var(--ink-soft);max-width:640px;margin-top:16px;}
.mark{display:inline-flex;align-items:center;justify-content:center;}
.mark svg{display:block;}

.cover{justify-content:center;align-items:flex-start;}
.cover .mark{width:64px;height:64px;margin-bottom:28px;}
.cover .title{font-size:clamp(40px,7vw,76px);line-height:1.05;letter-spacing:-0.02em;font-weight:500;}
.cover .title em{font-style:normal;color:var(--accent);}
.cover .sub{font-size:19px;color:var(--ink-soft);margin-top:18px;max-width:560px;line-height:1.7;}
.cover .tags{display:flex;gap:10px;margin-top:34px;flex-wrap:wrap;}
.tag{
  font-family:var(--font-mono);
  font-size:12.5px;
  color:var(--steel);
  border:0.5px solid var(--line);
  border-radius:100px;
  padding:6px 14px;
}
.cover .url{
  margin-top:46px;
  font-family:var(--font-mono);
  font-size:14px;
  color:var(--accent-strong);
  border-top:0.5px solid var(--line);
  padding-top:18px;
  display:flex;
  align-items:baseline;
  gap:10px;
}
.cover .url span{color:var(--steel);font-family:var(--font-kr);font-size:13px;}

.cols{display:grid;grid-template-columns:1fr 1fr;gap:56px;margin-top:34px;align-items:start;}
@media (max-width:900px){.cols{grid-template-columns:1fr;}}

.compare{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-top:36px;border:0.5px solid var(--line);border-radius:var(--radius);overflow:hidden;}
.compare>div{padding:26px 28px;}
.compare .old{background:var(--paper-raised);}
.compare .new{background:var(--paper-raised);border-left:0.5px solid var(--line);}
.compare .label{font-family:var(--font-mono);font-size:11.5px;letter-spacing:0.1em;text-transform:uppercase;color:var(--steel);margin-bottom:14px;}
.compare .new .label{color:var(--accent-strong);}
.compare ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:11px;}
.compare li{font-size:14.5px;line-height:1.6;color:var(--ink-soft);padding-left:16px;position:relative;}
.compare .old li::before{content:"—";position:absolute;left:0;color:var(--steel);}
.compare .new li{color:var(--ink);}
.compare .new li::before{content:"—";position:absolute;left:0;color:var(--accent);}
@media (max-width:900px){.compare{grid-template-columns:1fr;}.compare .new{border-left:none;border-top:0.5px solid var(--line);}}

.values{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:36px;}
@media (max-width:900px){.values{grid-template-columns:1fr;}}
.vcard{background:var(--paper-raised);border:0.5px solid var(--line);border-radius:var(--radius);padding:24px;}
.vcard .num{font-family:var(--font-mono);font-size:13px;color:var(--accent);margin-bottom:14px;}
.vcard h3{font-size:18px;margin-bottom:9px;}
.vcard p{font-size:14px;line-height:1.65;color:var(--ink-soft);}

.roles{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-top:36px;border:0.5px solid var(--line);border-radius:var(--radius);overflow:hidden;}
.roles>div{padding:28px;}
.roles .team{background:var(--paper-raised);}
.roles .admin{background:var(--paper-raised);border-left:0.5px solid var(--line);}
.roles .who{font-size:19px;margin-bottom:4px;}
.roles .platform{font-family:var(--font-mono);font-size:12px;color:var(--accent-strong);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px;}
.roles ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:9px;}
.roles li{font-size:14px;color:var(--ink-soft);line-height:1.6;}
@media (max-width:900px){.roles{grid-template-columns:1fr;}.roles .admin{border-left:none;border-top:0.5px solid var(--line);}}

.fgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:36px;}
@media (max-width:1000px){.fgrid{grid-template-columns:repeat(2,1fr);}}
.fcard{border:0.5px solid var(--line);border-radius:var(--radius);padding:20px;background:var(--paper-raised);}
.fcard .who{font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;color:var(--steel);margin-bottom:10px;}
.fcard h3{font-size:15.5px;margin-bottom:7px;}
.fcard p{font-size:13px;color:var(--ink-soft);line-height:1.55;}

.detail{display:grid;grid-template-columns:0.85fr 1.15fr;gap:52px;margin-top:30px;align-items:center;}
@media (max-width:980px){.detail{grid-template-columns:1fr;}}
.detail ul{margin:22px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:15px;}
.detail li{font-size:14.5px;line-height:1.65;color:var(--ink-soft);padding-left:18px;position:relative;}
.detail li::before{content:"";position:absolute;left:0;top:8px;width:6px;height:6px;background:var(--accent);border-radius:50%;}
.detail li b{color:var(--ink);font-weight:500;}

.phone{
  width:280px;margin:0 auto;
  background:var(--paper-raised);
  border:0.5px solid var(--line);
  border-radius:28px;
  padding:14px;
  box-shadow:0 1px 0 var(--line);
}
.phone .screen{border-radius:16px;background:var(--paper);padding:16px 14px;}
.phone .app-h{font-size:15px;font-weight:500;margin-bottom:12px;}
.phone .mnav{display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--steel);margin-bottom:10px;}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
.cal .d{aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;background:var(--steel-faint);color:var(--ink-soft);}
.cal .avail{background:var(--ok-bg);color:var(--ok);}
.cal .off{background:var(--steel-faint);color:var(--steel);}
.cal .leave{background:var(--warn-bg);color:var(--warn);}
.legend{display:flex;gap:14px;margin-top:14px;flex-wrap:wrap;}
.legend span{font-size:11px;color:var(--steel);display:flex;align-items:center;gap:5px;}
.legend i{width:8px;height:8px;border-radius:2px;display:inline-block;}
.phone .save{margin-top:14px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--ok);}

.board{background:var(--paper-raised);border:0.5px solid var(--line);border-radius:var(--radius);padding:22px;}
.board-h{font-size:14px;font-weight:500;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;color:var(--ink-soft);}
.stats{display:flex;gap:10px;margin-bottom:16px;}
.stat{flex:1;background:var(--paper);border-radius:10px;padding:12px 14px;}
.stat .l{font-size:11px;color:var(--steel);}
.stat .v{font-family:var(--font-mono);font-size:20px;color:var(--ink);margin-top:2px;}
.rtable{width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:18px;}
.rtable th{text-align:left;color:var(--steel);font-weight:400;font-size:11px;padding:6px 8px;border-bottom:0.5px solid var(--line);}
.rtable td{padding:7px 8px;border-bottom:0.5px solid var(--steel-faint);color:var(--ink-soft);}
.rtable td.rank{font-family:var(--font-mono);}
.pill{font-family:var(--font-mono);font-size:10.5px;padding:2px 8px;border-radius:100px;background:var(--ok-bg);color:var(--ok);}
.assign{display:grid;grid-template-columns:110px 1fr;gap:12px;}
.pool{display:flex;flex-direction:column;gap:6px;}
.chip{background:var(--paper);border:0.5px solid var(--line);border-radius:8px;padding:7px 9px;font-size:11.5px;color:var(--ink-soft);}
.slots{display:flex;flex-direction:column;gap:8px;}
.slot{background:var(--paper);border-radius:10px;padding:10px 12px;}
.slot-h{display:flex;justify-content:space-between;align-items:baseline;font-size:12.5px;}
.slot-h .badge{font-family:var(--font-mono);font-size:10px;}
.badge.ok{color:var(--ok);}
.badge.warn{color:var(--warn);}
.slot .req{font-size:11px;color:var(--steel);margin-top:3px;}
.slot .who{margin-top:7px;display:flex;gap:5px;flex-wrap:wrap;}
.who span{background:var(--ink);color:var(--paper-raised);font-size:10.5px;padding:2px 8px;border-radius:100px;}

.triple{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:32px;}
@media (max-width:980px){.triple{grid-template-columns:1fr;}}
.tp{background:var(--paper-raised);border:0.5px solid var(--line);border-radius:var(--radius);padding:20px;}
.tp .cap{font-family:var(--font-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent-strong);margin-bottom:14px;}
.tags-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;}
.tags-row .t{font-size:11px;border:0.5px solid var(--line);border-radius:100px;padding:3px 10px;color:var(--ink-soft);}
.tp .mini-note{font-size:12px;color:var(--steel);line-height:1.6;margin-top:8px;}
.bars{display:flex;align-items:flex-end;gap:8px;height:70px;margin-bottom:10px;}
.bars .b{flex:1;background:var(--accent);border-radius:4px 4px 0 0;position:relative;}
.bars .b.warn{background:var(--warn);}
.autoprev{border:1px dashed var(--accent);border-radius:8px;padding:8px 10px;font-size:11px;color:var(--accent-strong);}

.ptable{width:100%;border-collapse:collapse;margin-top:32px;font-size:14px;}
.ptable th{text-align:left;font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:var(--steel);padding:10px 14px;border-bottom:1px solid var(--line);}
.ptable td{padding:15px 14px;border-bottom:0.5px solid var(--steel-faint);color:var(--ink-soft);vertical-align:top;line-height:1.6;}
.ptable td:first-child{color:var(--ink);}
.stripe{display:inline-flex;align-items:center;gap:7px;font-family:var(--font-mono);font-size:11.5px;padding:3px 10px;border-radius:100px;}
.stripe.block{background:var(--danger-bg);color:var(--danger);}
.stripe.warnp{background:var(--warn-bg);color:var(--warn);}
.stripe.okp{background:var(--ok-bg);color:var(--ok);}

.stackline{display:flex;flex-direction:column;gap:0;margin-top:34px;border-top:0.5px solid var(--line);max-width:640px;}
.srow{display:flex;justify-content:space-between;padding:15px 0;border-bottom:0.5px solid var(--line);font-size:14.5px;}
.srow .k{color:var(--steel);width:140px;flex-shrink:0;}
.srow .v{font-family:var(--font-mono);color:var(--ink);text-align:right;}
.note-box{margin-top:24px;background:var(--paper-raised);border:0.5px solid var(--line);border-left:2px solid var(--accent);border-radius:0 var(--radius) var(--radius) 0;padding:16px 20px;max-width:640px;}
.note-box p{font-size:13.5px;color:var(--ink-soft);line-height:1.7;}

.demo-slide{align-items:flex-start;background:var(--ink);}
.demo-slide .h-slide, .demo-slide .lede, .demo-slide .eyebrow, .demo-slide .steplist li, .demo-slide .demo-url span{color:var(--paper);}
.demo-slide{color:var(--paper);}
.demo-slide .eyebrow{color:var(--accent);}
.demo-slide .eyebrow::before{background:var(--accent);}
.demo-url{margin-top:30px;font-family:var(--font-mono);font-size:20px;color:var(--accent);border:0.5px solid rgba(255,255,255,0.2);border-radius:10px;padding:16px 22px;display:inline-block;}
.steplist{list-style:none;margin:30px 0 0;padding:0;display:flex;flex-direction:column;gap:14px;max-width:520px;}
.steplist li{display:flex;gap:14px;font-size:15px;align-items:baseline;}
.steplist .si{font-family:var(--font-mono);color:var(--accent);font-size:13px;width:20px;flex-shrink:0;}

.road{margin-top:30px;display:flex;flex-direction:column;gap:26px;}
.road-group .gh{font-family:var(--font-mono);font-size:11.5px;text-transform:uppercase;letter-spacing:0.08em;color:var(--steel);margin-bottom:12px;padding-bottom:8px;border-bottom:0.5px solid var(--line);}
.road-group.mine .gh{color:var(--gold);}
.ritems{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
@media (max-width:900px){.ritems{grid-template-columns:1fr;}}
.ritem{display:flex;gap:12px;padding:12px 4px;}
.ritem .dot{width:6px;height:6px;border-radius:50%;background:var(--steel);margin-top:8px;flex-shrink:0;}
.road-group.mine .ritem .dot{background:var(--gold);}
.ritem h4{font-size:14.5px;margin-bottom:4px;}
.ritem p{font-size:12.5px;color:var(--steel);line-height:1.55;}

.closing{align-items:center;text-align:center;}
.closing .h-slide{max-width:640px;}
.closing .mark{width:48px;height:48px;margin-bottom:22px;}

.rail{
  position:fixed;right:22px;top:50%;transform:translateY(-50%);
  display:flex;flex-direction:column;gap:9px;z-index:20;
}
.rail button{
  width:7px;height:7px;border-radius:50%;
  background:var(--line);border:none;padding:0;cursor:pointer;
}
.rail button.active{background:var(--accent);width:9px;height:9px;}
.counter{
  position:fixed;left:22px;bottom:22px;
  font-family:var(--font-mono);font-size:11.5px;color:var(--steel);
  z-index:20;
}
.navbtns{position:fixed;right:22px;bottom:22px;display:flex;gap:8px;z-index:20;}
.navbtns button{
  width:34px;height:34px;border-radius:50%;
  border:0.5px solid var(--line);background:var(--paper-raised);
  color:var(--ink);font-size:14px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
}
.navbtns button:hover{border-color:var(--accent);color:var(--accent);}
.navbtns button:focus-visible, .rail button:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
@media (prefers-reduced-motion:reduce){.deck{scroll-behavior:auto;}}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;}
</style>
</head>
<body>

<h2 class="sr-only">임무분담표(TaskShare) 소개 및 시연을 위한 발표 자료 — 개요, 목적, 주요 기능, 배정 정책, 로드맵을 담은 12개 섹션의 스크롤 프레젠테이션</h2>

<div class="deck" id="deck">

<section class="slide cover" id="s0">
  <span class="mark">
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 4 L58 12 V30 C58 46 47 57 32 60 C17 57 6 46 6 30 V12 Z" stroke="var(--accent)" stroke-width="2.4"/>
      <path d="M16 38 L26 26 L34 34 L48 18" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
  </span>
  <div class="eyebrow">TaskShare · 프로젝트 소개</div>
  <h1 class="title">임무분담표<br><em>누가, 언제, 무엇을</em><br>한눈에.</h1>
  <p class="sub">소규모 조직을 위한 역할 분리형 임무 배정 관리 앱. 팀원은 모바일로 일정을 입력하고, 관리자는 PC에서 가용 인원을 판단해 과업을 배정합니다.</p>
  <div class="tags">
    <span class="tag">5~15인 조직</span>
    <span class="tag">역할 분리 UX</span>
    <span class="tag">규칙 기반 자동배정</span>
    <span class="tag">LLM 미사용</span>
  </div>
  <div class="url">→ <span>라이브 서비스</span> task-manager-rosy-theta.vercel.app</div>
</section>

<section class="slide" id="s1">
  <div class="eyebrow">배경</div>
  <h2 class="h-slide">엑셀과 수기 분담표는<br>부재가 생기는 순간 무너집니다.</h2>
  <p class="lede">휴가·부재가 생길 때마다 표를 손으로 갱신해야 하고, 누구 한 명에게 업무가 몰리고 있는지는 갱신을 거듭할수록 더 알아보기 어려워집니다.</p>
  <div class="compare">
    <div class="old">
      <div class="label">기존 방식</div>
      <ul>
        <li>부재 발생 시 담당자가 표를 직접 찾아 수정</li>
        <li>최신 버전이 어느 파일인지 헷갈림</li>
        <li>누적 업무량은 따로 세어보기 전까진 안 보임</li>
        <li>공유는 캡처나 출력물로 전달</li>
      </ul>
    </div>
    <div class="new">
      <div class="label">TaskShare</div>
      <ul>
        <li>본인이 휴가/휴무를 등록하면 즉시 반영</li>
        <li>모두가 같은 화면을 실시간으로 봄</li>
        <li>구성원별 누적 배정량을 그래프로 상시 확인</li>
        <li>배정은 화면에서 바로, 완료 체크까지 한 곳에서</li>
      </ul>
    </div>
  </div>
</section>

<section class="slide" id="s2">
  <div class="eyebrow">목적</div>
  <h2 class="h-slide">세 가지 원칙 위에 설계했습니다.</h2>
  <div class="values">
    <div class="vcard">
      <div class="num">01 — 역할 분리</div>
      <h3>팀원은 모바일, 관리자는 PC</h3>
      <p>각자가 실제로 쓰는 환경에 맞춰 화면 자체를 다르게 준다. 팀원은 입력·확인만, 관리자는 판단·배정에 집중한다.</p>
    </div>
    <div class="vcard">
      <div class="num">02 — 자동화</div>
      <h3>가용 인원은 계산되는 값</h3>
      <p>휴가·휴무 등록만으로 오늘 누가 가용한지 자동 분류되고, 규칙 기반 추천으로 배정 초안을 즉시 만든다.</p>
    </div>
    <div class="vcard">
      <div class="num">03 — 공정성</div>
      <h3>편중은 그래프로 드러난다</h3>
      <p>누적 배정량을 시각화하고 평균 대비 ±20% 이상 벌어지면 경고해, 업무 쏠림을 눈으로 확인할 수 있게 한다.</p>
    </div>
  </div>
  <div class="roles">
    <div class="team">
      <div class="who">팀원</div>
      <div class="platform">Mobile only</div>
      <ul>
        <li>개인 일정 · 휴가 · 휴무 입력</li>
        <li>배정된 임무 확인 및 완료 체크</li>
      </ul>
    </div>
    <div class="admin">
      <div class="who">관리자</div>
      <div class="platform">PC 전용 배정 · 모바일 조회</div>
      <ul>
        <li>가용인원 판단, 과업 생성, Drag & Drop 배정</li>
        <li>모바일 접속 시에는 조회만 가능</li>
      </ul>
    </div>
  </div>
</section>

<section class="slide" id="s3">
  <div class="eyebrow">주요 기능</div>
  <h2 class="h-slide">한 화면에서, 처음부터 끝까지.</h2>
  <p class="lede">일정 입력부터 배정, 완료 체크까지 별도 문서나 메신저 없이 이 안에서 끝납니다.</p>
  <div class="fgrid">
    <div class="fcard"><div class="who">팀원</div><h3>개인 일정 입력</h3><p>휴가·휴무·근무가능일을 캘린더에서 등록, 승인 절차 없이 즉시 반영.</p></div>
    <div class="fcard"><div class="who">관리자</div><h3>가용인원 대시보드</h3><p>날짜를 고르면 전체 구성원을 가용/휴가/휴무로 자동 분류.</p></div>
    <div class="fcard"><div class="who">관리자</div><h3>능력 태그</h3><p>구성원에게 자격·역량을 부여하고, 보유자만 필터링해 조회.</p></div>
    <div class="fcard"><div class="who">관리자</div><h3>Drag & Drop 배정</h3><p>가용 인원 카드를 과업 슬롯으로 끌어다 놓으면 배정 완료.</p></div>
    <div class="fcard"><div class="who">관리자</div><h3>자동배정</h3><p>능력·가용성·업무량을 고려한 추천을 미리보기 후 일괄 확정.</p></div>
    <div class="fcard"><div class="who">관리자</div><h3>휴가 재배정</h3><p>배정 기간에 휴가가 새로 등록되면 공백으로 표시, 재배정 후보 제시.</p></div>
    <div class="fcard"><div class="who">관리자</div><h3>공정성 지표</h3><p>구성원별 누적 배정량 그래프, 평균 대비 ±20% 편차 경고.</p></div>
    <div class="fcard"><div class="who">팀원</div><h3>완료 체크</h3><p>본인에게 배정된 임무를 확인하고 완료 처리.</p></div>
  </div>
</section>

<section class="slide" id="s4">
  <div class="eyebrow">기능 상세 · 팀원 화면</div>
  <div class="detail">
    <div>
      <h2 class="h-slide">모바일 한 화면으로<br>끝나는 일정 등록</h2>
      <ul>
        <li><b>날짜를 눌러</b> 가용 / 휴가 / 휴무 중 하나를 고르면 저장</li>
        <li>휴가는 <b>기간 지정</b>, 휴무는 <b>매주 반복 등록</b> 지원</li>
        <li>승인 절차 없이 <b>등록 즉시</b> 관리자 화면에 반영</li>
        <li>저장 상태를 <b>버튼 문구로 바로 확인</b> (저장 중 → 저장완료)</li>
      </ul>
    </div>
    <div class="phone">
      <div class="screen">
        <div class="app-h">내 일정</div>
        <div class="mnav"><span>‹ 이전달</span><span>2026-08</span><span>다음달 ›</span></div>
        <div class="cal" id="calGrid"></div>
        <div class="legend">
          <span><i style="background:var(--ok-bg)"></i>가용</span>
          <span><i style="background:var(--warn-bg)"></i>휴가</span>
          <span><i style="background:var(--steel-faint)"></i>휴무</span>
        </div>
        <div class="save">저장완료</div>
      </div>
    </div>
  </div>
</section>

<section class="slide" id="s5">
  <div class="eyebrow">기능 상세 · 관리자 중대현황판</div>
  <div class="detail">
    <div>
      <h2 class="h-slide">가용 인원 판단부터<br>배정까지 한 페이지</h2>
      <ul>
        <li>날짜를 고르면 <b>전체 / 가용 인원</b>이 이름·계급·상태로 정리</li>
        <li>가용 인원 카드를 <b>과업 슬롯으로 드래그</b>하면 즉시 배정</li>
        <li>같은 시간대 <b>중복 배정은 하드 차단</b></li>
        <li>요구인원 <b>"제한없음"</b> 과업은 인원 수 제한 없이 배정</li>
      </ul>
    </div>
    <div class="board">
      <div class="board-h">중대현황판 <span style="font-family:var(--font-mono);font-size:11px;">2026-08-01</span></div>
      <div class="stats">
        <div class="stat"><div class="l">전체 인원</div><div class="v">5명</div></div>
        <div class="stat"><div class="l">가용 인원</div><div class="v">4명</div></div>
      </div>
      <table class="rtable">
        <tr><th>이름</th><th>계급</th><th>상태</th></tr>
        <tr><td>이OO</td><td class="rank">상병</td><td><span class="pill">가용</span></td></tr>
        <tr><td>박OO</td><td class="rank">일병</td><td><span class="pill">가용</span></td></tr>
        <tr><td>김OO</td><td class="rank">병장</td><td><span class="pill">가용</span></td></tr>
      </table>
      <div class="assign">
        <div class="pool">
          <div class="chip">이OO</div>
          <div class="chip">박OO</div>
          <div class="chip">김OO</div>
        </div>
        <div class="slots">
          <div class="slot">
            <div class="slot-h"><span>야간 경계</span><span class="badge ok">배정 완료</span></div>
            <div class="req">요구 2명</div>
            <div class="who"><span>이OO ×</span><span>박OO ×</span></div>
          </div>
          <div class="slot">
            <div class="slot-h"><span>구급 대기</span></div>
            <div class="req">요구 제한없음</div>
            <div class="who"><span>김OO ×</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="slide" id="s6">
  <div class="eyebrow">기능 상세 · 능력 · 자동배정 · 공정성</div>
  <h2 class="h-slide">배정을 돕는 세 가지 장치</h2>
  <div class="triple">
    <div class="tp">
      <div class="cap">능력 태그</div>
      <div class="tags-row">
        <span class="t">지게차운전</span><span class="t">응급처치</span><span class="t">통신정비</span>
      </div>
      <p class="mini-note">태그를 조직원 위로 드래그하면 부여, "제거" 드롭존으로 드래그하면 삭제. 필수 능력 미보유자 배정 시엔 경고 모달 후 관리자 확인으로 진행.</p>
    </div>
    <div class="tp">
      <div class="cap">자동배정</div>
      <div class="autoprev">추천 3건 · 미리보기</div>
      <p class="mini-note">능력·가용성·업무량을 고려해 추천을 계산합니다. 미리보기에서 제외할 항목을 고른 뒤 확정을 눌러야 실제로 반영됩니다.</p>
    </div>
    <div class="tp">
      <div class="cap">공정성 지표</div>
      <div class="bars">
        <div class="b" style="height:55%"></div>
        <div class="b" style="height:64%"></div>
        <div class="b warn" style="height:95%"></div>
        <div class="b" style="height:48%"></div>
      </div>
      <p class="mini-note">구성원별 누적 배정량을 막대그래프로, 평균 대비 ±20% 이상 벌어지면 색으로 경고합니다.</p>
    </div>
  </div>
</section>

<section class="slide" id="s7">
  <div class="eyebrow">배정 정책</div>
  <h2 class="h-slide">차단할 것과, 확인만 받을 것을 구분했습니다.</h2>
  <p class="lede">모든 제약을 강제 차단으로 걸면 관리자가 예외 상황에서 오히려 아무것도 못 하게 됩니다. 그래서 상황별로 대응 수위를 다르게 뒀습니다.</p>
  <table class="ptable">
    <tr><th>상황</th><th>처리 방식</th></tr>
    <tr><td>필수 능력 미보유자 배정 시도</td><td><span class="stripe warnp">경고 모달</span> 확인 후 배정 진행 가능</td></tr>
    <tr><td>동일 인원, 시간 겹치는 과업 중복 배정</td><td><span class="stripe block">하드 차단</span> 시간이 겹치지 않으면 같은 날 복수 배정 허용</td></tr>
    <tr><td>휴가 등록</td><td><span class="stripe okp">즉시 반영</span> 승인 절차 없음</td></tr>
    <tr><td>관리자 모바일 접속</td><td><span class="stripe warnp">조회 전용</span> 배정 · 생성은 PC에서만</td></tr>
  </table>
</section>

<section class="slide" id="s8">
  <div class="eyebrow">기술 스택</div>
  <h2 class="h-slide">가볍게, 그리고 규칙 기반으로.</h2>
  <div class="stackline">
    <div class="srow"><span class="k">Frontend</span><span class="v">Next.js 14 · TypeScript · Tailwind CSS</span></div>
    <div class="srow"><span class="k">Drag & Drop</span><span class="v">dnd-kit</span></div>
    <div class="srow"><span class="k">Backend / DB</span><span class="v">Supabase — PostgreSQL · RLS · Auth</span></div>
    <div class="srow"><span class="k">배포</span><span class="v">Vercel</span></div>
  </div>
  <div class="note-box">
    <p>능력 매칭, 자동배정 추천 정렬은 전부 <b style="color:var(--ink);">명시적인 규칙 기반 로직</b>입니다. 별도 LLM API 호출이 없어 응답이 예측 가능하고, 외부로 나가는 데이터도 없습니다.</p>
  </div>
</section>

<section class="slide demo-slide" id="s9">
  <div class="eyebrow">지금부터는 라이브 데모</div>
  <h2 class="h-slide">실제 화면으로 보여드리겠습니다.</h2>
  <p class="lede">지금까지는 설명, 여기서부터는 실제 서비스입니다.</p>
  <div class="demo-url">task-manager-rosy-theta.vercel.app</div>
  <ol class="steplist">
    <li><span class="si">01</span>팀원 계정으로 로그인 → 모바일 일정 등록</li>
    <li><span class="si">02</span>관리자 계정 전환 → 중대현황판에서 가용 인원 확인</li>
    <li><span class="si">03</span>과업 생성 후 Drag & Drop으로 배정</li>
    <li><span class="si">04</span>자동배정 추천 미리보기 → 확정</li>
    <li><span class="si">05</span>팀원 화면으로 돌아와 완료 체크</li>
  </ol>
</section>

<section class="slide" id="s10">
  <div class="eyebrow">향후 로드맵</div>
  <h2 class="h-slide">다음 단계로 검토 중인 것들</h2>
  <div class="road">
    <div class="road-group">
      <div class="gh">PRD에 이미 명시된 계획</div>
      <div class="ritems">
        <div class="ritem"><span class="dot"></span><div><h4>외부 알림 연동</h4><p>카카오·슬랙으로 배정 결과 자동 발송</p></div></div>
        <div class="ritem"><span class="dot"></span><div><h4>능력 숙련도 등급</h4><p>보유 여부뿐 아니라 상/중/하 수준까지 반영</p></div></div>
        <div class="ritem"><span class="dot"></span><div><h4>멀티팀 지원</h4><p>한 조직 안 여러 팀을 동시에 운영</p></div></div>
        <div class="ritem"><span class="dot"></span><div><h4>임무 템플릿</h4><p>반복되는 배정 패턴을 저장해 재사용</p></div></div>
      </div>
    </div>
    <div class="road-group mine">
      <div class="gh">추가 제안 — 검토해볼 만한 것</div>
      <div class="ritems">
        <div class="ritem"><span class="dot"></span><div><h4>인쇄용 주간/월간 리포트</h4><p>게시판 부착·상급 보고용 출력 화면</p></div></div>
        <div class="ritem"><span class="dot"></span><div><h4>배정 변경 이력 로그</h4><p>누가 언제 무엇을 바꿨는지 추적 가능하게</p></div></div>
        <div class="ritem"><span class="dot"></span><div><h4>완료 시 인수인계 메모</h4><p>완료 체크에 특이사항 한 줄을 남기는 기능</p></div></div>
        <div class="ritem"><span class="dot"></span><div><h4>계급별 업무 강도 가중치</h4><p>공정성 지표를 단순 횟수가 아닌 강도로 계산</p></div></div>
      </div>
    </div>
  </div>
</section>

<section class="slide closing" id="s11">
  <span class="mark">
    <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 4 L58 12 V30 C58 46 47 57 32 60 C17 57 6 46 6 30 V12 Z" stroke="var(--accent)" stroke-width="2.6"/>
      <path d="M16 38 L26 26 L34 34 L48 18" stroke="var(--accent)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
  </span>
  <h2 class="h-slide">임무분담표, 함께 써보시죠.</h2>
  <p class="lede" style="margin-left:auto;margin-right:auto;">질문과 피드백 모두 환영합니다.</p>
  <div class="url" style="margin-top:40px;justify-content:center;">→ <span>라이브 서비스</span> task-manager-rosy-theta.vercel.app</div>
</section>

</div>

<div class="rail" id="rail" role="tablist" aria-label="슬라이드 이동"></div>
<div class="counter" id="counter">01 / 12</div>
<div class="navbtns">
  <button id="prevBtn" aria-label="이전 슬라이드">↑</button>
  <button id="nextBtn" aria-label="다음 슬라이드">↓</button>
</div>

<script>
(function(){
  var calGrid = document.getElementById('calGrid');
  var pattern = ['off','avail','avail','avail','leave','leave','avail','avail','avail','off','avail','avail','leave','avail','off','avail','avail','avail','avail','off','avail','leave','avail','avail','off','avail','avail','avail','off','avail'];
  var html = '';
  for (var i=0;i<31;i++){
    html += '<div class="d '+pattern[i % pattern.length]+'">'+(i+1)+'</div>';
  }
  calGrid.innerHTML = html;

  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var deck = document.getElementById('deck');
  var rail = document.getElementById('rail');
  var counter = document.getElementById('counter');
  var total = slides.length;

  slides.forEach(function(s, i){
    var b = document.createElement('button');
    b.setAttribute('aria-label', '슬라이드 ' + (i+1));
    b.addEventListener('click', function(){ s.scrollIntoView({behavior:'smooth'}); });
    rail.appendChild(b);
  });
  var dots = Array.prototype.slice.call(rail.children);

  function pad(n){ return n < 10 ? '0'+n : ''+n; }

  var currentIdx = 0;

  function setActive(idx){
    currentIdx = idx;
    dots.forEach(function(d,i){ d.classList.toggle('active', i===idx); });
    counter.textContent = pad(idx+1) + ' / ' + pad(total);
  }

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting && entry.intersectionRatio >= 0.55){
        setActive(slides.indexOf(entry.target));
      }
    });
  }, {root: deck, threshold: [0.55]});
  slides.forEach(function(s){ io.observe(s); });
  setActive(0);

  function goTo(delta){
    var next = Math.min(total-1, Math.max(0, currentIdx+delta));
    slides[next].scrollIntoView({behavior:'smooth'});
  }

  document.getElementById('prevBtn').addEventListener('click', function(){ goTo(-1); });
  document.getElementById('nextBtn').addEventListener('click', function(){ goTo(1); });

  deck.setAttribute('tabindex','0');
  deck.addEventListener('keydown', function(e){
    if (['ArrowDown','PageDown',' '].indexOf(e.key) > -1){ e.preventDefault(); goTo(1); }
    if (['ArrowUp','PageUp'].indexOf(e.key) > -1){ e.preventDefault(); goTo(-1); }
  });
  deck.focus();
})();
</script>
</body>
</html>
`;
