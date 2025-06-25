import React from "react";
import PropTypes from "prop-types";
import { FaTrash } from "react-icons/fa";

const ProductCard = ({ product, onDelete }) => {
  const defaultImage = "https://via.placeholder.com/300x200?text=No+Image";

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(
          `http://localhost:8000/products/${product.id}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Failed to delete product");
        }

        onDelete(product.id); // Notify parent to remove from UI
      } catch (error) {
        console.error(error);
        alert("Error deleting product");
      }
    }
  };

  return (
    <div className="max-w-xs rounded overflow-hidden shadow-lg bg-white relative group">
      {/* Product Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          className="w-full h-full object-cover cursor-default"
          src={
            product.image
              ? `http://localhost:8000/products/image/${product.image}`
              : defaultImage
          }
          alt={product.name}
          onError={(e) => {
            e.target.src = defaultImage;
          }}
          draggable="false"
        />

        {/* Delete Icon */}
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
        >
          <FaTrash size={14} />
        </button>
      </div>

      {/* Product Name */}
      <div className="px-4 py-3 text-center">
        <h3 className="text-gray-900 font-semibold text-lg truncate">
          {product.name}
        </h3>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default ProductCard;
