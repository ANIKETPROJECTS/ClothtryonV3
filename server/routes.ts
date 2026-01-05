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
        front: "https://placehold.co/600x800/1a1a1a/D4AF37?text=ONYU+Front",
        back: "https://placehold.co/600x800/1a1a1a/D4AF37?text=ONYU+Back",
        left: "https://placehold.co/600x800/1a1a1a/D4AF37?text=ONYU+Left",
        right: "https://placehold.co/600x800/1a1a1a/D4AF37?text=ONYU+Right"
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
