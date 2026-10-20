(() => {
  const deadlines = Array.isArray(window.DEADLINES) ? window.DEADLINES : [];
  const list = document.querySelector("#deadlineList");
  const template = document.querySelector("#deadlineTemplate");
  const plural = (n, a, b, c) => { n = Math.abs(n) % 100; const n1 = n % 10; if(n > 10 && n < 20) return c; if(n1 > 1 && n1 < 5) return b; if(n1 === 1) return a; return c; };
  const validDate = item => item.due && !Number.isNaN(new Date(item.due).getTime());
  const dateOf = item => new Date(item.due);
  const dateText = date => new Intl.DateTimeFormat("ru-RU", {day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit"}).format(date);
  function timer(date) {
    const total = Math.floor((date.getTime() - Date.now()) / 1000);
    if (total < 0) return "срок прошёл";
    const days = Math.floor(total / 86400);
    const hours = Math.floor(total % 86400 / 3600);
    const minutes = Math.floor(total % 3600 / 60);
    const seconds = total % 60;
    return `${days} ${plural(days,"день","дня","дней")} ${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
  }
  function render() {
    const sorted = [...deadlines].sort((a,b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (!validDate(a)) return 1;
      if (!validDate(b)) return -1;
      return dateOf(a) - dateOf(b);
    });
    list.replaceChildren();
    if (!sorted.length) { list.textContent = "Дедлайны пока не добавлены."; list.className = "empty"; return; }
    sorted.forEach(item => {
      const node = template.content.firstElementChild.cloneNode(true);
      node.querySelector(".deadline-subject").textContent = item.subject;
      const status = node.querySelector(".deadline-status");
      if (item.done) { status.textContent = "Выполнено"; status.classList.add("done"); }
      else if (validDate(item) && dateOf(item) < new Date()) { status.textContent = "Просрочено"; status.classList.add("overdue"); node.classList.add("past"); }
      else if (validDate(item) && dateOf(item) - Date.now() < 48 * 3600000) status.textContent = "Скоро";
      else status.textContent = "В работе";
      node.querySelector(".deadline-title").textContent = item.title;
      node.querySelector(".deadline-description").textContent = item.description || "";
      node.querySelector(".deadline-date").textContent = validDate(item) ? `Сдать до ${dateText(dateOf(item))}` : "Дата не указана";
      node.querySelector(".deadline-timer").textContent = item.done ? "готово ✓" : (validDate(item) ? timer(dateOf(item)) : "укажи дату в deadlines.js");
      const links = node.querySelector(".deadline-links");
      (item.links || []).forEach(resource => {
        const li = document.createElement("li");
        if (resource.url) {
          const a = document.createElement("a"); a.href = resource.url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = resource.name; li.append(a);
        } else li.textContent = `${resource.name} — ссылка не добавлена`;
        links.append(li);
      });
      list.append(node);
    });
  }
  render();
  setInterval(render, 1000);
})();
