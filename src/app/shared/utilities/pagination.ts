import { signal } from '@angular/core';

export class Pagination {
  readonly totalCount = signal(0);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly hasNext = signal(false);
  readonly hasPrevious = signal(false);

  constructor(public readonly pageSize: number = 5) {}

  updatePage(response: {
      count?: number;
      current_page?: number;
      total_pages?: number;
      has_next?: boolean;
      has_previous?: boolean;
    },
    fallbackPage = this.currentPage(),
  ): void {
    this.totalCount.set(response.count ?? 0);
    this.currentPage.set(response.current_page ?? fallbackPage);
    this.totalPages.set(response.total_pages ?? 1);
    this.hasNext.set(!!response.has_next);
    this.hasPrevious.set(!!response.has_previous);
  }

  nextPage(): number | null {
    if (!this.hasNext()) return null;
    this.currentPage.update((p) => p + 1);
    return this.currentPage();
  }

  previousPage(): number | null {
    if (!this.hasPrevious()) return null;
    this.currentPage.update((p) => Math.max(1, p - 1));
    return this.currentPage();
  }

  resetPage(): void {
    this.currentPage.set(1);
  }
}
