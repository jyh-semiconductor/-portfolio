// ===== 카테고리 구조 =====
const CATEGORY_TREE = {
  semiconductor: { label: '집적회로', subs: {
    process: '공정', device: '소자', circuit: '회로', physics: '물리'
  }},
  data: { label: '데이터 분석', subs: {
    projects: 'Python 실전 프로젝트', theory: '분석 이론 및 알고리즘'
  }},
  quality: { label: '품질 및 통계', subs: {
    'six-sigma': '6시그마', spc: 'SPC'
  }},
  career: { label: '커리어', subs: {
    language: '어학', certifications: '자격증', retrospect: '회고'
  }}
};

// ===== 비밀번호 =====
// 비밀번호를 바꾸고 싶으면 아래 값을 수정하세요
const ADMIN_PASSWORD = '021013';

const lockScreen = document.getElementById('lock-screen');
const adminBody  = document.getElementById('admin-body');
const pwInput    = document.getElementById('pw-input');
const pwBtn      = document.getElementById('pw-btn');
const lockError  = document.getElementById('lock-error');

function unlock() {
  if (pwInput.value === ADMIN_PASSWORD) {
    lockScreen.style.display = 'none';
    adminBody.style.display  = 'block';
    sessionStorage.setItem('admin_auth', 'true');
  } else {
    lockError.textContent = '비밀번호가 틀렸습니다.';
    pwInput.value = '';
    pwInput.focus();
  }
}

// 이미 인증된 세션이면 바로 열기
if (sessionStorage.getItem('admin_auth') === 'true') {
  lockScreen.style.display = 'none';
  adminBody.style.display  = 'block';
}

pwBtn.addEventListener('click', unlock);
pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') unlock(); });

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('admin_auth');
  location.reload();
});

// ===== 중분류 드롭다운 갱신 =====
function updateSubCategory(majorVal, selectedSub) {
  const majorSelect = document.getElementById('s-major');
  const subSelect   = document.getElementById('s-category');
  const major = majorVal || majorSelect.value;
  const subs  = CATEGORY_TREE[major]?.subs || {};
  subSelect.innerHTML = Object.entries(subs)
    .map(([val, label]) => `<option value="${val}"${val === selectedSub ? ' selected' : ''}>${label}</option>`)
    .join('');
}

document.getElementById('s-major').addEventListener('change', () => updateSubCategory());
updateSubCategory('semiconductor');

