import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NzTreeNodeOptions, NzMessageService } from 'ng-zorro-antd';
import { AddBeamDto, BeamServiceProxy, BeamOutput } from '@shared/service-proxies/service-proxies';
import { TreeNode } from 'angular-tree-component/dist/defs/api';

@Component({
  selector: 'app-beamactions',
  templateUrl: './beamactions.component.html',
  styleUrls: ['./beamactions.component.less']
})
export class BeamactionsComponent implements OnInit {

  @Output()
  public AfterActionToRefreshTree = new EventEmitter<RefreshTree>();

  @Input()
  beamGroupList: TreeNode[];

  @Input()
  selectedNode:TreeNode;

  @Input()
  isEditPermission:boolean;

  @Input()
  isDeletePermission:boolean;

  constructor() { }

  ngOnInit() {
 
  }
  
  AfterActionToRefreshTreeTransfer(refreshTree:RefreshTree)
  {
    this.AfterActionToRefreshTree.emit(refreshTree);
  }


}

export class RefreshTree
{
    public beamid:number;
    public beamacAionType;
    public dgid:number;   
}
