import { FormEvent, useState } from "react";
import type { Product } from "../../types";
import {
  createProduct,
  deleteProduct,
  updateProduct
} from "../../services/productService";

interface ProductSectionProps {
  products: Product[];
  onReload: () => Promise<void>;
  onClearError: () => void;
  onError: (err: unknown) => void;
}

const initialProductForm = {
  id: "",
  name: "",
  description: "",
  price: ""
};

export function ProductSection({
  products,
  onReload,
  onClearError,
  onError
}: ProductSectionProps) {
  const [productForm, setProductForm] = useState(initialProductForm);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onClearError();
    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price)
    };

    try {
      if (productForm.id) {
        await updateProduct(productForm.id, payload);
      } else {
        await createProduct(payload);
      }

      setProductForm(initialProductForm);
      await onReload();
    } catch (err) {
      onError(err);
    }
  };

  const startEdit = (product: Product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      price: product.price.toString()
    });
  };

  const handleDelete = async (id: string) => {
    onClearError();
    try {
      await deleteProduct(id);
      await onReload();
    } catch (err) {
      onError(err);
    }
  };

  return (
    <div className="row g-4">
      <div className="col-lg-5">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">
              {productForm.id ? "Edit Product" : "Create Product"}
            </h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  className="form-control"
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      name: event.target.value
                    }))
                  }
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      description: event.target.value
                    }))
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Price</label>
                <input
                  type="number"
                  className="form-control"
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      price: event.target.value
                    }))
                  }
                  required
                />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {productForm.id ? "Update" : "Create"}
                </button>
                {productForm.id && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setProductForm(initialProductForm)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="col-lg-7">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Product List</h5>
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="fw-semibold">{product.name}</div>
                        <small className="text-muted">
                          {product.description}
                        </small>
                      </td>
                      <td>{product.price}</td>
                      <td>{new Date(product.createdAtUtc).toLocaleString()}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => startEdit(product)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(product.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted">
                        No products
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
