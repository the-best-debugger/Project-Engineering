// Monolithic AI-style generated script (single file)
(function(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container">
      <h1>Vibe Task Manager</h1>
      <div>
        <input id="newTask" placeholder="New task title" />
        <button id="add">Add</button>
      </div>
      <ul class="tasks" id="list"></ul>
      <div class="controls">
        <button id="clear">Clear Completed</button>
      </div>
    </div>`;

  let tasks = [
    {id:1,title:'Buy groceries',done:false},
    {id:2,title:'Read a chapter',done:false}
  ];

  function render(){
    const list = document.getElementById('list');
    list.innerHTML = '';
    tasks.forEach(t=>{
      const li = document.createElement('li');
      li.innerHTML = `<span>${t.title}</span><span><input type=checkbox ${t.done? 'checked':''} data-id=${t.id}></span>`;
      list.appendChild(li);
    });
    attach();
  }

  function attach(){
    document.querySelectorAll('input[type=checkbox]').forEach(cb=>{
      cb.onchange = e=>{
        const id = +e.target.dataset.id;
        const t = tasks.find(x=>x.id===id);
        t.done = e.target.checked; render();
      }
    });
  }

  document.getElementById('add').onclick = ()=>{
    const v = document.getElementById('newTask').value.trim();
    if(!v) return;
    tasks.push({id:Date.now(),title:v,done:false});
    document.getElementById('newTask').value=''; render();
  };

  document.getElementById('clear').onclick = ()=>{ tasks = tasks.filter(t=>!t.done); render(); };

  render();
})();
