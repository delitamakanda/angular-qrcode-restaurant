import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NetworkAwarePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, loadFunction: () => Observable<unknown>): Observable<unknown> {
    if (this.isPreloadingRoute(route)) {
      return loadFunction();
    } else {
      return EMPTY;
    }
  }

  private isPreloadingRoute(route: Route): boolean {
    const networkInfo = (
      window.navigator as {
        connection?: { saveData: boolean; effectiveType: string; rtt: number; downlink: number };
      }
    ).connection;

    if (networkInfo) {
      // economy mode
      if (networkInfo.saveData) {
        return false;
      }

      // effective connection type
      const effectiveType = networkInfo.effectiveType || '';
      if (effectiveType.includes('2g') || effectiveType.includes('3g')) {
        return false;
      }

      // validate rtt
      const latency = networkInfo.rtt;
      if (latency > 300) {
        return false;
      }

      // bandwidth
      const bandwidth = networkInfo.downlink;
      if (bandwidth < 0.5) {
        return false;
      }

      // check for explicit preload false
      if (route.data?.['preload'] === false) {
        return false;
      }
    }
    return true;
  }
}
