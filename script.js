// === 0. TRUY VẾT IP THẬT CỦA HỌC SINH ===
fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(data => {
        const ipTracker = document.getElementById('ip-tracker');
        if(ipTracker) ipTracker.innerHTML = `[!] CẢNH BÁO: ĐANG GIÁM SÁT TRUY CẬP TỪ IP: ${data.ip}`;
    })
    .catch(() => {
        const ipTracker = document.getElementById('ip-tracker');
        if(ipTracker) ipTracker.innerHTML = `[!] CẢNH BÁO: TRUY CẬP ẨN DANH ĐANG BỊ THEO DÕI`;
    });

// === 1. ÂM THANH (WEB AUDIO API) ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playKeystroke() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime); 
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.05);
}

function playClickSound() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

function playSuccessSound() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.5);
}

document.getElementById('studentForm').addEventListener('keydown', playKeystroke);
document.addEventListener('click', (e) => {
    if(e.target.closest('button, .radio-card, select, .checkbox-container')) playClickSound();
});

// === 2. DRAGGABLE WINDOW (CỬA SỔ KÉO THẢ) ===
const windowEl = document.getElementById('terminal-window');
const headerEl = document.getElementById('terminal-header');
let isDragging = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

headerEl.addEventListener('mousedown', dragStart);
document.addEventListener('mouseup', dragEnd);
document.addEventListener('mousemove', drag);

function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.target.closest('.terminal-header')) isDragging = true;
}
function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}
function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        windowEl.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
}

// === 3. GỌI DỮ LIỆU TỪ GITHUB GIST ===
const GIST_RAW_URL = "https://gist.githubusercontent.com/dong1729/e21f77fbef33e056f1c34511e3ba66eb/raw/185aa1fdfafd3492a7b892f3489caee32a7e942b/questions.json";
let formDatabase = {};

async function fetchQuestionsFromBackend() {
    try {
        const response = await fetch(GIST_RAW_URL);
        formDatabase = await response.json();
    } catch (error) {
        const container = document.getElementById('dynamic-questions-container');
        if(container) container.innerHTML = `<div style="color: #ff4444; font-size: 12px;">>> LỖI: KHÔNG THỂ KẾT NỐI SERVER CÂU HỎI.</div>`;
    }
}
fetchQuestionsFromBackend();

// --- HÀM TẠO HTML CÂU HỎI ĐA TÍNH NĂNG ---
function renderDynamicHTML(questionsArray) {
    let htmlContent = '';
    
    questionsArray.forEach(q => {
        const displayStyle = q.dependsOn ? 'none' : 'block';
        const dataAttribs = q.dependsOn ? `data-depends="${q.dependsOn}" data-show-if="${q.showIf}"` : '';
        
        htmlContent += `<div class="question-wrapper" id="${q.id || ''}" ${dataAttribs} style="display: ${displayStyle}">`;
        
        if (q.fields) {
            htmlContent += renderDynamicHTML(q.fields);
        } else {
            htmlContent += `<div class="input-group active"><label><span>admin@system:~$</span> ${q.label}</label>`;
            
            if (q.type === 'radio') {
                htmlContent += `<div class="radio-group">`;
                q.options.forEach(opt => {
                    htmlContent += `
                    <label class="radio-card">
                        <input type="radio" name="${q.name}" value="${opt}" onchange="window.handleCondition(this)">
                        <span class="radio-content">[ ${opt.toUpperCase()} ]</span>
                    </label>`;
                });
                htmlContent += `</div>`;
            } 
            else if (q.type === 'checkbox') {
                htmlContent += `
                <label class="checkbox-container">
                    <input type="checkbox" name="${q.name}" onchange="window.handleCondition(this)">
                    <span class="checkmark"></span> ${q.text}
                </label>`;
            }
            else if (q.type === 'multiselect') {
                htmlContent += `<div class="multiselect-group">`;
                q.options.forEach(opt => {
                    htmlContent += `
                    <label class="checkbox-item" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" name="${q.name}" value="${opt}"> ${opt}
                    </label>`;
                });
                htmlContent += `</div>`;
            }
            else if (q.type === 'code') {
                htmlContent += `
                <div class="ide-container">
                    <div class="ide-header"><span>main.py</span><span>Python 3.10</span></div>
                    <div class="ide-editor">
                        <div class="line-numbers">1</div>
                        <textarea name="${q.name}" class="code-area" spellcheck="false" oninput="window.updateIDE(this)" placeholder="${q.placeholder || ''}"></textarea>
                    </div>
                </div>`;
            }
            else if (q.type === 'textarea') {
                htmlContent += `<textarea name="${q.name}" rows="3" placeholder="${q.placeholder || ''}"></textarea>`;
            }
            else {
                htmlContent += `<input type="${q.type}" name="${q.name}" placeholder="${q.placeholder || ''}">`;
            }
            htmlContent += `</div>`;
        }
        htmlContent += `</div>`;
    });
    
    return htmlContent;
}

