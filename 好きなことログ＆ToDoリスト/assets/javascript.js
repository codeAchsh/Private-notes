// ------------------------- 初期化 -------------------------
let currentTemplate = localStorage.getItem('template') || 'default';
document.body.setAttribute('data-template', currentTemplate);

window.onload = function () {
  document.getElementById('templateSelect').value = currentTemplate;
  const storedTitle = localStorage.getItem(`${currentTemplate}_lastTitle`) || '';
  document.getElementById('title').value = storedTitle;
  renderSavedTitleOptions();
  loadAllFields();

  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }
};

// ------------------------- タイトルキー生成 -------------------------
function getTitleKey(title = null) {
  const t = title || document.getElementById('title')?.value.trim();
  return t ? `${currentTemplate}_${t}` : `${currentTemplate}_untitled`;
}

// ------------------------- 保存ボタンで保存 -------------------------
function confirmSaveTitle() {
  const title = document.getElementById('title').value.trim();

  if (!title) {
    alert("タイトルが空です。保存できません。");
    return;
  }

  const key = `${currentTemplate}_titles`;
  let titles = JSON.parse(localStorage.getItem(key)) || [];

  if (!titles.includes(title)) {
    titles.push(title);
    localStorage.setItem(key, JSON.stringify(titles));
    alert(`「${title}」を保存しました`);
  } else {
    alert(`「${title}」はすでに保存されています`);
  }

  localStorage.setItem(`${currentTemplate}_lastTitle`, title);
  saveAllFields();
  renderSavedTitleOptions();
}

// ------------------------- 保存済みタイトルの読み込み -------------------------
function loadSelectedTitle() {
  const select = document.getElementById('savedTitles');
  const selected = Array.from(select.selectedOptions).map(option => option.value);
  if (selected.length === 0) return;

  // 最初の選択タイトルだけ読み込む仕様です（複数選択は表示対応していません）
  const title = selected[0];
  document.getElementById('title').value = title;
  localStorage.setItem(`${currentTemplate}_lastTitle`, title);
  loadAllFields();

  // 選択肢の選択状態をクリアしてから再選択（UI整備）
  Array.from(select.options).forEach(opt => opt.selected = false);
  select.querySelector(`option[value="${title}"]`).selected = true;
}

// ------------------------- 選択したタイトルを削除 -------------------------
function deleteSelectedTitles() {
  const select = document.getElementById('savedTitles');
  const selected = Array.from(select.selectedOptions).map(option => option.value);

  if (selected.length === 0) {
    alert("削除するタイトルを選択してください。");
    return;
  }

  const key = `${currentTemplate}_titles`;
  let titles = JSON.parse(localStorage.getItem(key)) || [];

  titles = titles.filter(t => !selected.includes(t));
  localStorage.setItem(key, JSON.stringify(titles));

  // 関連データも削除
  selected.forEach(title => {
    const prefix = `${currentTemplate}_${title}`;
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(prefix)) {
        localStorage.removeItem(k);
      }
    });
  });

  renderSavedTitleOptions();
  alert("選択したタイトルを削除しました。");
}

// ------------------------- 保存・読込処理 -------------------------
function saveAllFields() {
  const key = getTitleKey();
  ['venue', 'date', 'cast', 'memo', 'next'].forEach(id => {
    const el = document.getElementById(id);
    if (el) localStorage.setItem(`${key}_${id}`, el.value);
  });
  document.querySelectorAll('.fav').forEach((el, i) => {
    localStorage.setItem(`${key}_fav${i}`, el.checked);
  });
  saveTodoList();
}

function loadAllFields() {
  const key = getTitleKey();
  ['venue', 'date', 'cast', 'memo', 'next'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = localStorage.getItem(`${key}_${id}`) || '';
  });
  document.querySelectorAll('.fav').forEach((el, i) => {
    el.checked = localStorage.getItem(`${key}_fav${i}`) === 'true';
  });
  loadTodoList();
  loadPhoto();
}

// ------------------------- ToDoリスト -------------------------
function addTodo() {
  const ul = document.getElementById('todo');
  const li = document.createElement('li');
  li.setAttribute('contenteditable', 'true');
  li.innerHTML = '<input type="checkbox"> 新しい項目 <button onclick="removeTodo(this)">❌</button>';
  ul.appendChild(li);
  saveTodoList();
}

