import"./modulepreload-polyfill-B5Qt9EMX.js";window.onload=function(){document.getElementById("description").innerText=`

`};const d=document.querySelectorAll(".card-group");d.forEach(n=>{const t=n.querySelectorAll(".card");t.forEach(e=>{e.addEventListener("click",()=>{t.forEach(r=>r.classList.remove("selected")),e.classList.add("selected");const o=e.querySelector("input[type='radio']");o.checked=!0;const c=e.getAttribute("for"),i=document.getElementById("description");c==="beginner"?i.innerText=`*No balloons

`:c==="intermediate"?i.innerText=`*Avoid balloons
*Foods come at faster speeds`:c==="advanced"&&(i.innerText=`*Avoid balloons
*Even faster speeds`)})})});const l=document.getElementById("levelForm");l.addEventListener("submit",n=>{n.preventDefault();const t=document.querySelector('input[name="difficulty"]:checked'),e=document.querySelector('input[name="mode"]:checked');if(!t||!e){alert("Please select both a color and a size.");return}const o="/food-ninja";window.location.href=`${o}/main.html?difficulty=${t.value}&mode=${e.value}`});
