import { Component, OnInit, inject, signal, computed, viewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProductTable } from '@modules/productos/components/product-table/product-table';

import { ProductoService } from '@core/service/producto';
import { ApiResponse, ProductInterface } from '@modules/productos/models/product.models';

import { ProductCell } from '@shared/components/product-cell/product-cell';

import { ToastService } from '@shared/services/toast';

import { CartService } from '@core/service/cart';

import { Pagination } from '@shared/utilities/pagination';

@Component({
  selector: 'app-tienda',
  imports: [ProductCell],
  templateUrl: './tienda.html',
  styleUrl: './tienda.css',
})
export class Tienda implements OnInit {
  private productoService = inject(ProductoService);
  private toastService = inject(ToastService);
  protected readonly products = signal<ProductInterface[]>([]);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  protected readonly pagination = new Pagination(5); // para la paginación
  protected readonly searchParam = signal<string>('');
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  protected addToCart(product: ProductInterface): void {
    this.cartService.getCurrentCart().subscribe((cart) => {
      this.cartService.addItem(cart.id, { product_id: product.id, quantity: 1 }).subscribe(() => {
        this.toastService.show(`${product.name} agregado al carrito`, 'success');
        this.router.navigate(['/carrito']);
      });
    });
  }

  protected goToPreviousPage(): void {
    const page = this.pagination.previousPage();
    if (page !== null) this.loadProducts(page);
  }

  protected goToNextPage(): void {
    const page = this.pagination.nextPage();
    if (page !== null) this.loadProducts(page);
  }

  protected onSearch(value: string): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.searchParam.set(value.trim());
      this.pagination.resetPage();
      this.loadProducts(1);
    }, 300);
  }

  private loadProducts(page: number): void {
    this.productoService
      .getAllProducts(page, this.pagination.pageSize, this.searchParam())
      .subscribe((response: ApiResponse) => {
        this.products.set(response.results ?? []);
        this.pagination.updatePage(response, page);
      });
  }

  public ngOnInit(): void {
    this.loadProducts(1);
  }
}
