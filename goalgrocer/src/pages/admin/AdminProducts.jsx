import { useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import {
  deleteProduct,
  listCategories,
  listProducts,
  upsertProduct,
} from "../../services/db";

const emptyForm = {
  id: "",
  name: "",
  price: "",
  cost: "",
  categoryId: "",
  tags: "",
  calories: "",
  protein: "",
  goalBadges: "Weight Loss,Maintenance",
  imageUrl: "",
  isPromotion: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState(() => listProducts());
  const [categories, setCategories] = useState(() => listCategories());
  const [form, setForm] = useState(emptyForm);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  function refresh() {
    setProducts(listProducts());
    setCategories(listCategories());
  }

  function onSubmit(event) {
    event.preventDefault();
    upsertProduct(form);
    setForm(emptyForm);
    refresh();
  }

  function onEdit(product) {
    setForm({
      ...product,
      tags: (product.tags || []).join(","),
      goalBadges: (product.goalBadges || []).join(","),
    });
  }

  function onDelete(productId) {
    deleteProduct(productId);
    refresh();
  }

  return (
    <AppShell title="Admin Products" subtitle="Add, edit and delete products.">
      <section className="card">
        <h3>{form.id ? "Edit Product" : "Add Product"}</h3>
        <form className="form-grid" onSubmit={onSubmit}>
          <input
            className="field"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="grid-two">
            <input
              className="field"
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <input
              className="field"
              type="number"
              placeholder="Cost"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              required
            />
          </div>

          <select
            className="field"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            className="field"
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />

          <input
            className="field"
            placeholder="Goal badges (comma separated)"
            value={form.goalBadges}
            onChange={(e) => setForm({ ...form, goalBadges: e.target.value })}
          />

          <div className="grid-two">
            <input
              className="field"
              type="number"
              placeholder="Calories"
              value={form.calories}
              onChange={(e) => setForm({ ...form, calories: e.target.value })}
            />
            <input
              className="field"
              type="number"
              placeholder="Protein"
              value={form.protein}
              onChange={(e) => setForm({ ...form, protein: e.target.value })}
            />
          </div>

          <input
            className="field"
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />

          <label>
            <input
              type="checkbox"
              checked={form.isPromotion}
              onChange={(e) => setForm({ ...form, isPromotion: e.target.checked })}
            />{" "}
            Promotion
          </label>

          <div className="actions-row">
            <button className="btn btn-primary" type="submit">
              {form.id ? "Update product" : "Add product"}
            </button>
            {form.id && (
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setForm(emptyForm)}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <h3>Product List</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Cost</th>
                <th>Sold</th>
                <th>Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{categoryMap[product.categoryId] || product.categoryId}</td>
                  <td>{product.price}</td>
                  <td>{product.cost}</td>
                  <td>{product.soldCount || 0}</td>
                  <td>{product.viewsCount || 0}</td>
                  <td>
                    <div className="actions-row">
                      <button className="btn btn-ghost" onClick={() => onEdit(product)}>
                        Edit
                      </button>
                      <button className="btn btn-ghost" onClick={() => onDelete(product.id)}>
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
