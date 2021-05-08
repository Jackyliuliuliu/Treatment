import { Component, OnInit, Injector} from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd';
import { UserIdentityInput, UserIdentityServiceProxy } from '@shared/service-proxies/service-proxies';


@Component({
    selector: 'app-userconfirm',
    templateUrl: './userconfirm.component.html',
})

export class UserConfrimComponent extends AppComponentBase implements OnInit {
    isUserConfirmViewVisible: boolean = false;
    username:string;
    password:any;
    description:string;
    uservalidateForm: FormGroup;
    errorMessage: string;




    constructor(
        injector: Injector,
        private fb:FormBuilder,
        private _modal: NzModalRef,
        private _userIdentityAppService:UserIdentityServiceProxy) {
        super(injector);
    }

    ngOnInit() {
        this.uservalidateForm = this.fb.group({
            username: ['', [Validators.required]],
            password: ['', [Validators.required]],
            description: ['', null]
        })
        this.isUserConfirmViewVisible = true;
        this.uservalidateForm.reset();
    }

    userhandleOk(): void {
        var userInfo = new UserIdentityInput();
        userInfo.userName = this.username;
        userInfo.password = this.password;

        this._userIdentityAppService.isUserAvailable(userInfo)
            .pipe()
            .subscribe((ret: boolean) => {
                var result = {
                    isAvailable: ret,
                    approver: this.username
                }
                if (!ret) {
                    this.errorMessage = "username or password is wrong."
                    return;
                }
                this._modal.destroy(result);
                this.isUserConfirmViewVisible = false;
            })
    }


    submitUserForm(): void {
        for (const i in this.uservalidateForm.controls) {
            this.uservalidateForm.controls[i].markAsDirty();
            this.uservalidateForm.controls[i].updateValueAndValidity();
        }
    }
  
    userViewCancel(): void {
        console.log('Button cancel clicked!');
        this.isUserConfirmViewVisible = false;
        this.reset()
        this._modal.destroy(false);
    }

    reset(): void {
        this.username = "";
        this.password = undefined;
        this.description = null;
    }
}