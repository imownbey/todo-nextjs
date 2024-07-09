import React, { useState } from "react";
import classnames from "classnames";
import { Todo, TodoUpdate, getTodo, listTodos } from "../todo";
import TodoTextInput from "./todo-text-input";
import { useRep } from "pages/layout";
import { useSubscribe } from "replicache-react";

export function TodoItem({
  todo: _todo,
  onUpdate,
  onDelete,
}: {
  todo: Todo;
  onUpdate: (update: TodoUpdate) => void;
  onDelete: () => void;
}) {
  const { id } = _todo;
  const rep = useRep()
  const [editing, setEditing] = useState(false);

  const handleDoubleClick = () => {
    setEditing(true);
  };

  const todo = useSubscribe(rep, (tx) => getTodo(tx, id), { default: {completed: "UNDEFINED", text: "UNDEFINED"}, dependencies: [id] });
  const todos = useSubscribe(rep, listTodos, { default: undefined });

  const handleSave = (text: string) => {
    if (text.length === 0) {
      onDelete();
    } else {
      onUpdate({ id, text });
    }
    setEditing(false);
  };

  const handleToggleComplete = () =>
    onUpdate({ id, completed: !todo.completed });

  let element;
  if (editing) {
    element = (
      <TodoTextInput
        initial={todo.text}
        onSubmit={handleSave}
        onBlur={handleSave}
      />
    );
  } else {
    element = (
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={todo.completed}
          onChange={handleToggleComplete}
        />
        {!todos && "UNDEFINED"}
        {todos && todos.length}
        <label onDoubleClick={handleDoubleClick}>{todo.text}</label>
        <button className="destroy" onClick={() => onDelete()} />
      </div>
    );
  }

  return (
    <li
      className={classnames({
        completed: todo.completed,
        editing,
      })}
    >
      {element}
    </li>
  );
}