// --- LOGIC ẨN HIỆN CÂU HỎI & IDE ---
window.handleCondition = function(el) {
    const val = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
    const name = el.name;
    
    document.querySelectorAll(`[data-depends="${name}"]`).forEach(wrapper => {
        if (wrapper.getAttribute('data-show-if') === val) {
            wrapper.style.display = 'block';
        } else {
            wrapper.style.display = 'none';
            wrapper.querySelectorAll('input, textarea, select').forEach(i => {
                if(i.type === 'checkbox' || i.type === 'radio') i.checked = false;
                else i.value = '';
            });
        }
    });
};

window.updateIDE = function(textarea) {
    const lines = textarea.value.split('\n').length;
    const lineNumContainer = textarea.parentElement.querySelector('.line-numbers');
    let lineNums = '';
    for (let i = 1; i <= lines; i++) {
        lineNums += i + '<br>';
    }
    lineNumContainer.innerHTML = lineNums;
};


// === 4. KHAI BÁO BIẾN (PHẦN BẠN BỊ XÓA NHẦM TRƯỚC ĐÓ) ===
const form = document.getElementById('studentForm');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const submitBtn = document.getElementById('submitBtn');
const statusMessage = document.getElementById('statusMessage');
const stepIndicator = document.getElementById('step-indicator');
const dynamicContainer = document.getElementById('dynamic-questions-container');
const subjectSelect = document.getElementById('subject');
const captchaInput = document.getElementById('captcha');
const hackerLoader = document.getElementById('hacker-loader');

// Khóa Submit ban đầu
if(submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.3';
    submitBtn.innerHTML = '> Lệnh bị khóa';
}

if(captchaInput) {
    captchaInput.addEventListener('input', function() {
        if (this.value.trim().toLowerCase() === 'sudo execute') {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerHTML = '> THỰC THI (UNLOCKED)';
            submitBtn.style.background = 'var(--text-main)';
            submitBtn.style.color = 'var(--terminal-bg)';
            playClickSound();
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.3';
            submitBtn.innerHTML = '> Lệnh bị khóa';
            submitBtn.style.background = 'transparent';
            submitBtn.style.color = 'var(--text-main)';
        }
    });
}

if(subjectSelect) {
    subjectSelect.addEventListener('change', function() {
        if (formDatabase[this.value]) {
            dynamicContainer.innerHTML = renderDynamicHTML(formDatabase[this.value]);
        } else {
            dynamicContainer.innerHTML = '';
        }
    });
}

// LƯU NHÁP & PHỤC HỒI FORM
form.addEventListener('input', () => {
    const currentData = Object.fromEntries(new FormData(form).entries());
    localStorage.setItem('student_form_draft', JSON.stringify(currentData));
});

function restoreDraftData() {
    const savedDataStr = localStorage.getItem('student_form_draft');
    if (savedDataStr) {
        const savedData = JSON.parse(savedDataStr);
        Object.keys(savedData).forEach(key => {
            const input = form.elements[key];
            if (input && key !== 'Chi_tiet_cau_tra_loi' && key !== 'bot-field') {
                if (input.type === 'radio' || input.length > 0) {
                    const radioList = document.getElementsByName(key);
                    for (let i = 0; i < radioList.length; i++) {
                        if (radioList[i].value === savedData[key]) {
                            radioList[i].checked = true;
                            if(radioList[i].onchange) radioList[i].onchange();
                        }
                    }
                } else {
                    input.value = savedData[key];
                }
            }
        });
        if (savedData.subject && formDatabase[savedData.subject]) {
            dynamicContainer.innerHTML = renderDynamicHTML(formDatabase[savedData.subject]);
            setTimeout(() => {
                Object.keys(savedData).forEach(key => {
                    const dynamicInput = document.getElementsByName(key);
                    if (dynamicInput.length > 0) {
                        if(dynamicInput[0].type === 'radio' || dynamicInput[0].type === 'checkbox') {
                            for(let i=0; i<dynamicInput.length; i++) {
                                if(dynamicInput[i].value === savedData[key] || (dynamicInput[i].type === 'checkbox' && savedData[key] === 'on')) {
                                    dynamicInput[i].checked = true;
                                    window.handleCondition(dynamicInput[i]);
                                }
                            }
                        } else {
                            dynamicInput[0].value = savedData[key];
                        }
                    }
                });
            }, 50);
        }
    }
}

// === XỬ LÝ NÚT NEXT & QUAY LẠI ===
nextBtn.addEventListener('click', () => {
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phone-error');
    const step1Inputs = step1.querySelectorAll('input[required]');
    let isValid = true;
    
    if (phoneError) phoneError.style.display = 'none';
    
    step1Inputs.forEach(input => {
        if (!input.checkValidity()) {
            isValid = false;
            input.reportValidity(); // Popup đỏ của trình duyệt
            if (input.id === 'phone' && input.validity.patternMismatch && phoneError) {
                phoneError.style.display = 'block';
            }
        }
    });

    if (isValid) {
        step1.classList.remove('active');
        step2.classList.add('active');
        if (stepIndicator) stepIndicator.innerText = '2/2';
    }
});

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        step2.classList.remove('active');
        step1.classList.add('active');
        if (stepIndicator) stepIndicator.innerText = '1/2';
    });
}

