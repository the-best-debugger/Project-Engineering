export function TaskItem(task, onToggle){
  const li = document.createElement('li');
  const left = document.createElement('span');
  left.textContent = task.title;
  const cb = document.createElement('input');
  cb.type = 'checkbox'; cb.checked = task.done;
  cb.addEventListener('change', ()=> onToggle(task.id));
  li.appendChild(left);
  li.appendChild(cb);
  return li;
}
