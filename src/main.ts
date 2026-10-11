import {
  ADMIN_PIN,
  DEFAULT_PRICES,
  DURATION_MONTHS,
  PLAN_INFO,
  STORAGE_KEYS as KEYS,
  type MembershipDuration,
  type MembershipPrices,
  type MembershipType,
} from "./config";
import {
  calculateMembershipFee,
  createMembershipId,
  getMembershipExpiryDate,
  getMembershipStatus,
  toLocalDateString,
} from "./membership";

(() => {
      "use strict";
      const $ = (selector: string, root: ParentNode = document): any => root.querySelector(selector);
      const $$ = (selector: string, root: ParentNode = document): any[] => Array.from(root.querySelectorAll(selector));
      const safeLoad = (key, fallback, validate) => {
        try { const value = JSON.parse(localStorage.getItem(key)); return validate(value) ? value : fallback; }
        catch (error) { console.error("Unable to read saved Forge Fitness data.", error); return fallback; }
      };
      const loadMembers = () => safeLoad(KEYS.members, [], value => Array.isArray(value) && value.every(member => member && typeof member.id === "string"));
      const loadPrices = (): MembershipPrices => safeLoad(KEYS.prices, DEFAULT_PRICES, value => value && Object.keys(DEFAULT_PRICES).every(key => Number.isFinite(value[key]) && value[key] > 0));
      let members: any[] = loadMembers();
      let prices: MembershipPrices = loadPrices();
      let currentMemberId = null;
      let toastTimer;
      const money = amount => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(amount);
      const saveMembers = () => {
        try { localStorage.setItem(KEYS.members, JSON.stringify(members)); return true; }
        catch(error) { console.error("Unable to save member records.",error); showToast("Could not save. Browser storage may be full or disabled.",true); return false; }
      };
      const savePrices = () => {
        try { localStorage.setItem(KEYS.prices, JSON.stringify(prices)); return true; }
        catch(error) { console.error("Unable to save membership prices.",error); showToast("Could not save membership prices.",true); return false; }
      };
      function showToast(message,error=false){
        const toast=$("#toast"); toast.textContent=message; toast.style.borderColor=error?"#783b32":"#536d32"; toast.style.color=error?"#ff9b89":"var(--lime)"; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove("show"),3600);
      }
      function renderPlans(){
        const cards=$("#planCards");
        cards.innerHTML=Object.entries(PLAN_INFO).map(([name,info],index)=>{const type=name as MembershipType;return `<article class="plan-card ${index===1?"featured":""}">${index===1?'<span class="popular">Most popular</span>':""}<span class="plan-label">${name==="Basic"?"Start strong":name==="Standard"?"Find your rhythm":"Go all in"}</span><h3>${name}</h3><div class="plan-price">${money(calculateMembershipFee("Monthly",type,prices))}<span>/ month</span></div><p class="plan-description">${info.description}</p><ul>${info.features.map(feature=>`<li>${feature}</li>`).join("")}</ul><a class="btn ${index===1?"":"btn-outline"}" href="#join" data-plan="${name}">Choose ${name} <span>↗</span></a></article>`;}).join("");
      }
      renderPlans();
      $("#year").textContent=new Date().getFullYear();
      const today=new Date(); const localToday=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
      $("#dob").max=localToday; $("#startDate").min=localToday; $("#startDate").value=localToday;
      function setPage(){
        const page=(location.hash||"#home").slice(1);
        const pages={join:"joinPage",admin:"adminPage"};
        $("#homePage").style.display=pages[page]?"none":"block";
        $$(".page").forEach(item=>item.classList.toggle("active",item.id===pages[page]));
        $("#navLinks").classList.remove("open"); $("#navToggle").setAttribute("aria-expanded","false");
        if(page==="admin") renderDashboard();
        if(pages[page]||page==="home")window.scrollTo(0,0);
      }
      window.addEventListener("hashchange",setPage); setPage();
      $("#navToggle").addEventListener("click",()=>{const open=$("#navLinks").classList.toggle("open");$("#navToggle").setAttribute("aria-expanded",String(open));});
      $("#navLinks").addEventListener("click",event=>{if(event.target.closest("a"))$("#navLinks").classList.remove("open");});
      $("#planCards").addEventListener("click",event=>{const link=event.target.closest("[data-plan]");if(link){sessionStorage.setItem("forgeFitness.selectedType",link.dataset.plan);}});
      const planSelect=$("#membershipPlan"), typeSelect=$("#membershipType");
      function updateFee(){
        const duration=planSelect.value, type=typeSelect.value;
        $("#feeAmount").textContent=duration?money(calculateMembershipFee(duration as MembershipDuration,(type||"Basic") as MembershipType,prices)):"—";
      }
      planSelect.addEventListener("change",updateFee);typeSelect.addEventListener("change",updateFee);
      function membershipDates(startDate,plan){
        return getMembershipExpiryDate(startDate,plan);
      }
      function membershipStatus(member){
        return getMembershipStatus(member);
      }
      function dateString(date){return toLocalDateString(date);}
      function formatDate(value){return new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(`${value}T00:00:00`));}
      function registrationData(form){
        const data=Object.fromEntries(new FormData(form).entries());
        const plan=data.plan as MembershipDuration,type=data.type as MembershipType;
        return {...data,id:createMembershipId(members.map(member=>member.id)),fee:calculateMembershipFee(plan,type,prices),createdAt:new Date().toISOString(),paymentStatus:data.paymentStatus};
      }
      function showConfirmation(member){
        const box=$("#registrationConfirmation");
        box.innerHTML=`<h3>You're in. Welcome to Forge!</h3><p>Your registration is saved on this device. Keep your membership ID for your records.</p><dl><div><dt>Membership ID</dt><dd>${member.id}</dd></div><div><dt>Name</dt><dd>${escapeHTML(member.name)}</dd></div><div><dt>Membership</dt><dd>${escapeHTML(member.type)} · ${escapeHTML(member.plan)}</dd></div><div><dt>Membership fee</dt><dd>${money(member.fee)}</dd></div><div><dt>Start date</dt><dd>${formatDate(member.startDate)}</dd></div><div><dt>Expires</dt><dd>${formatDate(dateString(membershipDates(member.startDate,member.plan)))}</dd></div><div><dt>Payment status</dt><dd>${escapeHTML(member.paymentStatus)}</dd></div></dl><button class="btn btn-outline btn-small" type="button" id="confirmationPrint">Print receipt</button>`;
        box.classList.add("show");$("#confirmationPrint").addEventListener("click",()=>printReceipt(member));
      }
      function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));}
      $("#registrationForm").addEventListener("submit",event=>{
        event.preventDefault();const form=event.currentTarget,error=$("#registrationError");
        error.classList.remove("show");error.classList.remove("form-error");
        const phone=form.elements.phone;
        const digits=phone.value.replace(/\D/g,"");
        if(digits.length<10||digits.length>15){error.textContent="Enter a valid phone number containing 10–15 digits.";error.classList.add("show","form-error");phone.focus();return;}
        if(form.elements.emergency.value){const emergencyDigits=form.elements.emergency.value.replace(/\D/g,"");if(emergencyDigits.length<10||emergencyDigits.length>15){error.textContent="Enter a valid emergency contact containing 10–15 digits.";error.classList.add("show","form-error");form.elements.emergency.focus();return;}}
        if(!form.reportValidity())return;
        const email=form.elements.email.value.trim().toLowerCase();
        const duplicate=members.find(member=>member.email.toLowerCase()===email||member.phone.replace(/\D/g,"")===digits);
        if(duplicate){error.textContent=`A membership already exists for this phone number or email (ID: ${duplicate.id}). Please contact staff to update or renew it.`;error.classList.add("show","form-error");return;}
        const submit=$("#registerButton");submit.disabled=true;submit.classList.add("loading");submit.querySelector(".button-text").textContent="Saving membership…";
        setTimeout(()=>{
          const member=registrationData(form);
          members.push(member);
          if(saveMembers()){showConfirmation(member);form.reset();$("#startDate").value=localToday;updateFee();$("#registrationConfirmation").scrollIntoView({behavior:"smooth",block:"center"});}
          else members=loadMembers();
          submit.disabled=false;submit.classList.remove("loading");submit.querySelector(".button-text").textContent="Register membership →";
        },180);
      });
      $("#membershipType").value=sessionStorage.getItem("forgeFitness.selectedType")||"";
      sessionStorage.removeItem("forgeFitness.selectedType");updateFee();
      function closeModal(id){$(id).classList.remove("open");document.body.classList.remove("locked");}
      function openModal(id){$(id).classList.add("open");document.body.classList.add("locked");const first=$("input",$(id));if(first)setTimeout(()=>first.focus(),0);}
      $("#adminSignIn").addEventListener("click",()=>{ $("#loginError").classList.remove("show");$("#adminPin").value="";openModal("#loginModal");});
      $("#cancelLogin").addEventListener("click",()=>closeModal("#loginModal"));
      $("#loginModal").addEventListener("click",event=>{if(event.target.id==="loginModal")closeModal("#loginModal");});
      $("#loginForm").addEventListener("submit",event=>{
        event.preventDefault();
        if($("#adminPin").value!==ADMIN_PIN){$("#loginError").textContent="That PIN didn't match. Try again.";$("#loginError").classList.add("show");$("#adminPin").select();return;}
        try{sessionStorage.setItem(KEYS.admin,"true");}catch(error){console.error("Unable to save staff session.",error);}
        closeModal("#loginModal");renderDashboard();
      });
      $("#adminSignOut").addEventListener("click",()=>{sessionStorage.removeItem(KEYS.admin);renderDashboard();});
      function renderDashboard(){
        const unlocked=sessionStorage.getItem(KEYS.admin)==="true";
        $("#adminAccess").hidden=unlocked;$("#dashboard").hidden=!unlocked;
        if(!unlocked)return;
        members=loadMembers();prices=loadPrices();
        const statuses=members.map(membershipStatus);
        $("#totalStat").textContent=members.length;
        $("#activeStat").textContent=statuses.filter(status=>status==="active").length;
        $("#pendingStat").textContent=members.filter(member=>member.paymentStatus==="Pending").length;
        $("#revenueStat").textContent=money(members.filter(member=>member.paymentStatus==="Paid").reduce((sum,member)=>sum+Number(member.fee||0),0));
        drawMemberRows();
      }
      function drawMemberRows(){
        const query=$("#searchMembers").value.trim().toLowerCase(),plan=$("#filterPlan").value,payment=$("#filterPayment").value,status=$("#filterStatus").value;
        const filtered=members.filter(member=>(!query||member.name.toLowerCase().includes(query)||member.phone.toLowerCase().includes(query))&&(!plan||member.plan===plan)&&(!payment||member.paymentStatus===payment)&&(!status||membershipStatus(member)===status)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
        $("#emptyMembers").hidden=filtered.length>0;
        $("#memberRows").innerHTML=filtered.map(member=>{
          const expiry=dateString(membershipDates(member.startDate,member.plan)),state=membershipStatus(member);
          return `<tr><td><strong>${escapeHTML(member.name)}</strong><small>${escapeHTML(member.id)}</small></td><td>${escapeHTML(member.phone)}</td><td>${escapeHTML(member.email)}</td><td>${escapeHTML(member.type)}<small>${escapeHTML(member.plan)} · ${money(member.fee)}</small></td><td>${formatDate(member.startDate)}</td><td>${formatDate(expiry)}</td><td><span class="badge badge-${member.paymentStatus.toLowerCase()}">${escapeHTML(member.paymentStatus)}</span></td><td><span class="badge badge-${state}">${state}</span></td><td><div class="table-actions"><button class="text-btn" data-action="view" data-id="${escapeHTML(member.id)}">View</button><button class="text-btn" data-action="edit" data-id="${escapeHTML(member.id)}">Edit</button><button class="text-btn" data-action="renew" data-id="${escapeHTML(member.id)}">Renew</button><button class="text-btn danger" data-action="delete" data-id="${escapeHTML(member.id)}">Delete</button></div></td></tr>`;
        }).join("");
      }
      ["searchMembers","filterPlan","filterPayment","filterStatus"].forEach(id=>$("#"+id).addEventListener("input",drawMemberRows));
      $("#memberRows").addEventListener("click",event=>{
        const button=event.target.closest("[data-action]");if(!button)return;
        const member=members.find(item=>item.id===button.dataset.id);if(!member)return;
        if(button.dataset.action==="view"){showMemberDetails(member);return;}
        if(button.dataset.action==="delete"){
          if(!confirm(`Delete the membership for ${member.name} (${member.id})? This cannot be undone.`))return;
          members=members.filter(item=>item.id!==member.id);if(saveMembers()){renderDashboard();showToast("Member record deleted.");}return;
        }
        if(button.dataset.action==="edit"){editMember(member);return;}
        if(button.dataset.action==="renew"){renewMember(member);}
      });
      function showMemberDetails(member){
        currentMemberId=member.id;
        const expiry=dateString(membershipDates(member.startDate,member.plan));
        $("#memberDetails").innerHTML=`<dl>${[["Membership ID",member.id],["Name",member.name],["Date of birth",member.dob],["Gender",member.gender],["Phone",member.phone],["Email",member.email],["Address",member.address],["Emergency contact",member.emergency||"Not provided"],["Membership",`${member.type} · ${member.plan}`],["Start date",formatDate(member.startDate)],["Expiry date",formatDate(expiry)],["Training time",member.trainingTime],["Personal trainer",member.trainer],["Fitness goal",member.goal],["Membership fee",money(member.fee)],["Payment",`${member.paymentMethod} · ${member.paymentStatus}`]].map(([label,value])=>`<div style="padding:7px 0;border-bottom:1px solid #333"><dt style="color:#a09d98;font-size:10px">${escapeHTML(label)}</dt><dd style="margin:2px 0;font-size:12px">${escapeHTML(value)}</dd></div>`).join("")}</dl>`;
        openModal("#memberModal");
      }
      $("#memberModal").addEventListener("click",event=>{if(event.target.id==="memberModal"||event.target.closest(".close-member"))closeModal("#memberModal");});
      $("#printReceipt").addEventListener("click",()=>{const member=members.find(item=>item.id===currentMemberId);if(member)printReceipt(member);});
      function printReceipt(member){
        const expiry=dateString(membershipDates(member.startDate,member.plan));
        const receipt=window.open("","_blank","width=700,height=760");
        if(!receipt){showToast("Allow pop-ups to print the membership receipt.",true);return;}
        receipt.document.write(`<!doctype html><html><head><title>Forge Fitness Receipt ${escapeHTML(member.id)}</title><meta charset="utf-8"><style>body{font:15px Arial,sans-serif;color:#171717;margin:50px auto;max-width:650px;padding:25px}h1{font-size:32px;margin-bottom:4px}h1 span{color:#e94735}h2{margin-top:32px;border-bottom:2px solid #e94735;padding-bottom:8px}p{color:#555}dl{display:grid;grid-template-columns:1fr 1fr;gap:0 25px}dt{margin-top:14px;color:#666;font-size:12px}dd{margin:3px 0;font-weight:bold}.id{font-size:18px;color:#e94735}.foot{margin-top:35px;padding-top:12px;border-top:1px solid #ddd;color:#777;font-size:12px}@media print{body{margin:0 auto}}</style></head><body><h1>FORGE <span>FITNESS</span></h1><p>MEMBERSHIP REGISTRATION RECEIPT</p><h2>Member details</h2><dl>${[["Membership ID",member.id],["Name",member.name],["Phone",member.phone],["Email",member.email],["Membership",`${member.type} · ${member.plan}`],["Start date",formatDate(member.startDate)],["Expiry date",formatDate(expiry)],["Membership fee",money(member.fee)],["Payment method",member.paymentMethod],["Payment status",member.paymentStatus]].map(([label,value])=>`<div><dt>${escapeHTML(label)}</dt><dd class="${label==="Membership ID"?"id":""}">${escapeHTML(value)}</dd></div>`).join("")}</dl><p class="foot">Thank you for choosing Forge Fitness. This is a locally generated receipt.</p><script>window.onload=()=>window.print()<\/script></body></html>`);
        receipt.document.close();
      }
      function editMember(member){
        const name=prompt("Full name:",member.name);if(name===null)return;if(name.trim().length<2){showToast("Name must contain at least 2 characters.",true);return;}
        const phone=prompt("Phone number:",member.phone);if(phone===null)return;const digits=phone.replace(/\D/g,"");if(digits.length<10||digits.length>15){showToast("Enter a valid phone number with 10–15 digits.",true);return;}
        const email=prompt("Email address:",member.email);if(email===null)return;if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showToast("Enter a valid email address.",true);return;}
        const selectedStatus=prompt("Payment status: enter Paid or Pending.",member.paymentStatus);if(selectedStatus===null)return;
        const paymentStatus=["Paid","Pending"].find(status=>status.toLowerCase()===selectedStatus.trim().toLowerCase());if(!paymentStatus){showToast("Payment status must be Paid or Pending.",true);return;}
        Object.assign(member,{name:name.trim(),phone:phone.trim(),email:email.trim(),paymentStatus});if(saveMembers()){renderDashboard();showToast("Member information updated.");}
      }
      function renewMember(member){
        const state=membershipStatus(member),base=state==="expired"?localToday:dateString(membershipDates(member.startDate,member.plan));
        const selectedPlan=prompt("Choose renewal duration: Monthly, Quarterly, Half-Yearly, or Yearly",member.plan);if(selectedPlan===null)return;
        const normalized=(Object.keys(DURATION_MONTHS) as MembershipDuration[]).find(value=>value.toLowerCase()===selectedPlan.trim().toLowerCase());
        if(!normalized){showToast("Choose Monthly, Quarterly, Half-Yearly, or Yearly.",true);return;}
        const nextStart=new Date(`${base}T00:00:00`);nextStart.setDate(nextStart.getDate()+1);
        const startDate=state==="expired"?localToday:dateString(nextStart);
        member.plan=normalized;member.startDate=startDate;member.fee=calculateMembershipFee(normalized,member.type,prices);
        member.paymentStatus=confirm(`Renewal fee: ${money(member.fee)}\n\nMark payment as PAID? Choose Cancel to leave it pending.`)?"Paid":"Pending";
        if(saveMembers()){renderDashboard();showToast(`Membership renewed through ${formatDate(dateString(membershipDates(member.startDate,member.plan)))}.`);}
      }
      $("#addMember").addEventListener("click",()=>location.hash="#join");
      $("#exportMembers").addEventListener("click",()=>{
        if(!members.length){showToast("There are no member records to export.",true);return;}
        const columns=["Membership ID","Name","Date of birth","Gender","Phone","Email","Address","Emergency contact","Membership plan","Membership type","Start date","Expiry date","Training time","Personal trainer","Fitness goal","Membership fee (INR)","Payment method","Payment status","Membership status"];
        const rows=members.map(member=>[member.id,member.name,member.dob,member.gender,member.phone,member.email,member.address,member.emergency||"",member.plan,member.type,member.startDate,dateString(membershipDates(member.startDate,member.plan)),member.trainingTime,member.trainer,member.goal,member.fee,member.paymentMethod,member.paymentStatus,membershipStatus(member)]);
        const csv=[columns,...rows].map(row=>row.map(cell=>`"${String(cell??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
        const link=document.createElement("a");link.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));link.download=`forge-members-${localToday}.csv`;link.click();URL.revokeObjectURL(link.href);showToast("Member records exported as CSV.");
      });
      $("#editPrices").addEventListener("click",()=>{Object.entries({Monthly:"priceMonthly",Quarterly:"priceQuarterly","Half-Yearly":"priceHalfYearly",Yearly:"priceYearly"}).forEach(([key,id])=>$("#"+id).value=prices[key]);openModal("#priceModal");});
      $$(".close-price").forEach(button=>button.addEventListener("click",()=>closeModal("#priceModal")));
      $("#priceModal").addEventListener("click",event=>{if(event.target.id==="priceModal")closeModal("#priceModal");});
      $("#priceForm").addEventListener("submit",event=>{
        event.preventDefault();const updated={Monthly:Number($("#priceMonthly").value),Quarterly:Number($("#priceQuarterly").value),"Half-Yearly":Number($("#priceHalfYearly").value),Yearly:Number($("#priceYearly").value)};
        if(Object.values(updated).some(price=>!Number.isFinite(price)||price<=0)){showToast("All membership prices must be greater than zero.",true);return;}
        const previous=prices;prices=updated;if(savePrices()){closeModal("#priceModal");renderPlans();updateFee();showToast("Membership prices updated.");}else prices=previous;
      });
      $("#contactForm").addEventListener("submit",event=>{
        event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
        const data=new FormData(form),subject=encodeURIComponent(`Membership enquiry from ${data.get("name")}`),body=encodeURIComponent(`Name: ${data.get("name")}\nEmail: ${data.get("email")}\n\n${data.get("message")}`);
        const notice=$("#contactMessageNotice");notice.textContent="Opening your email app to send this message. If it doesn't open, contact us at hello@forgefitness.example.";notice.classList.add("show");
        window.location.href=`mailto:hello@forgefitness.example?subject=${subject}&body=${body}`;
      });
    })();
