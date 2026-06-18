(() => {
  const src = document.body.dataset.md;
  const content = document.getElementById('content');

  const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

  const inline = (value) => escapeHtml(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  function renderTable(rows) {
    const cleanRows = rows.filter((row) => !/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|$/.test(row));
    if (!cleanRows.length) return '';

    const cells = (row) => row.slice(1, -1).split('|').map((cell) => inline(cell.trim()));
    const head = cells(cleanRows[0]).map((cell) => `<th>${cell}</th>`).join('');
    const body = cleanRows.slice(1).map((row) => `<tr>${cells(row).map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('');
    return `<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function render(md) {
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    let html = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line === '---') { html += '<hr>'; continue; }
      if (line.startsWith('# ')) { html += `<h1>${inline(line.slice(2))}</h1>`; continue; }
      if (line.startsWith('## ')) { html += `<h2>${inline(line.slice(3))}</h2>`; continue; }
      if (line.startsWith('### ')) { html += `<h3>${inline(line.slice(4))}</h3>`; continue; }
      if (line.startsWith('> ')) { html += `<blockquote>${inline(line.slice(2))}</blockquote>`; continue; }

      if (line.startsWith('|') && line.endsWith('|')) {
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          rows.push(lines[i].trim());
          i++;
        }
        i--;
        html += renderTable(rows);
        continue;
      }

      if (line.startsWith('- ')) {
        const items = [];
        while (i < lines.length && lines[i].trim().startsWith('- ')) {
          items.push(`<li>${inline(lines[i].trim().slice(2))}</li>`);
          i++;
        }
        i--;
        html += `<ul>${items.join('')}</ul>`;
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(`<li>${inline(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>`);
          i++;
        }
        i--;
        html += `<ol>${items.join('')}</ol>`;
        continue;
      }

      html += `<p>${inline(line)}</p>`;
    }

    return html;
  }

  fetch(src, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error('load failed');
      return response.text();
    })
    .then((markdown) => { content.innerHTML = render(markdown); })
    .catch(() => {
      content.innerHTML = '<p>ページを読み込めませんでした。トップへ戻ってもう一度開いてください。</p>';
    });
})();
