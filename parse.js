// ===== 마크다운 파싱 (링크 + 수식 지원) =====
// 지원 문법:
//   [텍스트](URL)        → 하이퍼링크
//   **텍스트**           → 굵게
//   `코드`               → 인라인 코드
//   $수식$               → 인라인 수식 (MathJax)
//   $$수식$$             → 블록 수식 (MathJax)
//   빈 줄                → 문단 구분

function parseContent(text) {
  if (!text) return '';

  // 블록 수식 $$...$$ 을 플레이스홀더로 보호 (줄바꿈 포함 가능)
  const blockMath = [];
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    blockMath.push(expr);
    return `%%BLOCKMATH${blockMath.length - 1}%%`;
  });

  // 인라인 수식 $...$ 을 플레이스홀더로 보호
  const inlineMath = [];
  text = text.replace(/\$([^\$\n]+?)\$/g, (_, expr) => {
    inlineMath.push(expr);
    return `%%INLINEMATH${inlineMath.length - 1}%%`;
  });

  // 줄 단위로 처리
  const lines = text.split('\n');
  const blocks = [];
  let para = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push(`<p>${para.join('<br/>')}</p>`);
      para = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line === '') {
      flushPara();
      continue;
    }

    // 블록 수식 줄
    if (/^%%BLOCKMATH\d+%%$/.test(line.trim())) {
      flushPara();
      blocks.push(line.trim());
      continue;
    }

    // 인라인 파싱
    let parsed = escHtmlContent(line);

    // **굵게**
    parsed = parsed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // `인라인 코드`
    parsed = parsed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // [텍스트](URL)
    parsed = parsed.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener" class="content-link">$1</a>'
    );

    para.push(parsed);
  }
  flushPara();

  let html = blocks.join('\n');

  // 플레이스홀더 복원 — 블록 수식
  html = html.replace(/%%BLOCKMATH(\d+)%%/g, (_, i) =>
    `<div class="math-block">\\[${blockMath[i]}\\]</div>`
  );

  // 플레이스홀더 복원 — 인라인 수식
  html = html.replace(/%%INLINEMATH(\d+)%%/g, (_, i) =>
    `\\(${inlineMath[i]}\\)`
  );

  return html;
}

// HTML 이스케이프 (수식/링크 치환 전용 — 마크다운 기호는 건드리지 않음)
function escHtmlContent(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
