import { TaskItem } from './TaskItem.js';

export function TaskList(root, store){
  const ul = document.createElement('ul'); ul.className = 'task-list';
  function render(){
    ul.innerHTML = '';
    store.getTasks().forEach(t=> ul.appendChild(TaskItem(t, store.toggle)));
  }
  store.subscribe(render);
  render();
  root.appendChild(ul);
  return { render };
}
