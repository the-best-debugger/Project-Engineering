import { createStore } from './src/store.js';
import { TaskList } from './src/components/TaskList.js';

const root = document.getElementById('root');
const container = document.createElement('div'); container.className='app';
container.innerHTML = `
  <h1>Pair Task Manager</h1>
  <div>
    <input id="title" placeholder="Task title" />
    <button id="add">Add</button>
  </div>
  <div id="list-root"></div>
  <div class="controls"><button id="clear">Clear Completed</button></div>
`;
root.appendChild(container);

const store = createStore();
const listRoot = document.getElementById('list-root');
TaskList(listRoot, store);

document.getElementById('add').addEventListener('click', ()=>{
  const v = document.getElementById('title').value.trim();
  if(!v) return;
  store.add(v); document.getElementById('title').value='';
});

document.getElementById('clear').addEventListener('click', ()=> store.clearCompleted());
