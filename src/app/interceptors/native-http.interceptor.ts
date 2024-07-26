import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { isPlatform } from '@ionic/core';
import { Observable, from } from 'rxjs';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete' | 'upload' | 'download';

@Injectable({
  providedIn: 'root',
})
export class NativeHttpInterceptor implements HttpInterceptor {
  constructor(private nativeHttp: HTTP) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!isPlatform('cordova')) {
      return next.handle(request);
    }
    return from(this.handleNativeRequest(request));
  }

  private async handleNativeRequest(request: HttpRequest<any>): Promise<HttpResponse<any>> {
    const headerKeys = request.headers.keys();

    let headers: { [key: string]: string } = {};

    headerKeys.forEach((key) => {
      headers[key] = request.headers.get(key) ?? "";
    });

    try {
      const method = <HttpMethod>request.method.toLowerCase();

      const nativeHttpResponse = await this.nativeHttp.sendRequest(request.url, {
        method: method,
        data: request.body,
        headers: headers,
        serializer: "json"
      });

      let body;

      try {
        body = JSON.parse(nativeHttpResponse.data);
      } catch (error) {
        body = { response: nativeHttpResponse.data };
      }

      const response = new HttpResponse({
        body: body,
        status: nativeHttpResponse.status,
        headers: new HttpHeaders(nativeHttpResponse.headers),
        url: nativeHttpResponse.url,
      });

      return Promise.resolve(response);
    } catch (error: any) {
      console.log(error);

      if (!error.status) {
        return Promise.reject(error);
      }

      const response = new HttpResponse({
        body: error,
        status: error.status,
        headers: error.headers,
        url: error.url,
      });

      return Promise.reject(response);
    }
  }
}