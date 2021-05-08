import { Component, OnInit, Injector, EventEmitter, Output, ViewChild, Injectable, Input  } from "@angular/core";
import { AppComponentBase } from "@shared/app-component-base";
import { FormGroup, FormControl, ValidationErrors, FormBuilder, Validators } from "@angular/forms";
import { Observable, Observer, from } from "rxjs";
import { NzModalRef, NzMessageService } from "ng-zorro-antd";
import { ScheduleService } from "@shared/schedule-service/schedule-service";
import { UserIdentityServiceProxy, UserIdentityInput } from "@shared/service-proxies/service-proxies";



@Component(
  {
    selector: "user-authorization-modal",
    templateUrl: "./modal-user-authorization.component.html",
  }
)

export class UserAuthorizationComponent extends AppComponentBase implements OnInit {
  @Input() tip:string;
  @Input() statusWarining:string;
  @Input() completedstatusWarining:string;

  visible = false;
  modalName: string = null;
  @Output() unitCreated: EventEmitter<any> = new EventEmitter<any>();

  ngOnInit(): void {
    this.modalName = this._scheduleService.modalName;
    this.visible = true;
    this.warning = this.tip;
  }

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private _scheduleService: ScheduleService,
    public msg: NzMessageService,
    private _userIdentityServiceProxy:UserIdentityServiceProxy,
    private _modal: NzModalRef,
    ) {
    super(injector)
    this.validateForm = this.fb.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }


  validateForm: FormGroup;
  userName:string;
  password:string;
  warning:string;





  close(): void {
    this._modal.destroy();
  }

  onCancel(): void {
    this._modal.destroy(false);
  }

  onConfirm(): void {
    var userInput = new UserIdentityInput();
    userInput.userName = this.userName;
    userInput.password = this.password;
    this._userIdentityServiceProxy.isUserAvailable(userInput).subscribe(
      (ret:boolean)=>{
        if(ret){
          this._modal.destroy(true);
        }
        else{
          this.msg.error("user name or password is wrong !");
        }

      }
    );

  }

}