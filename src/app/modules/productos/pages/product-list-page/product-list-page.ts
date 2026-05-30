import { Component, OnInit, inject, signal,computed, viewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductTable } from '@modules/productos/components/product-table/product-table'

import   { ProductoService } from '@core/service/producto'
import { ApiResponse, ProductInterface, ProductRequest, ProductUpdate } from '@modules/productos/models/product.models'
import { ReactiveFormsModule, FormBuilder, Validators  } from '@angular/forms'
import { FormErrorService } from '@shared/services/form-error';
import { CategoryInterface } from '@modules/productos/models/category.models'
import { CategoryService } from '@core/service/category'
import { ToastService }from '@shared/services/toast';
import { Pagination } from '@shared/utilities/pagination';

@Component({
  selector: 'app-product-list-page',
  imports: [ReactiveFormsModule, ProductTable],
  templateUrl: './product-list-page.html',
  styleUrl: './product-list-page.css',
})
export class ProductListPage implements OnInit {
  constructor(
    private router: Router,
    private routerActivate: ActivatedRoute,
    private productService: ProductoService,
    private categoryService: CategoryService,
  ) {
    console.log('ProductListPage');
    console.log(this.routerActivate.snapshot.params['id2']);
  }

  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private formErrorService = inject(FormErrorService);
  protected readonly editingId = signal<number | null>(null);
  public categories = signal<CategoryInterface[]>([]);
  public readonly products = signal<ProductInterface[]>([]);
  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('ProductDialog');
  private readonly confirmDeleteDialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('confirmDeleteDialog');
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly pagination = new Pagination(5);

  public productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    price: [0, [Validators.required, Validators.minLength(0.01)]],
    stock: [0, [Validators.required, Validators.minLength(0)]],
    category: [0, [Validators.required, Validators.minLength(1)]],
  });

  protected readonly pendingDeleteName = computed(() => {
    const id = this.pendingDeleteId();
    if (id === null) {
      return '';
    }
    return this.products().find((p) => p.id === id)?.name ?? `ID ${id}`;
  });

  public onEdit(id: number): void {
    const product = this.products().find((p) => p.id === id);
    if (!product) {
      return;
    }
    this.editingId.set(id);
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      category: product.category,
    });

    this.openCreateModal(true);

    console.log('Edicion del producto', id);
  }

  public onDelete(id: number): void {
    this.pendingDeleteId.set(id);
    queueMicrotask(() => this.confirmDeleteDialogRef().nativeElement.showModal());
  }

  protected confirmDelete(): void {
    const id = this.pendingDeleteId();
    if (id === null) {
      return;
    }

    this.productService.deleteProduct(id).subscribe(() => {
      this.toastService.show('Producto Eliminado correctamente.', 'success');
      this.getAllProduct();
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

  protected goToPreviousPage(): void {
    const page = this.pagination.previousPage();
    if (page !== null) this.getAllProduct(page);
  }

  protected goToNextPage(): void {
    const page = this.pagination.nextPage();
    if (page !== null) this.getAllProduct(page);
  }

  private getAllProduct(page = this.pagination.currentPage()): void {
    this.productService.getAllProducts(page, this.pagination.pageSize).subscribe((data: ApiResponse) => {
      console.log(data.results);
      this.products.set(data.results ?? []);
      this.pagination.updatePage(data, page);
    });
  }

  public ngOnInit(): void {
    this.getAllProduct(1);
  }
  public modalTitle(): string {
    return this.editingId() ? 'Editar Producto' : 'Nuevo producto';
  }

  public openCreateModal(isEdit: boolean): void {
    if (!isEdit) {
      this.editingId.set(null);
    }
    this.getAllCategory();
    queueMicrotask(() => this.dialogRef().nativeElement.showModal());
  }

  public closeModal(): void {
    this.dialogRef().nativeElement.close();
  }

  public onDialogBackdrop(event: MouseEvent): void {
    console.log('onDialogOpen');
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  public isFieldInvalid(field: string): boolean {
    const control = this.productForm.get(field);

    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  public getFieldError(field: string): string | null {
    const control = this.productForm.get(field);

    return this.formErrorService.getFieldError(control);
  }

  private getAllCategory(): void {
    this.categoryService.getAllCategories().subscribe((data: any) => {
      console.log(data.results);
      this.categories.set(data.results ?? []);
    });
  }

  public saveProduct(): void {
    if (this.productForm.invalid) {
      return;
    }

    const payload = this.productForm.getRawValue();

    const id = this.editingId();
    if (id === null) {
      this.productService
        .createProduct(payload as ProductRequest)
        .subscribe((response: ApiResponse) => {
          this.getAllProduct();
          this.closeModal();
        });
    } else {
      const payload: ProductUpdate = {
        ...this.productForm.getRawValue(),
        created_by: 1,
      };

      this.productService.updateProduct(payload, id).subscribe((response: ApiResponse) => {
        this.getAllProduct();
        this.closeModal();
      });
    }
  }
}
