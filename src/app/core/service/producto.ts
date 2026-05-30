import { Injectable, inject } from '@angular/core';
import { ApiResponse, ProductRequest, ProductUpdate } from '@modules/productos/models/product.models'
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment'

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private apiUrl = `${environment.apiUrl}/api/shoppingcart/products/`;

  private http = inject(HttpClient)

  public getAllProducts(page=1, pageSize=10): Observable<ApiResponse> {

    const params = new HttpParams()
    .set('page', String(page))
    .set('page_size', String(pageSize))


    return this.http.get<ApiResponse>(this.apiUrl, {params})
  }

  public createProduct(productData: ProductRequest): Observable<ApiResponse>{
    return this.http.post<ApiResponse>(this.apiUrl, productData)
  }

  public updateProduct(productData: ProductUpdate, id: number): Observable<ApiResponse>{
    return this.http.put<ApiResponse>(`${this.apiUrl}${id}/`, productData)
  }

  public deleteProduct(id: number): Observable<ApiResponse>{
    return this.http.delete<ApiResponse>(`${this.apiUrl}${id}/`)
  }



}