import { api } from "./api";
import type { Product } from "../types";

export interface ProductPayload {
  name: string;
  description?: string;
  price: number;
}

export function getProducts() {
  return api<Product[]>("/api/products");
}

export function createProduct(payload: ProductPayload) {
  return api<Product>("/api/products", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateProduct(id: string, payload: ProductPayload) {
  return api<Product>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteProduct(id: string) {
  return api<void>(`/api/products/${id}`, { method: "DELETE" });
}
