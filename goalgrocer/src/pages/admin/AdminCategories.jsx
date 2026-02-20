import { useState } from "react";
import AppShell from "../../components/AppShell";
import { deleteCategory, listCategories, upsertCategory } from "../../services/db";

export default function AdminCategories() {
  const [categories, setCategories] = useState(() => listCategories());
  const [editingId, setEditingId] = useState("");
  const [name, setName] = useState("");

  function refresh() {
    setCategories(listCategories());
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    upsertCategory({ id: editingId, name });
    setEditingId("");
    setName("");
    refresh();
  }

  function handleEdit(category) {
    setEditingId(category.id);
    setName(category.name);
  }

  function handleDelete(id) {
    deleteCategory(id);
    refresh();
  }

  return (
    <AppShell title="Admin Categories" subtitle="Create and maintain category taxonomy.">
      <section className="card">
        <form className="actions-row" onSubmit={handleSubmit}>
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
          />
          <button className="btn btn-primary" type="submit">
            {editingId ? "Update" : "Add"}
          </button>
        </form>
      </section>

      <section className="card">
        <h3>Category List</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>
                    <div className="actions-row">
                      <button className="btn btn-ghost" onClick={() => handleEdit(category)}>
                        Edit
                      </button>
                      <button className="btn btn-ghost" onClick={() => handleDelete(category.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
