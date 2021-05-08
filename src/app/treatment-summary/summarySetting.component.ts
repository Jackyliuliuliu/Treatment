import { Component, OnInit, Injector } from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { AppComponentBase } from "@shared/app-component-base";
import { NzMessageService, NzModalRef } from "ng-zorro-antd";
import { PermissionType } from "@shared/Permission/PermissionType";
import { TableDisplayConfigDto, TableDisplayConfigServiceProxy } from "@shared/service-proxies/service-proxies";

@Component({
    templateUrl: './summarySetting.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./summarySetting.component.less'],
})

export class SummarySettingComponent extends AppComponentBase implements OnInit {

    colunmList: Array<TableDisplayConfigDto>;
    selectedColunmList: Array<TableDisplayConfigDto>;
    selectedColunm: TableDisplayConfigDto;
    rigthtSelectedColunm: TableDisplayConfigDto;
    rightActivedNode: any;
    isReadOnly: boolean = false;

    activedNode: any;

    constructor(
        injector: Injector,
        private _tableDisplayConfigService: TableDisplayConfigServiceProxy,
        private _msg: NzMessageService,
        private _modal: NzModalRef,
    ) {
        super(injector);
    }

    ngOnInit(): void {

        this.colunmList = new Array<TableDisplayConfigDto>();
        this.selectedColunmList = new Array<TableDisplayConfigDto>();

        this._tableDisplayConfigService.getDefaultRecordDisplay().subscribe(
            (data: Array<TableDisplayConfigDto>) => {
                if (data != null && data.length > 0) {
                    data.forEach(element => {
                        if (element.isDisplay) {
                            this.selectedColunmList.push(element);
                        }
                        else {
                            this.colunmList.push(element);
                        }

                    });

                }
            }
        );
    }

    selectColunm(item: TableDisplayConfigDto) {
        console.log("select colunm" + item);
        this.selectedColunm = item;
        this.activedNode = item.columnDisplayName;

    }

    selectRightColunm(item: TableDisplayConfigDto) {
        console.log("select right colunm" + item);
        this.rigthtSelectedColunm = item;
        this.rightActivedNode = item.columnDisplayName;

    }

    addColunm() {
        console.log("add colunm" + this.selectedColunm);
        if (this.selectedColunm != null) {
            this.selectedColunm.isDisplay = true;
            this.selectedColunm.displayIndex = this.selectedColunmList.length + 1;
            this.selectedColunmList.push(this.selectedColunm);
            var index = this.colunmList.indexOf(this.selectedColunm);
            this.colunmList.splice(index, 1);
            console.log(this.colunmList);

        }

    }

    removeColunm() {
        if (this.rigthtSelectedColunm != null) {
            console.log("remove colunm" + this.rigthtSelectedColunm);
            this.rigthtSelectedColunm.isDisplay = false;
            this.colunmList.push(this.rigthtSelectedColunm);
            var index = this.selectedColunmList.indexOf(this.rigthtSelectedColunm);
            this.selectedColunmList.splice(index, 1);
            this.selectedColunmList.forEach(element => {
                if(element.displayIndex > index){
                    element.displayIndex = element.displayIndex -1;

                }
                
            });

        }


    }

    shiftUpItem() {
        var index = this.selectedColunmList.indexOf(this.rigthtSelectedColunm);
        if (index > 0) {
            var upItem = this.selectedColunmList[index - 1];
            this.selectedColunmList[index - 1] = this.rigthtSelectedColunm;
            this.selectedColunmList[index - 1].displayIndex = index - 1;
            this.selectedColunmList[index] = upItem;
            this.selectedColunmList[index].displayIndex = index;

        }

    }

    shiftDownItem() {
        var index = this.selectedColunmList.indexOf(this.rigthtSelectedColunm);
        if (index < this.selectedColunmList.length - 1) {
            var upItem = this.selectedColunmList[index + 1];
            this.selectedColunmList[index + 1] = this.rigthtSelectedColunm;
            this.selectedColunmList[index + 1].displayIndex = index + 1;
            this.selectedColunmList[index] = upItem;
            this.selectedColunmList[index].displayIndex = index;
        }

    }

    cancel() {
        console.log("destroy");
        this._modal.destroy();
    }

    save() {
        var newColunmList = new Array<TableDisplayConfigDto>();
        this.colunmList.forEach(element => {
            newColunmList.push(element);
        });
        this.selectedColunmList.forEach(element => {
            newColunmList.push(element);
        });
        this._tableDisplayConfigService.saveRecordDisplay(newColunmList).subscribe(
            (data: boolean) => {
                if (data) {
                    console.log("save successful!");
                    this._msg.info("save successful!");
                    this._modal.destroy();
                }
            }
        );


    }

}