// === 5. XỬ LÝ SUBMIT & KỊCH BẢN TỰ HỦY ===
form.addEventListener('submit', function(e) {
    e.preventDefault();
    submitBtn.style.display = 'none';
    prevBtn.style.display = 'none';
    
    let aggregateData = "";
    const dynamicInputs = dynamicContainer.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked, input[type="text"], textarea');
    dynamicInputs.forEach(input => {
        const group = input.closest('.input-group') || input.closest('.multiselect-group') || input.closest('.question-wrapper');
        let label = input.name;
        if (group && group.querySelector('label')) {
            label = group.querySelector('label').innerText.replace('admin@system:~$ ', '');
        }
        aggregateData += `[${label}]: ${input.value}\n`;
    });
    
    const hiddenField = document.getElementById('dynamic_answers');
    if (hiddenField) hiddenField.value = aggregateData;

    const formData = new FormData(form);
    
    hackerLoader.style.display = 'block';
    statusMessage.style.display = 'none';
    
    const hackingPhrases = [
        "[+] Khởi tạo giao thức bảo mật...",
        "[+] Mã hóa Payload bằng RSA-2048...",
        "[+] Qua mặt Firewall...",
        "[+] Truyền dữ liệu lên Server..."
    ];
    
    let progress = 0;
    let phraseIndex = 0;
    
    const hackInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 20);
        if (progress >= 100) progress = 99; 
        const bars = '█'.repeat(Math.floor(progress/5)) + '░'.repeat(20 - Math.floor(progress/5));
        if(progress % 25 === 0 && phraseIndex < hackingPhrases.length - 1) phraseIndex++;
        
        hackerLoader.innerHTML = `${hackingPhrases[phraseIndex]}<br>[${bars}] ${progress}%`;
    }, 150);

    fetch('/', {
        method: 'POST',
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString()
    })
    .then(() => {
        clearInterval(hackInterval);
        hackerLoader.innerHTML = `[████████████████████] 100%<br>[OK] TRUYỀN DỮ LIỆU THÀNH CÔNG.`;
        playSuccessSound(); 
        
        // Kịch bản Tự hủy
        setTimeout(() => {
            document.getElementById('terminal-window').classList.add('self-destruct-mode');
            
            let countdown = 5;
            hackerLoader.style.display = 'none';
            statusMessage.style.display = 'block';
            statusMessage.className = 'status-message status-error';

            const destructInterval = setInterval(() => {
                if(audioCtx.state === 'suspended') audioCtx.resume();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = 1200; 
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.start(); osc.stop(audioCtx.currentTime + 0.3);

                statusMessage.innerHTML = `>> BÁO ĐỘNG ĐỎ: DẤU VẾT BỊ PHÁT HIỆN!<br>>> HỆ THỐNG TỰ HỦY SAU: 00:0${countdown}`;
                countdown--;

                if(countdown < 0) {
                    clearInterval(destructInterval);
                    document.body.innerHTML = ''; 
                    document.body.style.background = '#000'; 
                    setTimeout(() => {
                        window.location.href = "https://www.google.com"; 
                    }, 1000);
                }
            }, 1000);
        }, 1500);
    })
    .catch(() => {
        clearInterval(hackInterval);
        hackerLoader.style.display = 'none';
        statusMessage.innerHTML = '>> ERROR: TRANSMISSION_FAILED';
        statusMessage.className = 'status-message status-error';
        statusMessage.style.display = 'block';
        if (submitBtn) submitBtn.style.display = 'block';
        if (prevBtn) prevBtn.style.display = 'block';
    });
});

// === 6. MATRIX DIGITAL RAIN BACKGROUND ===
(function initMatrixRain() {
    const canvas = document.getElementById('matrix-rain');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const glyphs = 'アァイィウヴエカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲ0123456789<>/\\|*#$%+=-';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let columns, drops, fontSize;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        fontSize = window.innerWidth < 600 ? 14 : 16;
        columns = Math.floor(canvas.width / fontSize);
        drops = Array(columns).fill(0).map(() => Math.random() * -canvas.height / fontSize);
    }

    function draw() {
        ctx.fillStyle = 'rgba(5, 5, 5, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = fontSize + "px 'Fira Code', monospace";

        for (let i = 0; i < drops.length; i++) {
            const char = glyphs.charAt(Math.floor(Math.random() * glyphs.length));
            const x = i * fontSize;
            const y = drops[i] * fontSize;

            ctx.fillStyle = Math.random() > 0.975 ? '#c9ffd1' : 'rgba(0, 255, 65, 0.85)';
            ctx.fillText(char, x, y);

            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    resize();
    window.addEventListener('resize', resize);

    if (reduceMotion) {
        draw();
        return;
    }

    let last = 0;
    const interval = 55;
    function loop(ts) {
        if (ts - last >= interval) {
            draw();
            last = ts;
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
})();