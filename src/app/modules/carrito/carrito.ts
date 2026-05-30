import { Component, OnInit, inject, signal, viewChild, ElementRef, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '@core/service/cart';
import { CartInterface, CartItemInterface } from '@modules/carrito/carrito.models';
import { ToastService } from '@shared/services/toast';
import { ProductCell } from '@shared/components/product-cell/product-cell';


@Component({
  selector: 'app-carrito',
  imports: [ReactiveFormsModule, RouterLink, ProductCell],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  private readonly checkoutDialogRef =
    viewChild.required<ElementRef<HTMLDialogElement>>('checkoutDialog');
  private readonly confirmDeleteDialogRef =
    viewChild.required<ElementRef<HTMLDialogElement>>('confirmDeleteDialog');
  protected readonly pendingDeleteId = signal<number | null>(null);

  protected readonly cart = signal<CartInterface | null>(null);

  protected readonly checkoutForm = this.fb.nonNullable.group({
    shipping_address: ['', [Validators.required, Validators.minLength(5)]],
    notes: [''],
  });

  private loadCart(): void {
    this.cartService.getCurrentCart().subscribe((cart) => {
      this.cart.set(cart);
    });
  }

  public ngOnInit(): void {
    this.loadCart();
  }

  protected updateQuantity(item: CartItemInterface, quantity: number): void {
    const cart = this.cart();
    if (!cart || quantity < 1) return;

    this.cartService.updateItem(cart.id, { item_id: item.id, quantity }).subscribe((updated) => {
      this.cart.set(updated);
    });
  }

  protected readonly pendingDeleteName = computed(() => {
    const id = this.pendingDeleteId();
    if (id === null) return '';
    return this.cart()?.items?.find((i) => i.id === id)?.product_name ?? `ID ${id}`;
  });

  protected removeItem(item: CartItemInterface): void {
    this.pendingDeleteId.set(item.id);
    queueMicrotask(() => this.confirmDeleteDialogRef().nativeElement.showModal());
  }
  
  protected confirmDelete(): void {
    const id = this.pendingDeleteId();
    const cart = this.cart();
    if (id === null || !cart) return;

    const item = cart.items.find((i) => i.id === id);
    if (!item) return;

    this.cartService.removeItem(cart.id, id).subscribe((updated) => {
      this.cart.set(updated);
      this.toastService.show('Producto quitado del carrito', 'success');
      this.closeConfirmDeleteModal();
    });
  }

  protected closeConfirmDeleteModal(): void {
    this.confirmDeleteDialogRef().nativeElement.close();
    this.pendingDeleteId.set(null);
  }

  protected onConfirmDeleteBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeConfirmDeleteModal();
    }
  }

  protected closeCheckout(): void {
    this.checkoutDialogRef().nativeElement.close();
  }

  protected onCheckoutBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeCheckout();
    }
  }

  protected openCheckout(event: Event): void {
    event.stopPropagation();

    const cart = this.cart();
    if (!cart?.items?.length) {
      return;
    }

    this.checkoutForm.reset({ shipping_address: '', notes: '' });

    const dialog = this.checkoutDialogRef().nativeElement;

    // setTimeout evita que el mismo clic que abre el modal lo cierre por el backdrop
    setTimeout(() => dialog.showModal(), 0);
  }

  protected confirmCheckout(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const cart = this.cart();
    if (!cart) return;

    const { shipping_address, notes } = this.checkoutForm.getRawValue();

    this.cartService
      .checkout(cart.id, { shipping_address, notes: notes || undefined })
      .subscribe(() => {
        this.closeCheckout();
        this.toastService.show('Compra realizada correctamente', 'success');
        this.router.navigate(['/mis-pedidos']);
      });
  }
}
