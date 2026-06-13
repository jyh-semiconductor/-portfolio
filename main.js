// ===== 데이터 로드 (data.js 우선, 없으면 localStorage) =====
function loadData(key) {
  // data.js에 데이터가 있으면 우선 사용 (GitHub Pages 배포용)
  if (typeof STATIC_DATA !== 'undefined' && STATIC_DATA[key] && STATIC_DATA[key].length > 0) {
    return STATIC_DATA[key];
  }
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}

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

function getMajorLabel(major) { return CATEGORY_TREE[major]?.label || major || ''; }
function getSubLabel(major, sub) { return CATEGORY_TREE[major]?.subs[sub] || sub || ''; }
function getCategoryLabel(major, sub) {
  const m = getMajorLabel(major), s = getSubLabel(major, sub);
  return m && s ? `${m} > ${s}` : (s || m);
}

// 중분류 → 대분류 역방향 조회
function getMajorBySub(sub) {
  for (const [major, data] of Object.entries(CATEGORY_TREE)) {
    if (data.subs[sub]) return major;
  }
  return null;
}

// ===== Study Log 동적 렌더링 =====
let studySortOrder = 'newest';

function renderStudy() {
  const grid = document.getElementById('study-grid');
  if (!grid) return;

  let dynamicItems = loadData('portfolio_study');

  // 정렬
  dynamicItems = [...dynamicItems].sort((a, b) => {
    const da = (a.date || '').replace('.', '').padEnd(6, '0');
    const db = (b.date || '').replace('.', '').padEnd(6, '0');
    return studySortOrder === 'newest' ? db.localeCompare(da) : da.localeCompare(db);
  });

  const staticCards = grid.querySelectorAll('.study-card[data-static]');
  if (dynamicItems.length > 0) {
    staticCards.forEach(c => c.style.display = 'none');
  }

  grid.querySelectorAll('.study-card[data-dynamic]').forEach(c => c.remove());

  dynamicItems.forEach(item => {
    const major = item.major || getMajorBySub(item.category) || 'semiconductor';
    const sub   = item.category || '';
    const tagLabel = getCategoryLabel(major, sub);

    const card = document.createElement('div');
    card.className = 'study-card';
    card.dataset.major    = major;
    card.dataset.category = sub;
    card.dataset.dynamic  = 'true';
    card.innerHTML = `
      <div class="card-header">
        <span class="card-tag cat-${major}">${escHtml(tagLabel)}</span>
        <span class="card-date">${escHtml(item.date || '')}</span>
      </div>
      <h3>${escHtml(item.title)}</h3>
      <p>${escHtml(item.desc || '')}</p>
      <div class="card-footer">
        <a href="study-detail.html?id=${encodeURIComponent(item.id)}" class="read-more">자세히 보기 →</a>
      </div>
    `;
    grid.appendChild(card);
  });

  // 현재 활성 필터 재적용
  const activeMajor = document.querySelector('.filter-btn.active')?.dataset.major || 'all';
  const activeSub   = document.querySelector('.filter-sub-btn.active')?.dataset.sub || 'all';
  applyStudyFilter(activeMajor, activeSub);

  grid.querySelectorAll('.study-card[data-dynamic]').forEach(el => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    revealObserver.observe(el);
  });
}

