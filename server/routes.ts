import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  app.get(api.products.getBySku.path, async (req, res) => {
    const product = await storage.getProductBySku(req.params.sku);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  // Seed initial data if empty
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getProducts();
  if (existing.length === 0) {
    await storage.createProduct({
      name: "ONYU Signature Tee",
      description: "Premium cotton blend with a tailored fit. Designed for the modern visionary.",
      price: 4999, // $49.99
      sku: "ONYU-TEE-001",
      images: {
        front: "/src/assets/generated_images/premium_black_t-shirt_front_view.png",
        back: "/src/assets/generated_images/premium_black_t-shirt_back_view.png",
        left: "/src/assets/generated_images/premium_black_t-shirt_left_side_view.png",
        right: "/src/assets/generated_images/premium_black_t-shirt_right_side_view.png"
      },
      features: [
        "100% Organic Cotton",
        "Tailored Fit",
        "Breathable Fabric",
        "Sustainable Production"
      ]
    });
  }
}
