import { Component, OnInit, inject, signal } from '@angular/core';
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

  protected goToPreviousPage(): void {
    const page = this.pagination.previousPage();
    if (page !== null) this.loadOrders(page);
  }

  protected goToNextPage(): void {
    const page = this.pagination.nextPage();
    if (page !== null) this.loadOrders(page);
  }

  private loadOrders(page: number): void {
    this.orderService.getOrders(page, this.pagination.pageSize).subscribe((response: OrdersApiResponse) => {
      this.orders.set(response.results ?? []);
      this.pagination.updatePage(response, page);
    });
  }

  protected canCancel(order: OrderInterface): boolean {
    return order.status === 'pending' || order.status === 'processing';
  }

  protected cancelOrder(order: OrderInterface): void {
    this.orderService.cancelOrder(order.id).subscribe(() => {
      this.toastService.show(`Orden #${order.id} cancelada`, 'success');
      this.loadOrders(this.pagination.currentPage());
    });
  }

  public ngOnInit(): void {
    this.loadOrders(1);
  }
}