// ===== Portfolio 동적 렌더링 =====
function renderPortfolio() {
  const grid = document.getElementById('portfolio-grid');
  if (!grid) return;

  const dynamicItems = loadData('portfolio_projects');

  const staticCards = grid.querySelectorAll('.portfolio-card[data-static]');
  if (dynamicItems.length > 0) {
    staticCards.forEach(c => c.style.display = 'none');
  }

  grid.querySelectorAll('.portfolio-card[data-dynamic]').forEach(c => c.remove());

  dynamicItems.forEach(item => {
    const tags = (item.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const tagHtml = tags.map(t => `<span class="skill-tag">${escHtml(t)}</span>`).join('');
    const linkHtml = `<a href="project-detail.html?id=${encodeURIComponent(item.id)}" class="btn btn-outline btn-sm">자세히 보기</a>`;

    const imgHtml = item.image
      ? `<div class="portfolio-img"><img src="${item.image}" alt="${escHtml(item.title)}" /></div>`
      : `<div class="portfolio-img placeholder-img"><span>프로젝트 이미지</span></div>`;

    const card = document.createElement('div');
    card.className        = 'portfolio-card';
    card.dataset.dynamic  = 'true';
    card.innerHTML = `
      ${imgHtml}
      <div class="portfolio-body">
        <div class="portfolio-tags">${tagHtml}</div>
        <h3>${escHtml(item.title)}</h3>
        <p>${escHtml(item.desc || '')}</p>
        ${linkHtml}
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('.portfolio-card[data-dynamic]').forEach(el => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    revealObserver.observe(el);
  });
}

// ===== Skills 동적 렌더링 =====
function renderSkills() {
  const grid = document.getElementById('skills-grid');
  if (!grid) return;

  const dynamicItems = loadData('portfolio_skills');
  if (!dynamicItems.length) return;

  // 정적 카드 숨기기
  grid.querySelectorAll('[data-static]').forEach(c => c.style.display = 'none');
  // 기존 동적 카드 제거
  grid.querySelectorAll('[data-dynamic]').forEach(c => c.remove());

  dynamicItems.forEach(item => {
    const skills = (item.items || '').split(',').map(s => s.trim()).filter(Boolean);
    const tagsHtml = skills.map(s => {
      if (s.startsWith('**')) {
        return `<span class="skill-tag cert-pending">${escHtml(s.slice(2))} (학습 중)</span>`;
      } else if (s.startsWith('*')) {
        return `<span class="skill-tag cert">${escHtml(s.slice(1))}</span>`;
      } else if (s.startsWith('-')) {
        return `<span class="skill-tag inactive">${escHtml(s.slice(1))}</span>`;
      }
      return `<span class="skill-tag">${escHtml(s)}</span>`;
    }).join('');

    const card = document.createElement('div');
    card.className      = 'skill-category';
    card.dataset.dynamic = 'true';
    card.innerHTML = `<h3>${escHtml(item.category)}</h3><div class="skill-tags">${tagsHtml}</div>`;
    grid.appendChild(card);

    card.style.opacity    = '0';
    card.style.transform  = 'translateY(24px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    revealObserver.observe(card);
  });
}

// ===== XSS 방지 =====
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== Navbar scroll effect =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ===== Mobile hamburger menu =====
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
hamburger.addEventListener('click', () => {
  navMobile.classList.toggle('open');
});
navMobile.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navMobile.classList.remove('open'));
});

// ===== Study Log filter =====
function applyStudyFilter(major, sub) {
  sub = sub || 'all';
  document.querySelectorAll('.study-card').forEach(card => {
    const cardSub   = card.dataset.category || '';
    // 대분류가 없는 카드(정적 카드)는 중분류로 대분류를 역조회
    const cardMajor = card.dataset.major || getMajorBySub(cardSub) || 'semiconductor';
    const majorOk = major === 'all' || cardMajor === major;
    const subOk   = sub   === 'all' || cardSub   === sub;
    if (majorOk && subOk) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

function populateSubFilters(major) {
  const subRow = document.getElementById('filter-sub-row');
  if (!subRow) return;
  subRow.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = 'filter-sub-btn active';
  allBtn.dataset.sub = 'all';
  allBtn.textContent = '전체';
  subRow.appendChild(allBtn);

  if (major !== 'all' && CATEGORY_TREE[major]) {
    Object.entries(CATEGORY_TREE[major].subs).forEach(([key, label]) => {
      const btn = document.createElement('button');
      btn.className = 'filter-sub-btn';
      btn.dataset.sub = key;
      btn.textContent = label;
      subRow.appendChild(btn);
    });
  }

  subRow.querySelectorAll('.filter-sub-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      subRow.querySelectorAll('.filter-sub-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const activeMajor = document.querySelector('.filter-btn.active')?.dataset.major || 'all';
      applyStudyFilter(activeMajor, btn.dataset.sub);
    });
  });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const major = btn.dataset.major;
    populateSubFilters(major);
    const subRow = document.getElementById('filter-sub-row');
    if (subRow) subRow.style.display = major === 'all' ? 'none' : 'flex';
    applyStudyFilter(major, 'all');
  });
});

// 초기 중분류 버튼 세팅
populateSubFilters('all');

// ===== 정렬 버튼 =====
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    studySortOrder = btn.dataset.sort;
    renderStudy();
  });
});

// ===== Scroll-reveal animation =====
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.study-card, .portfolio-card, .skill-category, .about-card').forEach(el => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  revealObserver.observe(el);
});

// ===== Active nav link on scroll =====
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.style.color = link.getAttribute('href') === '#' + entry.target.id
            ? 'var(--text)'
            : '';
        });
      }
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);

sections.forEach(section => sectionObserver.observe(section));

// ===== 초기 렌더링 =====
renderStudy();
renderPortfolio();
renderSkills();
