import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class CurrentModuleService {
    currentModule: string;
    private subject = new Subject<string>();

    setCurrentModule(name: string) {
        this.subject.next(name);
    }

    getCurrentModule(): Observable<string> {
        return this.subject.asObservable();
    }
}