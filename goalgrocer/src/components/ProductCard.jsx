import { useMemo, useState } from "react";
import { currency } from "../services/format";

export default function ProductCard({
  product,
  categoryName,
  onAdd,
  onWishlist,
  onView,
  wishlistActive = false,
}) {
  const [imageBroken, setImageBroken] = useState(false);

  const imageUrl = useMemo(() => {
    if (imageBroken) return "";
    return String(product.imageUrl || "").trim();
  }, [imageBroken, product.imageUrl]);

  const badgeLabel = useMemo(() => {
    if (product.isPromotion) return "Promo";
    if ((product.soldCount || 0) >= 120) return "Best seller";
    if ((product.viewsCount || 0) <= 8) return "New";
    return "";
  }, [product.isPromotion, product.soldCount, product.viewsCount]);

  return (
    <article className="card product-card">
      <div className="product-media">
        {badgeLabel && <span className="product-badge">{badgeLabel}</span>}
        {imageUrl ? (
          <img
            className="product-image"
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImageBroken(true)}
          />
        ) : (
          <div className="product-image-fallback" aria-label={`${product.name} image placeholder`}>
            <span>GoalGrocer</span>
          </div>
        )}
      </div>

      <div className="product-body">
        <div className="product-top-row">
          <button className="product-title" title={product.name} onClick={() => onView?.(product)}>
            {product.name}
          </button>
          <strong className="product-price">{currency(product.price)}</strong>
        </div>

        <div className="product-meta">
          <span>{categoryName || "Uncategorized"}</span>
          <span>•</span>
          <span>{product.protein}g protein</span>
          <span>•</span>
          <span>{product.calories} kcal</span>
        </div>

        <div className="product-tag-row">
          {(product.goalBadges || []).slice(0, 3).map((goal) => (
            <span key={goal} className="goal-badge">
              {goal}
            </span>
          ))}
          {(product.tags || []).slice(0, 2).map((tag) => (
            <span key={tag} className="pill pill-muted">
              {tag}
            </span>
          ))}
        </div>

        <div className="product-actions">
          <button className="btn btn-primary" onClick={() => onAdd?.(product)}>
            Add to cart
          </button>
        </div>
        {onWishlist && (
          <div className="product-wishlist-row">
            <button className="btn btn-ghost" onClick={() => onWishlist?.(product)}>
              {wishlistActive ? "Saved" : "Wishlist"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
