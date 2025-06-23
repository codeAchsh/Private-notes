const defaultData = {
  "shopping-list": [
    { text: "牛乳", checked: false },
    { text: "卵", checked: false },
    { text: "にんじん", checked: false }
  ],
  "housework-list": [
    { text: "洗濯", checked: false },
    { text: "掃除機かける", checked: false },
    { text: "夕食の準備", checked: false }
  ],
  "headings": [
    "🛒 買い物メモ（カスタマイズ可）",
    "🧹 家事リスト（カスタマイズ可）"
  ]
};

window.addEventListener("DOMContentLoaded", () => {
  const initialized = localStorage.getItem("initialized");
  if (!initialized) {
    localStorage.setItem("shopping-list", JSON.stringify(defaultData["shopping-list"]));
    localStorage.setItem("housework-list", JSON.stringify(defaultData["housework-list"]));
    localStorage.setItem("heading-0", defaultData.headings[0]);
    localStorage.setItem("heading-1", defaultData.headings[1]);
    localStorage.setItem("initialized", "true");
  }

  loadList("shopping-list");
  loadList("housework-list");
  loadHeadings();

  // Enterで追加
  document.getElementById("shopping-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addShoppingItem();
  });

  document.getElementById("housework-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addHouseworkItem();
  });

  // Ctrl + Enter でチェック済み削除
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      removeCheckedItems("shopping-list");
      removeCheckedItems("housework-list");
    }
  });
});

function addShoppingItem() {
  const input = document.getElementById("shopping-input");
  const value = input.value.trim();
  if (!value) return;
  createListItem(value, "shopping-list");
  input.value = "";
  saveList("shopping-list");
}

function addHouseworkItem() {
  const input = document.getElementById("housework-input");
  const value = input.value.trim();
  if (!value) return;
  createListItem(value, "housework-list");
  input.value = "";
  saveList("housework-list");
}

function createListItem(text, listId, checked = false) {
  const li = document.createElement("li");
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = checked;
  checkbox.addEventListener("change", () => saveList(listId));

  const span = document.createElement("span");
  span.textContent = text;

  label.appendChild(checkbox);
  label.appendChild(span);
  li.appendChild(label);
  document.getElementById(listId).appendChild(li);
}

function removeCheckedItems(listId) {
  const list = document.getElementById(listId);
  const items = list.querySelectorAll("input[type='checkbox']:checked");
  items.forEach((checkbox) => {
    checkbox.closest("li").remove();
  });
  saveList(listId);
}

function saveList(listId) {
  const list = document.getElementById(listId);
  const items = [];
  list.querySelectorAll("li").forEach(li => {
    const checkbox = li.querySelector("input[type='checkbox']");
    const span = li.querySelector("span");
    items.push({ text: span.textContent, checked: checkbox.checked });
  });
  localStorage.setItem(listId, JSON.stringify(items));
}

function loadList(listId) {
  const list = document.getElementById(listId);
  list.innerHTML = "";
  const items = JSON.parse(localStorage.getItem(listId)) || [];
  items.forEach(item => {
    createListItem(item.text, listId, item.checked);
  });
}

function saveHeadings() {
  document.querySelectorAll("h2[contenteditable='true']").forEach((h2, index) => {
    localStorage.setItem("heading-" + index, h2.textContent);
  });
}

function loadHeadings() {
  document.querySelectorAll("h2[contenteditable='true']").forEach((h2, index) => {
    const saved = localStorage.getItem("heading-" + index);
    if (saved) h2.textContent = saved;
    h2.addEventListener("input", saveHeadings);
  });
}