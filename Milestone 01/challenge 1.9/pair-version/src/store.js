// simple in-memory store module
export const createStore = () => {
  let tasks = [
    {id: 1, title: 'Walk the dog', done: false},
    {id: 2, title: 'Write notes', done: false}
  ];
  const subscribers = new Set();
  return {
    getTasks: () => tasks.slice(),
    add: (title) => { tasks = [...tasks, {id: Date.now(), title, done:false}]; notify(); },
    toggle: (id) => { tasks = tasks.map(t=> t.id===id? {...t, done: !t.done}: t); notify(); },
    clearCompleted: ()=> { tasks = tasks.filter(t=>!t.done); notify(); },
    subscribe: (fn)=> { subscribers.add(fn); return ()=>subscribers.delete(fn); }
  };
  function notify(){ subscribers.forEach(s=>s()); }
};
