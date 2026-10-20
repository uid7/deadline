(() => {
  const allDeadlines = Array.isArray(window.DEADLINES) ? window.DEADLINES : [];
  const list = document.querySelector("#deadlineList");
  const template = document.querySelector("#deadlineTemplate");
  const searchInput = document.querySelector("#searchInput");
  const filters = document.querySelector("#filters");
  const subjectLinks = document.querySelector("#subjectLinks");
  let semester = 1;
  let activeFilter = "all";
  let search = "";

  const subjectsForSemester = () => [...new Set(allDeadlines.filter(x => Number(x.semester) === semester).map(x => x.subject))];
  const dateFor = item => new Date(item.due);
  const validDate = item => item.due && !Number.isNaN(dateFor(item).getTime());
  const fmtDate = date => new Intl.DateTimeFormat("ru-RU", {day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit"}).format(date);
  const plural = (n, one, few, many) => { n = Math.abs(n) % 100; const n1 = n % 10; if(n > 10 && n < 20) return many; if(n1 > 1 && n1 < 5) return few; if(n1 === 1) return one; return many; };
  function countdown(date) {
    const diff = date.getTime() - Date.now();
    if (diff < 0) return {main:"Срок прошёл", sub:"проверь статус задания", overdue:true};
    const totalMinutes = Math.floor(diff / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return {main:`${days} ${plural(days,"день","дня","дней")} ${hours} ч`, sub:`и ${minutes} мин`};
    if (hours > 0) return {main:`${hours} ч ${minutes} мин`, sub:"меньше суток"};
    return {main:`${minutes} мин`, sub:"пора заканчивать"};
  }
  function status(item) {
    if (item.done) return {label:"Выполнено", cls:"done"};
    if (!validDate(item)) return {label:"Укажи дату", cls:"soon"};
    const diff = dateFor(item).getTime() - Date.now();
    if (diff < 0) return {label:"Просрочено", cls:"urgent"};
    if (diff < 48 * 60 * 60 * 1000) return {label:"Срочно", cls:"urgent"};
    if (diff < 7 * 24 * 60 * 60 * 1000) return {label:"Скоро", cls:"soon"};
    return {label:"Впереди", cls:""};
  }
  function setFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll("[data-filter]").forEach(btn => btn.classList.toggle("selected", btn.dataset.filter === filter));
    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.filter === filter));
    render();
  }
  function makeFilterButton(label, filter, side=false) {
    const button = document.createElement("button");
    button.className = side ? "side-filter" : "filter-btn";
    button.dataset.filter = filter;
    button.textContent = label;
    if (side) {
      const dot = document.createElement("span"); dot.className = "side-dot"; button.prepend(dot);
    }
    button.addEventListener("click", () => setFilter(filter));
    return button;
  }
  function buildFilters() {
    filters.replaceChildren();
    subjectLinks.replaceChildren();
    const all = makeFilterButton("Все", "all");
    all.classList.add("active"); filters.append(all);
    const sideAll = makeFilterButton("Все предметы", "all", true); sideAll.classList.add("selected");
    document.querySelector(".side-filter[data-filter='all']").replaceWith(sideAll);
    subjectsForSemester().forEach(subject => {
      filters.append(makeFilterButton(subject, subject));
      subjectLinks.append(makeFilterButton(subject, subject, true));
    });
  }
  function render() {
    const items = allDeadlines.filter(item => Number(item.semester) === semester)
      .filter(item => activeFilter === "all" || item.subject === activeFilter)
      .filter(item => `${item.subject} ${item.title} ${item.description || ""}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a,b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (!validDate(a)) return 1;
        if (!validDate(b)) return -1;
        return dateFor(a) - dateFor(b);
      });
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("div"); empty.className = "empty-state";
      empty.innerHTML = "<strong>Ничего не нашлось</strong>Попробуй изменить фильтр или поисковый запрос.";
      list.append(empty);
    }
    items.forEach(item => {
      const node = template.content.firstElementChild.cloneNode(true);
      node.querySelector(".subject-tag").textContent = item.subject;
      const st = status(item); const statusNode = node.querySelector(".status-tag");
      statusNode.textContent = st.label; if (st.cls) statusNode.classList.add(st.cls);
      node.querySelector(".task-title").textContent = item.title;
      node.querySelector(".task-description").textContent = item.description || "";
      node.querySelector(".due-date").textContent = validDate(item) ? `Сдать до ${fmtDate(dateFor(item))}` : "Дата не указана";
      const link = node.querySelector(".task-link");
      if (item.link) { link.href = item.link; } else { link.remove(); }
      const count = validDate(item) ? countdown(dateFor(item)) : {main:"—",sub:"укажи дату"};
      node.querySelector(".count-value").textContent = item.done ? "Готово ✓" : count.main;
      node.querySelector(".count-sub").textContent = item.done ? "можно выдохнуть" : count.sub;
      if (count.overdue && !item.done) node.classList.add("is-overdue");
      if (item.done) node.classList.add("is-done");
      list.append(node);
    });
    const semesterItems = allDeadlines.filter(x => Number(x.semester) === semester);
    const unfinished = semesterItems.filter(x => !x.done);
    document.querySelector("#activeCount").textContent = `${unfinished.length} ${plural(unfinished.length,"активная задача","активные задачи","активных задач")}`;
    document.querySelector("#totalCount").textContent = semesterItems.length;
    const done = semesterItems.filter(x => x.done).length;
    document.querySelector("#progressText").textContent = `${done} из ${semesterItems.length} выполнено`;
    document.querySelector("#progressBar").style.width = `${semesterItems.length ? done / semesterItems.length * 100 : 0}%`;
    const next = unfinished.filter(validDate).sort((a,b) => dateFor(a)-dateFor(b))[0];
    document.querySelector("#nextTitle").textContent = next ? next.title : "Пока нет ближайших дедлайнов";
    document.querySelector("#nextSubject").textContent = next ? next.subject : "Добавь задания в deadlines.js";
    document.querySelector("#nextCountdown").textContent = next ? countdown(dateFor(next)).main : "—";
    document.querySelector("#pageTitle").textContent = `${semester} семестр`;
  }
  document.querySelectorAll(".semester").forEach(button => button.addEventListener("click", () => {
    semester = Number(button.dataset.semester);
    activeFilter = "all";
    document.querySelectorAll(".semester").forEach(b => b.classList.toggle("active", b === button));
    buildFilters(); render();
  }));
  searchInput.addEventListener("input", event => { search = event.target.value; render(); });
  buildFilters(); render();
  setInterval(render, 30000);
})();
