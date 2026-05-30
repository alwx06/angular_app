import { Component, OnInit, inject, signal, viewChild, ElementRef, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '@shared/services/toast';
import { ProductCell } from '@shared/components/product-cell/product-cell';
import { DatePipe } from '@angular/common';

import { OrderService } from '@core/service/order';
import { OrderInterface, OrdersApiResponse } from '@modules/pedidos/order.model';
import { Pagination } from '@shared/utilities/pagination';
@Component({
  selector: 'app-pedidos',
  imports: [RouterLink, DatePipe, ProductCell],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos {
  private readonly orderService = inject(OrderService);
  private readonly toastService = inject(ToastService);
  protected readonly orders = signal<OrderInterface[]>([]);
  protected pagination = new Pagination(15);
  private readonly checkoutDialogRef =
    viewChild.required<ElementRef<HTMLDialogElement>>('checkoutDialog');
  private readonly confirmDeleteDialogRef =
    viewChild.required<ElementRef<HTMLDialogElement>>('confirmDeleteDialog');
  protected readonly pendingDeleteId = signal<number | null>(null);

  protected goToPreviousPage(): void {
    const page = this.pagination.previousPage();
    if (page !== null) this.loadOrders(page);
  }

  protected goToNextPage(): void {
    const page = this.pagination.nextPage();
    if (page !== null) this.loadOrders(page);
  }

  private loadOrders(page: number): void {
    this.orderService
      .getOrders(page, this.pagination.pageSize)
      .subscribe((response: OrdersApiResponse) => {
        this.orders.set(response.results ?? []);
        this.pagination.updatePage(response, page);
      });
  }

  protected canCancel(order: OrderInterface): boolean {
    return order.status === 'pending' || order.status === 'processing';
  }

  protected readonly pendingDeleteName = computed(() => {
    const id = this.pendingDeleteId();
    if (id === null) return '';
    return `Orden #${id}`;
  });

  // 3. Cambia cancelOrder para que abra el modal
  protected cancelOrder(order: OrderInterface): void {
    this.pendingDeleteId.set(order.id);
    queueMicrotask(() => this.confirmDeleteDialogRef().nativeElement.showModal());
  }

  // 4. Agrega confirmCancel que cancela de verdad
  protected confirmCancel(): void {
    const id = this.pendingDeleteId();
    if (id === null) return;

    this.orderService.cancelOrder(id).subscribe(() => {
      this.toastService.show(`Orden #${id} cancelada`, 'success');
      this.loadOrders(this.pagination.currentPage());
      this.closeConfirmDeleteModal();
    });
  }

  protected closeConfirmDeleteModal(): void {
    this.confirmDeleteDialogRef().nativeElement.close();
    this.pendingDeleteId.set(null);
  }

  protected onConfirmDeleteBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeConfirmDeleteModal();
  }

  public ngOnInit(): void {
    this.loadOrders(1);
  }
}