function removeTodo(button) {
  button.parentElement.remove();
  saveTodoList();
}

function saveTodoList() {
  const key = getTitleKey();
  const items = Array.from(document.querySelectorAll('#todo li')).map(li => li.innerHTML);
  localStorage.setItem(`${key}_todoList`, JSON.stringify(items));
}

function loadTodoList() {
  const key = getTitleKey();
  const saved = localStorage.getItem(`${key}_todoList`);
  const ul = document.getElementById('todo');
  ul.innerHTML = '';
  if (saved) {
    JSON.parse(saved).forEach(html => {
      const li = document.createElement('li');
      li.setAttribute('contenteditable', 'true');
      li.innerHTML = html;
      ul.appendChild(li);
    });
  }
}

// ------------------------- 思い出の一枚（写真アップロード・縮小保存） -------------------------
document.getElementById('photoUpload').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  resizeImage(file, 300, function(resizedDataUrl) {  // 最大幅300pxに縮小
    try {
      const key = getTitleKey() + '_photo';
      localStorage.setItem(key, resizedDataUrl);
      showPhoto(resizedDataUrl);
    } catch (e) {
      alert('画像の保存に失敗しました。ファイルサイズが大きすぎる可能性があります。');
      console.error(e);
    }
  });
});

// 画像をCanvasで縮小・圧縮する関数
function resizeImage(file, maxWidth, callback) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = height * (maxWidth / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // JPEGで画質80%に圧縮
      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

      // ←ここでサイズチェックを入れる
      const maxDataUrlLength = 4 * 1024 * 1024; // 約4MB
      if (resizedDataUrl.length > maxDataUrlLength) {
        alert('画像が大きすぎます。もっと小さい画像にしてください。');
        return;  // コールバック呼び出さずに終了
      }

      callback(resizedDataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ------------------- 写真表示 ・削除 -------------------------
function showPhoto(dataUrl) {
  const container = document.getElementById('photoPreview');
  container.innerHTML = `<img src="${dataUrl}" alt="思い出の写真" style="max-width:100%; height:auto;">`;
}

function loadPhoto() {
  const key = getTitleKey() + '_photo';
  const dataUrl = localStorage.getItem(key);
  if (dataUrl) showPhoto(dataUrl);
}


function clearPhoto() {
  const key = getTitleKey() + '_photo';
  localStorage.removeItem(key);
  document.getElementById('photoPreview').innerHTML = '';
  alert("写真を削除しました。");
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('clearPhotoBtn').addEventListener('click', clearPhoto);
});


// ------------------------- タイトル一覧表示 -------------------------
function renderSavedTitleOptions() {
  const select = document.getElementById('savedTitles');
  if (!select) return;

  const key = `${currentTemplate}_titles`;
  const titles = JSON.parse(localStorage.getItem(key)) || [];

  select.innerHTML = '';
  titles.forEach(title => {
    const option = document.createElement('option');
    option.value = title;
    option.textContent = title;
    select.appendChild(option);
  });

  const current = document.getElementById('title').value.trim();
  if (current) {
    Array.from(select.options).forEach(opt => {
      if (opt.value === current) opt.selected = true;
    });
  }
}

// ------------------------- テンプレート切替 -------------------------
function switchTemplate(template) {
  localStorage.setItem('template', template);
  location.reload();
}

// ------------------------- ダークモード切替 -------------------------
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// ------------------------- バックアップエクスポート -------------------------
function exportData() {
  const allKeys = Object.keys(localStorage);
  const data = {};

  allKeys.forEach(key => {
    if (key.startsWith(currentTemplate)) {
      data[key] = localStorage.getItem(key);
    }
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentTemplate}_backup.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ------------------------- バックアップ読み込み -------------------------
function importData() {
  const fileInput = document.getElementById('importFile');
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      for (let key in data) {
        localStorage.setItem(key, data[key]);
      }
      alert("データを読み込みました。ページを再読み込みします。");
      location.reload();
    } catch (e) {
      alert("読み込みに失敗しました。正しいファイルですか？");
    }
  };
  reader.readAsText(file);
}
