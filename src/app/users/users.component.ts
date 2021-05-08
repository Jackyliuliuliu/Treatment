import { Component } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';

@Component({
    templateUrl: './users.component.html',
    animations: [appModuleAnimation()]
})
export class UsersComponent  {
    active: boolean = false;

    constructor(
    ) {
       
    }

    protected delete(): void {

    }

    edit(): void{


    }


    createUser(): void {       

    }
}