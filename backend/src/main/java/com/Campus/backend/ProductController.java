
package com.Campus.backend;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5174")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> getProducts() {
        return productRepository.findAll();
    }

    @PostMapping
    public Product addProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }

    @PostMapping("/seed")
    public List<Product> addSampleProducts() {
        if (productRepository.count() > 0) {
            return productRepository.findAll();
        }

        String[][] samples = {
            {"Engineering Books", "Books", "500", "Engineering semester books", "📚"},
            {"Headphones", "Electronics", "799", "Good condition headphones", "🎧"},
            {"College Bag", "Accessories", "650", "Spacious college bag", "🎒"},
            {"Lab Coat", "Clothing", "450", "Clean white lab coat", "🥼"},
            {"Scientific Calculator", "Electronics", "350", "Scientific calculator for exams", "🧮"},
            {"Class Notes", "Notes", "200", "Semester notes and records", "📓"}
        };

        for (String[] s : samples) {
            Product p = new Product();
            p.setName(s[0]);
            p.setCategory(s[1]);
            p.setPrice(Double.parseDouble(s[2]));
            p.setDescription(s[3]);
            p.setImageUrl(s[4]);
            p.setSellerName("Campus Seller");
            productRepository.save(p);
        }

        return productRepository.findAll();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long id,
            @RequestBody Product updatedProduct) {
        return productRepository.findById(id).map(product -> {
            product.setName(updatedProduct.getName());
            product.setDescription(updatedProduct.getDescription());
            product.setCategory(updatedProduct.getCategory());
            product.setPrice(updatedProduct.getPrice());
            product.setSellerName(updatedProduct.getSellerName());
            product.setImageUrl(updatedProduct.getImageUrl());
            return ResponseEntity.ok(productRepository.save(product));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        if (!productRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        productRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
