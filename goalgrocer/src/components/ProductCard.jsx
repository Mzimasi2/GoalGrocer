import { currency } from "../services/format";

export default function ProductCard({
  product,
  categoryName,
  onAdd,
  onWishlist,
  onView,
  wishlistActive = false,
}) {
  return (
    <article className="card product-card">
      <div className="card-head">
        <button className="text-link" onClick={() => onView?.(product)}>
          {product.name}
        </button>
        <strong>{currency(product.price)}</strong>
      </div>

      <div className="meta-row">
        <span className="pill">{categoryName || "Uncategorized"}</span>
        {product.isPromotion && <span className="pill pill-hot">Promo</span>}
      </div>

      <div className="meta-row">
        {(product.tags || []).slice(0, 3).map((tag) => (
          <span key={tag} className="pill pill-muted">
            {tag}
          </span>
        ))}
      </div>

      <div className="stat-grid">
        <div>
          <small>Calories</small>
          <div>{product.calories}</div>
        </div>
        <div>
          <small>Protein</small>
          <div>{product.protein}g</div>
        </div>
        <div>
          <small>Views</small>
          <div>{product.viewsCount || 0}</div>
        </div>
      </div>

      <div className="meta-row">
        {(product.goalBadges || []).map((goal) => (
          <span key={goal} className="goal-badge">
            {goal}
          </span>
        ))}
      </div>

      <div className="actions-row">
        <button className="btn btn-primary" onClick={() => onAdd?.(product)}>
          Add to cart
        </button>
        {onWishlist && (
          <button className="btn btn-ghost" onClick={() => onWishlist?.(product)}>
            {wishlistActive ? "Saved" : "Wishlist"}
          </button>
        )}
      </div>
    </article>
  );
}