// ===== 탭 =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ===== Toast =====
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== localStorage 헬퍼 =====
function loadData(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function saveData(key, arr) {
  localStorage.setItem(key, JSON.stringify(arr));
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ===== 데이터 내보내기 =====
document.getElementById('export-btn').addEventListener('click', () => {
  const study    = loadData('portfolio_study');
  const projects = loadData('portfolio_projects');
  const skills   = loadData('portfolio_skills');

  const content = `// ===== 정적 데이터 파일 =====
// 어드민 페이지에서 "데이터 내보내기" 버튼을 눌러 이 파일을 갱신하세요.
// 갱신 후 GitHub에 업로드하면 사이트에 반영됩니다.
// 생성일시: ${new Date().toLocaleString('ko-KR')}

const STATIC_DATA = ${JSON.stringify({ portfolio_study: study, portfolio_projects: projects, portfolio_skills: skills }, null, 2)};
`;

  const blob = new Blob([content], { type: 'text/javascript' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'data.js';
  a.click();
  URL.revokeObjectURL(url);
  showToast('data.js 다운로드 완료! 웹페이지 폴더에 덮어쓰세요.');
});

// ===========================
// STUDY LOG
// ===========================
const STUDY_KEY = 'portfolio_study';
let studyEditId    = null;
let studyFilterMajor = 'all';

const studyForm      = document.getElementById('study-form');
const studyFormTitle = document.getElementById('study-form-title');
const studyList      = document.getElementById('study-list');

document.getElementById('study-add-btn').addEventListener('click', () => {
  studyEditId = null;
  studyFormTitle.textContent = '새 Study 항목';
  clearStudyForm();
  studyForm.style.display = 'block';
  studyForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

document.getElementById('study-cancel-btn').addEventListener('click', () => {
  studyForm.style.display = 'none';
  studyEditId = null;
});

document.getElementById('study-save-btn').addEventListener('click', () => {
  const title   = document.getElementById('s-title').value.trim();
  const desc    = document.getElementById('s-desc').value.trim();
  const date    = document.getElementById('s-date').value.trim();
  const major   = document.getElementById('s-major').value;
  const cat     = document.getElementById('s-category').value;
  const content = document.getElementById('s-content').value.trim();

  if (!title) { alert('제목을 입력해주세요.'); return; }

  const arr = loadData(STUDY_KEY);
  if (studyEditId) {
    const idx = arr.findIndex(i => i.id === studyEditId);
    if (idx !== -1) arr[idx] = { ...arr[idx], title, desc, date, major, category: cat, content };
    showToast('수정되었습니다.');
  } else {
    arr.unshift({ id: genId(), title, desc, date, major, category: cat, content });
    showToast('추가되었습니다.');
  }
  saveData(STUDY_KEY, arr);
  studyForm.style.display = 'none';
  studyEditId = null;
  renderStudyList();
});

function clearStudyForm() {
  document.getElementById('s-title').value   = '';
  document.getElementById('s-desc').value    = '';
  document.getElementById('s-date').value    = '';
  document.getElementById('s-content').value = '';
  document.getElementById('s-major').value   = 'semiconductor';
  updateSubCategory('semiconductor');
}

function getCategoryLabel(major, sub) {
  const majorLabel = CATEGORY_TREE[major]?.label || major || '';
  const subLabel   = CATEGORY_TREE[major]?.subs[sub] || sub || '';
  return majorLabel && subLabel ? `${majorLabel} > ${subLabel}` : (subLabel || majorLabel);
}

function renderStudyList() {
  const all = loadData(STUDY_KEY);

  // 탭별 카운트 업데이트
  document.querySelectorAll('.study-tab-btn').forEach(btn => {
    const major = btn.dataset.major;
    const count = major === 'all' ? all.length : all.filter(i => (i.major || 'semiconductor') === major).length;
    const label = btn.dataset.label || btn.textContent.replace(/\s*\(\d+\)$/, '');
    btn.dataset.label = label;
    btn.textContent = count > 0 ? `${label} (${count})` : label;
    if (btn.dataset.major === studyFilterMajor) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  const filtered = studyFilterMajor === 'all'
    ? all
    : all.filter(i => (i.major || 'semiconductor') === studyFilterMajor);

  if (!filtered.length) {
    studyList.innerHTML = '<div class="item-list-empty">이 카테고리에 항목이 없습니다.</div>';
    return;
  }

  // 중분류별로 그룹핑
  const groups = {};
  filtered.forEach(item => {
    const sub = item.category || '';
    if (!groups[sub]) groups[sub] = [];
    groups[sub].push(item);
  });

  let html = '';
  for (const [sub, items] of Object.entries(groups)) {
    const subLabel = studyFilterMajor !== 'all'
      ? (CATEGORY_TREE[studyFilterMajor]?.subs[sub] || sub)
      : getCategoryLabel(items[0].major, sub);
    html += `<div class="study-group">
      <div class="study-group-label">${escHtml(subLabel)}<span class="study-group-count">${items.length}</span></div>`;
    html += items.map(item => `
      <div class="admin-item">
        <div class="item-info">
          <div class="item-title">${escHtml(item.title)}</div>
          <div class="item-meta">
            <span class="card-tag cat-${item.major || 'semiconductor'}" style="font-size:0.7rem;">${escHtml(getCategoryLabel(item.major, item.category))}</span>
            <span>${escHtml(item.date || '')}</span>
          </div>
          <div class="item-desc">${escHtml(item.desc || '')}</div>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="editStudy('${item.id}')">수정</button>
          <button class="btn-delete" onclick="deleteStudy('${item.id}')">삭제</button>
        </div>
      </div>
    `).join('');
    html += `</div>`;
  }
  studyList.innerHTML = html;
}

// 카테고리 탭 이벤트
document.querySelectorAll('.study-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    studyFilterMajor = btn.dataset.major;
    renderStudyList();
  });
});

function editStudy(id) {
  const arr  = loadData(STUDY_KEY);
  const item = arr.find(i => i.id === id);
  if (!item) return;
  studyEditId = id;
  studyFormTitle.textContent = '항목 수정';
  document.getElementById('s-title').value   = item.title;
  document.getElementById('s-desc').value    = item.desc    || '';
  document.getElementById('s-date').value    = item.date    || '';
  document.getElementById('s-content').value = item.content || '';
  document.getElementById('s-major').value   = item.major   || 'semiconductor';
  updateSubCategory(item.major || 'semiconductor', item.category);
  studyForm.style.display = 'block';
  studyForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function deleteStudy(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  const arr = loadData(STUDY_KEY).filter(i => i.id !== id);
  saveData(STUDY_KEY, arr);
  showToast('삭제되었습니다.');
  renderStudyList();
}

// ===========================
// PORTFOLIO
// ===========================
const PORT_KEY = 'portfolio_projects';
let portEditId  = null;
let currentImageBase64 = null;

const portForm      = document.getElementById('portfolio-form');
const portFormTitle = document.getElementById('portfolio-form-title');
const portList      = document.getElementById('portfolio-list');

// ===== 이미지 업로드 =====
const imgInput     = document.getElementById('p-image');
const imgPreview   = document.getElementById('img-preview');
const imgSelectBtn = document.getElementById('img-select-btn');
const imgRemoveBtn = document.getElementById('img-remove-btn');

imgSelectBtn.addEventListener('click', () => imgInput.click());

imgInput.addEventListener('change', () => {
  if (imgInput.files[0]) loadImageFile(imgInput.files[0]);
});

imgPreview.addEventListener('click', () => imgInput.click());

imgPreview.addEventListener('dragover', e => {
  e.preventDefault();
  imgPreview.classList.add('dragover');
});
imgPreview.addEventListener('dragleave', () => imgPreview.classList.remove('dragover'));
imgPreview.addEventListener('drop', e => {
  e.preventDefault();
  imgPreview.classList.remove('dragover');
  if (e.dataTransfer.files[0]) loadImageFile(e.dataTransfer.files[0]);
});

imgRemoveBtn.addEventListener('click', () => {
  currentImageBase64 = null;
  imgPreview.innerHTML = '<span class="img-placeholder">클릭하거나 이미지를 드래그하세요<br/><small>JPG, PNG, GIF · 권장 2MB 이하</small></span>';
  imgRemoveBtn.style.display = 'none';
  imgInput.value = '';
});

function loadImageFile(file) {
  if (file.size > 3 * 1024 * 1024) {
    alert('이미지 크기가 너무 큽니다. 3MB 이하 이미지를 사용해주세요.');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    currentImageBase64 = e.target.result;
    imgPreview.innerHTML = `<img src="${currentImageBase64}" alt="미리보기" />`;
    imgRemoveBtn.style.display = 'inline-block';
  };
  reader.readAsDataURL(file);
}

function setImagePreview(base64) {
  if (base64) {
    currentImageBase64 = base64;
    imgPreview.innerHTML = `<img src="${base64}" alt="미리보기" />`;
    imgRemoveBtn.style.display = 'inline-block';
  } else {
    currentImageBase64 = null;
    imgPreview.innerHTML = '<span class="img-placeholder">클릭하거나 이미지를 드래그하세요<br/><small>JPG, PNG, GIF · 권장 2MB 이하</small></span>';
    imgRemoveBtn.style.display = 'none';
  }
}

document.getElementById('portfolio-add-btn').addEventListener('click', () => {
  portEditId = null;
  portFormTitle.textContent = '새 프로젝트';
  clearPortForm();
  setImagePreview(null);
  portForm.style.display = 'block';
  portForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

document.getElementById('portfolio-cancel-btn').addEventListener('click', () => {
  portForm.style.display = 'none';
  portEditId = null;
});

document.getElementById('portfolio-save-btn').addEventListener('click', () => {
  const title   = document.getElementById('p-title').value.trim();
  const desc    = document.getElementById('p-desc').value.trim();
  const tags    = document.getElementById('p-tags').value.trim();
  const overview= document.getElementById('p-overview').value.trim();
  const period  = document.getElementById('p-period').value.trim();
  const field   = document.getElementById('p-field').value.trim();
  const tools   = document.getElementById('p-tools').value.trim();
  const youtube = document.getElementById('p-youtube').value.trim();

  if (!title) { alert('제목을 입력해주세요.'); return; }

  const arr = loadData(PORT_KEY);
  const item = { title, desc, tags, overview, period, field, tools, youtube, image: currentImageBase64 || null };

  if (portEditId) {
    const idx = arr.findIndex(i => i.id === portEditId);
    if (idx !== -1) arr[idx] = { ...arr[idx], ...item };
    showToast('수정되었습니다.');
  } else {
    arr.unshift({ id: genId(), ...item });
    showToast('추가되었습니다.');
  }
  saveData(PORT_KEY, arr);
  portForm.style.display = 'none';
  portEditId = null;
  renderPortList();
});

function clearPortForm() {
  ['p-title','p-desc','p-tags','p-overview','p-period','p-field','p-tools','p-youtube']
    .forEach(id => { document.getElementById(id).value = ''; });
}

function renderPortList() {
  const arr = loadData(PORT_KEY);
  if (!arr.length) {
    portList.innerHTML = '<div class="item-list-empty">아직 프로젝트가 없습니다.<br/>위의 버튼으로 추가해보세요.</div>';
    return;
  }
  portList.innerHTML = arr.map(item => `
    <div class="admin-item">
      ${item.image ? `<img src="${item.image}" class="admin-item-thumb" alt="썸네일" />` : ''}
      <div class="item-info">
        <div class="item-title">${escHtml(item.title)}</div>
        <div class="item-meta">
          <span>${escHtml(item.period || '')}</span>
          <span>${escHtml(item.field || '')}</span>
        </div>
        <div class="item-desc">${escHtml(item.desc || '')}</div>
      </div>
      <div class="item-actions">
        <button class="btn-edit" onclick="editPort('${item.id}')">수정</button>
        <button class="btn-delete" onclick="deletePort('${item.id}')">삭제</button>
      </div>
    </div>
  `).join('');
}

function editPort(id) {
  const arr  = loadData(PORT_KEY);
  const item = arr.find(i => i.id === id);
  if (!item) return;
  portEditId = id;
  portFormTitle.textContent = '프로젝트 수정';
  document.getElementById('p-title').value    = item.title    || '';
  document.getElementById('p-desc').value     = item.desc     || '';
  document.getElementById('p-tags').value     = item.tags     || '';
  document.getElementById('p-overview').value = item.overview || '';
  document.getElementById('p-period').value   = item.period   || '';
  document.getElementById('p-field').value    = item.field    || '';
  document.getElementById('p-tools').value    = item.tools   || '';
  document.getElementById('p-youtube').value  = item.youtube || '';
  setImagePreview(item.image || null);
  portForm.style.display = 'block';
  portForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function deletePort(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  const arr = loadData(PORT_KEY).filter(i => i.id !== id);
  saveData(PORT_KEY, arr);
  showToast('삭제되었습니다.');
  renderPortList();
}

// ===========================
// SKILLS
// ===========================
const SKILL_KEY = 'portfolio_skills';
let skillEditId  = null;

const skillForm      = document.getElementById('skill-form');
const skillFormTitle = document.getElementById('skill-form-title');
const skillList      = document.getElementById('skill-list');

document.getElementById('skill-add-btn').addEventListener('click', () => {
  skillEditId = null;
  skillFormTitle.textContent = '새 카테고리';
  document.getElementById('sk-category').value = '';
  document.getElementById('sk-items').value    = '';
  skillForm.style.display = 'block';
  skillForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

document.getElementById('skill-cancel-btn').addEventListener('click', () => {
  skillForm.style.display = 'none';
  skillEditId = null;
});

document.getElementById('skill-save-btn').addEventListener('click', () => {
  const category = document.getElementById('sk-category').value.trim();
  const items    = document.getElementById('sk-items').value.trim();
  if (!category) { alert('카테고리 이름을 입력해주세요.'); return; }

  const arr = loadData(SKILL_KEY);
  if (skillEditId) {
    const idx = arr.findIndex(i => i.id === skillEditId);
    if (idx !== -1) arr[idx] = { ...arr[idx], category, items };
    showToast('수정되었습니다.');
  } else {
    arr.push({ id: genId(), category, items });
    showToast('추가되었습니다.');
  }
  saveData(SKILL_KEY, arr);
  skillForm.style.display = 'none';
  skillEditId = null;
  renderSkillList();
});

function renderSkillList() {
  const arr = loadData(SKILL_KEY);
  if (!arr.length) {
    skillList.innerHTML = '<div class="item-list-empty">아직 카테고리가 없습니다.<br/>위의 버튼으로 추가해보세요.</div>';
    return;
  }
  skillList.innerHTML = arr.map(item => `
    <div class="admin-item">
      <div class="item-info">
        <div class="item-title">${escHtml(item.category)}</div>
        <div class="item-desc" style="margin-top:6px;">${escHtml(item.items || '')}</div>
      </div>
      <div class="item-actions">
        <button class="btn-edit" onclick="editSkill('${item.id}')">수정</button>
        <button class="btn-delete" onclick="deleteSkill('${item.id}')">삭제</button>
      </div>
    </div>
  `).join('');
}

function editSkill(id) {
  const arr  = loadData(SKILL_KEY);
  const item = arr.find(i => i.id === id);
  if (!item) return;
  skillEditId = id;
  skillFormTitle.textContent = '카테고리 수정';
  document.getElementById('sk-category').value = item.category;
  document.getElementById('sk-items').value    = item.items || '';
  skillForm.style.display = 'block';
  skillForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function deleteSkill(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  const arr = loadData(SKILL_KEY).filter(i => i.id !== id);
  saveData(SKILL_KEY, arr);
  showToast('삭제되었습니다.');
  renderSkillList();
}

// ===== XSS 방지 =====
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== 기본 데이터 초기화 (최초 1회만) =====
function seedDefaultData() {
  if (localStorage.getItem('portfolio_seeded') === 'v3') return;
  // v3: Study 카테고리 대분류/중분류 구조로 변경
  localStorage.removeItem('portfolio_study');
  localStorage.removeItem('portfolio_projects');
  localStorage.removeItem('portfolio_seeded');

  saveData(STUDY_KEY, [
    { id: genId(), major: 'semiconductor', category: 'process', date: '2025.03', title: '포토리소그래피 공정 원리',
      desc: '노광, 현상, 식각의 순서와 포토레지스트(PR)의 역할. 파장 단축으로 해상도를 높이는 방법 (i-line → EUV).' },
    { id: genId(), major: 'semiconductor', category: 'device',  date: '2025.04', title: 'MOSFET 동작 원리',
      desc: '임계전압(Vth), 선형 영역과 포화 영역 구분. Short Channel Effect와 이를 억제하기 위한 구조적 해법.' },
    { id: genId(), major: 'semiconductor', category: 'physics', date: '2025.04', title: '반도체 밴드 구조와 페르미 레벨',
      desc: '전도대 · 가전자대 · 밴드갭의 의미. 도핑에 따른 페르미 레벨 이동과 n형 · p형 반도체 특성.' },
    { id: genId(), major: 'semiconductor', category: 'process', date: '2025.05', title: 'CVD (화학기상증착) 종류와 특성',
      desc: 'LPCVD, PECVD, MOCVD의 차이. 스텝 커버리지, 증착 속도, 온도 조건 비교.' },
    { id: genId(), major: 'semiconductor', category: 'circuit', date: '2025.05', title: 'CMOS 인버터 정적 특성',
      desc: '전압전달특성(VTC) 분석. 노이즈마진(NML, NMH) 계산. 스위칭 임계전압(VM) 결정 조건.' },
    { id: genId(), major: 'semiconductor', category: 'device',  date: '2025.06', title: 'FinFET 구조와 장점',
      desc: '평면 MOSFET의 한계와 3D 구조 FinFET의 등장 배경. 게이트 제어력 향상과 누설전류 감소 메커니즘.' },
  ]);

  saveData(PORT_KEY, [
    { id: genId(), title: 'MOSFET 공정 파라미터 최적화',
      desc: '이온주입 도즈와 어닐링 온도 변화에 따른 임계전압 변화를 MATLAB으로 모델링하고 분석.',
      tags: '공정 시뮬레이션, MATLAB',
      overview: '이온주입 도즈와 어닐링 온도 변화에 따른 Vth 변화를 모델링하고 최적 공정 조건을 도출.',
      period: '2025.03 – 2025.05', field: '반도체 공정', tools: 'MATLAB' },
    { id: genId(), title: 'CMOS 논리 게이트 설계 및 시뮬레이션',
      desc: 'NAND, NOR, XOR 게이트를 CMOS로 설계하고 LTspice에서 지연 시간과 전력 소비 분석.',
      tags: '회로 설계, LTspice',
      overview: 'NAND, NOR, XOR 게이트를 트랜지스터 레벨에서 설계하고 VTC, 전파 지연, 전력을 분석.',
      period: '2025.04 – 2025.06', field: 'CMOS 회로 설계', tools: 'LTspice' },
    { id: genId(), title: 'EUV 노광 기술 동향 조사',
      desc: 'EUV 광원, 마스크, 레지스트 기술의 현황과 한계, 차세대 패터닝 기술 비교 분석 보고서.',
      tags: '문헌 조사, 보고서',
      overview: 'EUV 기술 구성 요소를 분석하고 High-NA EUV, NIL 등 차세대 패터닝 기술과 비교.',
      period: '2025.05 – 2025.06', field: '반도체 공정 / 노광 기술', tools: '문헌 조사 · 보고서 작성' },
  ]);

  saveData(SKILL_KEY, [
    { id: genId(), category: '반도체 공정',
      items: '포토리소그래피, CVD / PVD, 식각 (Etching), CMP, 이온주입, 열처리' },
    { id: genId(), category: '소자 / 회로',
      items: 'MOSFET, -BJT, CMOS Logic, PN 접합, 밴드갭 이론' },
    { id: genId(), category: '시뮬레이션 / 도구',
      items: '-MATLAB, -LTspice, Python (학습 중), -Sentaurus' },
    { id: genId(), category: '자격증',
      items: '*6시그마 GB, *미니탭 3급, **SPC' },
  ]);

  localStorage.setItem('portfolio_seeded', 'v3');
}

seedDefaultData();

// ===== 초기 렌더링 =====
renderStudyList();
renderPortList();
renderSkillList();
