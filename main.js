document.addEventListener("DOMContentLoaded", function(event) {
  var util = {
    getTodos: function(name) {
      var storedTodos = localStorage.getItem(name);
      return (storedTodos && JSON.parse(storedTodos)) || [];
    },
    storeTodosLocally: function(name, data) {
      localStorage.setItem(name, JSON.stringify(data));
    },
    addEventListeners: function() {
      var addButton = document.getElementById("add-todo");
      addButton.addEventListener('click', function(e) {
        App.createTodo();
      });
      var todoInput = document.getElementById("new-todo");
      todoInput.addEventListener('keyup', function(e) {
        if (e.which === 13) {
          App.createTodo();
        }
      });
      var todoList = document.getElementById("todo-list");
      todoList.addEventListener('click', function(e) {
        if (e.target.className === 'destroy') {
          App.destroyTodo(e);
        }
        if (e.target.className === "toggle") {
          App.toggleTodo(e);
        }
      });
      todoList.addEventListener('dblclick', function(e) {
        if (e.target.tagName === "LABEL") {
          App.editTodo(e);
        }
      });
      todoList.addEventListener('keyup', function(e) {
        if (e.target.className === "edit") {
          util.updateAfterEdit(e);
        }
      });
      todoList.addEventListener('keydown', function(e) {
        if (e.which === 9 ) {
          e.preventDefault();
          util.updateAfterEdit(e);
        }
      })
    },
    dateId: function() {
      return Date.now();
    },
    generateTodoString: function(todo) {
      var todoString = "";
      function addCheckbox() {
        if (todo.completed) {
          return "checked";
        } else {
          return "";
        }
      }
      function addCompletedClass() {
        if (todo.completed) {
          return "class='completed'";
        } else {
          return "";
        }
      }
      function checkForNestedTodos() {
        if (todo.nestedTodos.length) {
          var ulString = "<ul>";
          for (var i = 0; i < todo.nestedTodos.length; i++) {
            var nestedTodoString = util.generateTodoString(todo.nestedTodos[i]);
            ulString += nestedTodoString;
          }
        } else {
          return "";
        }
        ulString = ulString + "</ul>";
        return ulString;
      }
      todoString += `
                    <li ${addCompletedClass()} data-id=${todo.id}>
                      <div class ="view">
                        <input name="toggleComplete" class="toggle" type="checkbox" ${addCheckbox()}>
                        <label for="toggleComplete">${todo.title}</label>
                        <button class="destroy">X</button>
                      </div>
                      <input class="edit" value=${todo.title}>
                      ${checkForNestedTodos()}
                    </li>
      `;
      return todoString;
    },
    findAndToggleTodo: function(arrayOfTodos, idToMatch) {
      arrayOfTodos.forEach(function(todo) {
        if (todo.id === idToMatch) {
          todo.completed = !todo.completed;
        }
        if (todo.nestedTodos.length) {
          return util.findAndToggleTodo(todo.nestedTodos, idToMatch);
        }
      });
    },
    findAndDestroyTodo: function(todos, idToMatch) {
      todos.forEach(function(todo, index) {
        if (todo.id === idToMatch) {
          todos.splice(index, 1);
        }
        if (todo.nestedTodos.length) {
          return util.findAndDestroyTodo(todo.nestedTodos, idToMatch);
        }
      });
    },
    updateAfterEdit: function(e) {
      var viewDiv = e.target.previousElementSibling;
      var viewDivLabel = viewDiv.children[1];
      var hiddenValue = e.target.value;
      if (e.which === 13) { // enter key
        this.findTodoLocation(App.todos, e);
        this.removeEditingClass(e);
        // create a new todo at same level.  open it in editing mode
        this.storeTodosLocally('todoList', App.todos);
        App.renderTodos();
      }
      if (e.which === 27) { // esc key
        e.target.value = viewDivLabel.innerText;
        e.target.blur();
        this.removeEditingClass(e);
      }
      if (e.which === 9) { // tab key
        util.checkForPreviousSiblingLi(e, App.todos);
      }
    },
    removeEditingClass: function(e) {
      var li = e.target.closest("li");
      var liClasses = li.classList;
      liClasses.toggle("editing");
    },
    findTodoLocation: function(todos, e) {
      var idToFind = e.target.parentElement.dataset.id;
      idToFind = parseInt(idToFind);
      todos.forEach(function(todo, index, array) {
        if (todo.id === idToFind) {
          array[index].title = e.target.value.trim();
        }
        if (todo.nestedTodos.length) {
          return util.findTodoLocation(todo.nestedTodos, e);
        }
      });
    },
    checkForPreviousSiblingLi: function(e, todos) {
      var parentLi = e.target.parentElement;
      var previousLi = parentLi.previousElementSibling;
      var parentId = parseInt(parentLi.dataset.id);
      if (previousLi !== null) { // if there is a previous Li todo
        var previousLiId = parseInt(previousLi.dataset.id);
        todos.forEach(function(todo, index, array) {
          if (todo.id === previousLiId) {
            array[index].nestedTodos.push(util.createNestedTodo(e));
            var testWhatAmI = array.splice(index + 1, 1);
          }
          if (todo.nestedTodos.length) {
            return util.checkForPreviousSiblingLi(e, todo.nestedTodos);
          }
        });
      } else { // if there is no previous sibling
        todos.forEach(function(todo, index, array) {
          if (todo.id === parentId) {
            todo.nestedTodos.push(util.createNestedTodo(e));

          }
        });
      }
      this.storeTodosLocally('todoList', App.todos);
      App.renderTodos();
    },
    createNestedTodo: function(e) {
      var value = e.target.value;
      var newTodo = {};
      newTodo.id = util.dateId();
      newTodo.title= value;
      newTodo.nestedTodos = [];
      newTodo.completed = false;
      return newTodo;
    }
  };

  var App = {
    init: function() {
      this.todos = util.getTodos('todoList');
      util.addEventListeners();
      this.renderTodos();
    },
    createTodo: function() {
      var todoInput = document.getElementById('new-todo');
      var val = todoInput.value.trim();
      App.todos.push({
        id: util.dateId(),
        title: val,
        nestedTodos: [/*{id: 6942069, title: "test", nestedTodos: [{id: 999999, title: "testInner", nestedTodos: [], completed: false}], completed: false}*/],
        completed: false
      });
      todoInput.value ='';
      this.renderTodos();
      util.storeTodosLocally('todoList', this.todos);
    },
    destroyTodo: function(e) {
      var elementToDestroy = e.target.closest("li");
      var idToDestroy = parseInt(elementToDestroy.dataset.id);
      util.findAndDestroyTodo(App.todos, idToDestroy);
      this.renderTodos();
      util.storeTodosLocally('todoList', this.todos);
    },
    renderTodos: function() {
      var htmlString = "";
      this.todos.forEach(function(todo) {
        var returnedString = util.generateTodoString(todo);
        htmlString += returnedString;
      });
      var todoList = document.getElementById("todo-list");
      todoList.innerHTML = htmlString;
    },
    toggleTodo: function(e) {
      var elementToToggle = e.target.closest("li");
      var idToToggle = parseInt(elementToToggle.dataset.id);
      util.findAndToggleTodo(App.todos, idToToggle);
      this.renderTodos();
      util.storeTodosLocally('todoList', this.todos);
    },
    editTodo: function(e) {
      var elementToEdit = e.target.closest("li");
      elementToEdit.className += "editing";
      var hiddenInput = elementToEdit.children[1];
      hiddenInput.focus();
      // triggers updateAfterEdit() on keyup
    }
  };
  App.init();
});
