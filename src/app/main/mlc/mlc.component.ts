import { Component, OnInit,Injector, ElementRef, ViewChild, HostListener, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { BeamServiceProxy, ControlPointDto } from '@shared/service-proxies/service-proxies';
import { GetBeamIdService } from '@shared/service-proxies/get-beamId.service';
import { UpdateBeamInfoService } from '@shared/service-proxies/update-beamInfo.service';
import { ControlPointInfo } from '@app/main/beamparameter/beamparameter.component';
import { NzModalService ,NzMessageService} from 'ng-zorro-antd';
import { EditApertureModalComponent } from '@app/main/mlc/editAperture.component';
import { AppComponentBase } from '@shared/app-component-base';


@Component({
    selector: 'mlc-component',
    templateUrl: './mlc.component.html',
    styleUrls: [
        './mlc.component.less'
    ],
})


export class MlcComponent extends AppComponentBase  implements OnInit ,OnChanges{
    

    @Input() data: editInfo;
    @ViewChild('mlcControl') canvas: ElementRef;

    @Output()
    public GetControlPointIndex = new EventEmitter<number>();

    @Input()
    controlPointsData: ControlPointInfo;

    public leafPositionBoundaries: number[];
    public currentLeafShape: LeafPairData[];
    public newShapes: LeafPairData[];
    public controlPointList!: ControlPointDto[] | undefined;
    public machineLeafPositions: number[] | undefined;
    public selectedControlPoint: ControlPointDto;
    public controlPointIndex!: number | undefined;
    public controlPointTotalNum: string | undefined;
    public jawX: number[];
    public jawY: number[];
    public leafHeightList: number[];
    public leafRate: number;
    public mlcHeight: number;
    public mlcWidth: number;
    public radius: number;
    public beamLimitingDeviceAngle: number;
    public mlcContainer: HTMLInputElement;
    public mlcLeafRects = new Array<rectLeaf>();
    public mlc: any;
    public mlcRect: any;
    public mlcLeafCanvas: any;
    public jawCanvas: any;
    public selectedLeaf: rectLeaf;
    public isEditMLC: boolean = true;
    public isFinished: boolean = true;
    public pointStart: Point;
    public clickX = new Array();
    public clickY = new Array();
    public clickDrag = new Array();
    public counterPoints = new Array<Point>();
    public leafHeightInCanvas: number[];
    public newCounterPoints = new Array<Point>();
    public beamId: number;


    //alert
    rangeAlert:string="";

    ngOnChanges() {
        this.initSegments();
    }

     ngOnInit(): void {
     }

    constructor(
        private beamServiceProxy: BeamServiceProxy,
        private _getBeamIdService: GetBeamIdService,
        private _updateBeamInfoService: UpdateBeamInfoService,
        private _nzModalService: NzModalService,
        injector: Injector) {
            super(injector);
        this.mlcLeafRects = new Array<rectLeaf>();
        this.data = new editInfo();
        this.data.operation = 0;
        this.data.isEditable = true;
    }


    private initialLeafChart(selectedControlPoint: ControlPointDto) {
        this.mlcContainer = document.querySelector<HTMLInputElement>('#mlcControl');
        if (this.mlcContainer === null || this.mlcContainer === undefined) { return }
        this.mlcHeight = this.mlcContainer.height;
        this.mlcWidth = this.mlcContainer.width;
        this.radius = 50;
        this.mlc = this.canvas.nativeElement.getContext('2d');
        this.mlc.clearRect(0, 0, this.mlcWidth, this.mlcHeight);
        this.mlc.stroke();
        this.mlc.save();

        //画圆角矩形
        this.mlcRect = this.canvas.nativeElement.getContext('2d');
        this.mlcRect.clearRect(0, 0, this.mlcWidth, this.mlcHeight);
        this.mlcRect.beginPath();
        this.mlcRect.arc(this.mlcWidth - this.radius, this.mlcHeight - this.radius, this.radius, 0, Math.PI / 2);
        this.mlcRect.lineTo(this.radius, this.mlcHeight);
        this.mlcRect.arc(this.radius, this.mlcHeight - this.radius, this.radius, Math.PI / 2, Math.PI);
        this.mlcRect.lineTo(0, this.radius);
        this.mlcRect.arc(this.radius, this.radius, this.radius, Math.PI, Math.PI * 3 / 2);
        this.mlcRect.lineTo(this.mlcWidth - this.radius, 0);
        this.mlcRect.arc(this.mlcWidth - this.radius, this.radius, this.radius, Math.PI * 3 / 2, Math.PI * 2);
        this.mlcRect.lineTo(this.mlcWidth, this.mlcHeight - this.radius);
        this.mlcRect.stroke();
        this.mlcRect.clip();

        //get cp points leafboundaries
        this.getControlPointLeafboundaries(selectedControlPoint);

        //计算叶片宽度
        this.calculateLeafSpan();

        //生成mlc叶片
        this.arrangLeaves();

        //init JAW
        this.initJaws();

        //init JawRect
        this.initJawRect();

        //绘制坐标线
        this.drawCross();
    }


    private initJaws() {
        this.jawCanvas = this.canvas.nativeElement.getContext('2d');
        this.jawCanvas.beginPath();
        this.jawCanvas.fillStyle = "rgba(16, 78, 139, 0.5)";
        if(this.selectedControlPoint !=undefined && this.selectedControlPoint!=null){
            if(this.selectedControlPoint.jaw_X1 == 0 || this.selectedControlPoint.jaw_X1 == null){
                this.jawCanvas.fillRect(0, 0, (this.mlcWidth / 2 + this.jawX[0]*this.leafRate), this.mlcHeight);//左侧
            }
            else{
                this.jawCanvas.fillRect(0, 0, (this.mlcWidth / 2 + this.selectedControlPoint.jaw_X1*this.leafRate), this.mlcHeight);//左侧
            }
            if(this.selectedControlPoint.jaw_X2 == 0 || this.selectedControlPoint.jaw_X2 == null){
                this.jawCanvas.fillRect((this.mlcWidth / 2 + this.jawX[1]*this.leafRate), 0, (this.mlcWidth / 2 - this.jawX[1]), this.mlcHeight);//右侧
            }
            else{
                this.jawCanvas.fillRect((this.mlcWidth / 2 + this.selectedControlPoint.jaw_X2*this.leafRate), 0, (this.mlcWidth / 2 - this.selectedControlPoint.jaw_X2), this.mlcHeight);//右侧
            }
            if(this.selectedControlPoint.jaw_Y1 == 0 || this.selectedControlPoint.jaw_Y1 == null){
                this.jawCanvas.fillRect(0, (this.mlcWidth / 2 - this.jawY[0]*this.leafRate), (this.mlcWidth), (this.mlcHeight / 2 + this.jawY[0]*this.leafRate));//下侧
            }
            else{
                this.jawCanvas.fillRect(0, (this.mlcWidth / 2 - this.selectedControlPoint.jaw_Y1*this.leafRate), (this.mlcWidth), (this.mlcHeight / 2 + this.selectedControlPoint.jaw_Y1*this.leafRate));//下侧
            }
    
           if(this.selectedControlPoint.jaw_Y2 == 0 || this.selectedControlPoint.jaw_Y2 == null){
               this.jawCanvas.fillRect(0, 0, this.mlcWidth, (this.mlcHeight / 2 - this.jawY[1]*this.leafRate));//上侧
           }
           else{
            this.jawCanvas.fillRect(0, 0, this.mlcWidth, (this.mlcHeight / 2 - this.selectedControlPoint.jaw_Y2*this.leafRate));//上侧
    
           }
            this.jawCanvas.stroke();
            this.jawCanvas.save();
        }
        
    }

    private initJawRect() {
        this.mlc.beginPath();
        this.mlc.strokeStyle = "yellow";
        this.mlc.lineWidth = '1';
        if(this.selectedControlPoint !=undefined && this.selectedControlPoint!=null){
            if(this.selectedControlPoint.jaw_X1 == 0 || this.selectedControlPoint.jaw_X1 == null){
                this.selectedControlPoint.jaw_X1 = this.jawX[0];
            }
            if(this.selectedControlPoint.jaw_X2 == 0 || this.selectedControlPoint.jaw_X2 == null){
                this.selectedControlPoint.jaw_X2 = this.jawX[1];
            }
            if(this.selectedControlPoint.jaw_Y1 == 0 || this.selectedControlPoint.jaw_Y1 == null){
                this.selectedControlPoint.jaw_Y1 = this.jawY[0];
            }
            if(this.selectedControlPoint.jaw_Y2 == 0 || this.selectedControlPoint.jaw_Y2 == null){
                this.selectedControlPoint.jaw_Y2 = this.jawY[1];
            }
            this.mlc.rect((this.mlcWidth / 2 + this.selectedControlPoint.jaw_X1*this.leafRate),
             (this.mlcHeight / 2 -  this.selectedControlPoint.jaw_Y2*this.leafRate), 
             (this.selectedControlPoint.jaw_X2 - this.selectedControlPoint.jaw_X1)*this.leafRate, 
             ( this.selectedControlPoint.jaw_Y2 - this.selectedControlPoint.jaw_Y1)*this.leafRate);
            this.mlc.stroke();
            this.mlc.save();
        }
    }

    private drawCross() {
        this.mlc.beginPath();
        this.mlc.strokeStyle = "white";
        this.mlc.lineWidth = '0.5';
        this.mlc.moveTo(0, this.mlcHeight / 2);
        this.mlc.lineTo(this.mlcWidth, this.mlcHeight / 2);
        this.mlc.stroke();
        this.mlc.moveTo(this.mlcWidth / 2, 0);
        this.mlc.lineTo(this.mlcWidth / 2, this.mlcHeight);
        this.mlc.stroke();
        var span = this.machineLeafPositions[60]-this.machineLeafPositions[0];
        var scaleNum = span/10;

        for (let index = 0; index < scaleNum; index++) {
            var step = 5;
            this.mlc.moveTo(index * this.mlcWidth / scaleNum, (this.mlcHeight / 2 - step/2));
            this.mlc.lineTo(index * this.mlcWidth / scaleNum, (this.mlcHeight / 2 + step/2));
            this.mlc.moveTo((this.mlcWidth / 2 - step/2), index * this.mlcWidth / scaleNum);
            this.mlc.lineTo((this.mlcWidth / 2 + step/2), index * this.mlcWidth / scaleNum);
            this.mlc.stroke();
        }
        this.mlc.save();


        //画坐标尺
        var offStep = 4;
        this.mlc.beginPath();
        this.mlc.font = "8px bold 黑体";
        this.mlc.fillStyle = "white";
        this.mlc.textAlign = "center";
        this.mlc.textBaseline = "middle";
        this.mlc.fillText(0,this.mlcWidth / 2 + 3,this.mlcHeight/2 + 3);
        for (let index = 5; index < scaleNum/2; index = index + 5) {

            //y正轴
            this.mlc.fillText(index,this.mlcWidth / 2 + 2*offStep,this.mlcHeight/2 -(index * this.mlcWidth / scaleNum));

            //y负轴
            this.mlc.fillText(-(index),this.mlcWidth / 2 + 2*offStep,this.mlcHeight/2 +(index * this.mlcWidth / scaleNum));

            //x正轴
            this.mlc.fillText(index, index * this.mlcWidth / scaleNum + this.mlcWidth/2,(this.mlcHeight / 2 + 2*offStep));

            //x负轴
            this.mlc.fillText(-index, -index * this.mlcWidth / scaleNum + this.mlcWidth/2,(this.mlcHeight / 2 + 2*offStep));

            this.mlc.stroke();
            this.mlc.save();
        }
       


    }

    private arrangLeaves() {

        this.mlcLeafCanvas = this.canvas.nativeElement.getContext('2d');

        for (let index = 0; index < this.currentLeafShape.length; index++) {
            console.info(this.currentLeafShape.length);
            this.mlcLeafCanvas.beginPath();
            this.mlcLeafCanvas.strokeStyle = "green";
            this.mlcLeafCanvas.lineWidth = '1';
            var height = 0;
            for (let j = 0; j <= index; j++) {
               height = height + this.leafHeightList[j]
            }

            this.mlcLeafCanvas.rect(0, this.mlcHeight-height, (this.mlcWidth / 2 + this.currentLeafShape[index].value1*this.leafRate), (this.machineLeafPositions[index + 1] - this.machineLeafPositions[index])*this.leafRate);
            var rectLeft = new rectLeaf();

            rectLeft.x = 0;
            rectLeft.y = this.mlcHeight-height;
            rectLeft.width = this.mlcWidth / 2 + this.currentLeafShape[index].value1*this.leafRate;
            rectLeft.height = (this.machineLeafPositions[index + 1] - this.machineLeafPositions[index])*this.leafRate;
            rectLeft.index = index * 2;
            this.mlcLeafRects.push(rectLeft);

            this.mlcLeafCanvas.rect((this.mlcWidth / 2 + this.currentLeafShape[index].value2*this.leafRate), this.mlcHeight-height, (this.mlcWidth / 2 - this.currentLeafShape[index].value2*this.leafRate), (this.machineLeafPositions[index + 1] - this.machineLeafPositions[index])*this.leafRate);
            var rectRight = new rectLeaf();
            rectRight.x = this.mlcWidth / 2 + this.currentLeafShape[index].value2*this.leafRate;
            rectRight.y = this.mlcHeight-height;
            rectRight.width = (this.mlcWidth / 2 - this.currentLeafShape[index].value2*this.leafRate);
            rectRight.height = (this.machineLeafPositions[index + 1] - this.machineLeafPositions[index])*this.leafRate;
            rectRight.index = 2 * index + 1;
            this.mlcLeafRects.push(rectRight);
            this.mlcLeafCanvas.stroke();

        }
    }


    public initCurrentBeam() {
        console.log("init Current Beam");
        this.beamId = this._getBeamIdService.getBeamIndex();
        this.beamServiceProxy.getBeamInfoByIndex(this.beamId).subscribe(
            data => {
                if (data != null) {
                    var beam = data;
                    if (beam != null) {
                        var beamData = beam;
                        this.machineLeafPositions = new Array<number>();
                        if (beamData.mlcLeafPositionBoundaries != null) {
                            beamData.mlcLeafPositionBoundaries.forEach(machineLeaf => {
                                this.machineLeafPositions.push(machineLeaf);
                            });
                        }
                        this.jawX = new Array<number>();
                        this.jawX.push(beamData.jawX1);
                        this.jawX.push(beamData.jawX2);
                        this.jawY = new Array<number>();
                        this.jawY.push(beamData.jawY1);
                        this.jawY.push(beamData.jawY2);
                    }
                }
                this.initialLeafChart(this.selectedControlPoint);
                this.initialLeafChart(this.selectedControlPoint);
            }
        );
    }
    reset(controlPointsData:ControlPointInfo,index:number){
       this.controlPointsData=controlPointsData;
       this.initSegments();
       this.selectedControlPoint=controlPointsData[index];
    }

    initSegments() {
        if (this.controlPointsData != null && this.controlPointsData.controlPoints != null) {
            var controlPointSequence = this.controlPointsData.controlPoints.sort(item => item.controlPointIndex);
            this.controlPointList = new Array<ControlPointDto>();
            controlPointSequence.forEach(controlPoint => {
                this.controlPointList.push(controlPoint);
                this.controlPointTotalNum = "/" + this.controlPointList.length.toString();
            });
            this.controlPointList.forEach(element => {
                if (element.controlPointIndex == 0) {
                    this.selectedControlPoint = element;
                    this.controlPointIndex = element.controlPointIndex + 1;
                }
            });
            this.jawX = null;
            this.jawY = null;
            this.beamLimitingDeviceAngle = this.selectedControlPoint !== null && this.selectedControlPoint !== undefined ? this.selectedControlPoint.beamLimitingDeviceAngle : null;


            this.machineLeafPositions = new Array<number>();
            if (this.controlPointsData.mlcLeafPositionBoundaries != null) {
                this.controlPointsData.mlcLeafPositionBoundaries.forEach(machineLeaf => {
                    this.machineLeafPositions.push(machineLeaf);
                });
            }
            this.jawX = new Array<number>();
            if(this.controlPointsData.controlPoints[0] != null)
            {
                this.jawX.push(this.controlPointsData.controlPoints[0].jaw_X1);
                this.jawX.push(this.controlPointsData.controlPoints[0].jaw_X2);
                this.jawY = new Array<number>();
                this.jawY.push(this.controlPointsData.controlPoints[0].jaw_Y1);
                this.jawY.push(this.controlPointsData.controlPoints[0].jaw_Y2);
                this.initialLeafChart(this.selectedControlPoint);
            }
            
        }
    }

    public nextControlPoint() {
        if (this.controlPointIndex == this.controlPointList.length) {
            return;
        }
        this.controlPointIndex = this.controlPointIndex + 1;
        this.controlPointList.forEach(element => {
            if (element.controlPointIndex == this.controlPointIndex - 1) {
                this.selectedControlPoint = element;
            }
        });
       this.initSelectedControlPointJawPosition();

        this.controlPointIndex = this.selectedControlPoint.controlPointIndex + 1;
        this.initialLeafChart(this.selectedControlPoint);
        this.GetControlPointIndex.emit(this.controlPointIndex);
    }

    private initSelectedControlPointJawPosition(){
        if (this.selectedControlPoint.jaw_X1 == null) {
            this.selectedControlPoint.jaw_X1 = this.jawX[0];
        }
        if (this.selectedControlPoint.jaw_X2 == null) {
            this.selectedControlPoint.jaw_X2 = this.jawX[1];
        }
        if (this.selectedControlPoint.jaw_Y1 == null) {
            this.selectedControlPoint.jaw_Y1 = this.jawY[0];
        }
        if (this.selectedControlPoint.jaw_Y2 == null) {
            this.selectedControlPoint.jaw_Y2 = this.jawY[1];
        }
    }

    public forwardControlPoint() {
        if (this.controlPointIndex == 1) {
            return;
        }

        this.controlPointList.forEach(element => {
            if (element.controlPointIndex == (this.controlPointIndex - 2)) {
                this.selectedControlPoint = element;
            }
        });
        this.initSelectedControlPointJawPosition();
        this.controlPointIndex = this.selectedControlPoint.controlPointIndex + 1;
        this.initialLeafChart(this.selectedControlPoint);
        this.GetControlPointIndex.emit(this.controlPointIndex);
    }

    public lastControlPoint() {
        this.controlPointIndex = this.controlPointList.length;
        this.selectedControlPoint = null;
        this.controlPointList.forEach(element => {
            if (element.controlPointIndex == this.controlPointList.length - 1) {
                this.selectedControlPoint = element;
            }
        });
        this.initialLeafChart(this.selectedControlPoint);
        this.GetControlPointIndex.emit(this.selectedControlPoint.controlPointIndex);
    }

    public firstControlPoint() {
        this.controlPointIndex = 1;
        this.controlPointList.forEach(element => {
            if (element.controlPointIndex == 1) {
                this.selectedControlPoint = element;
            }
        });
        this.initSelectedControlPointJawPosition();
        this.initialLeafChart(this.selectedControlPoint);
        this.GetControlPointIndex.emit(this.controlPointIndex);
    }

    public onChecked(event:any) {
        this.rangeAlert="";
        if(event<=0 || event>this.controlPointList.length || event == null || event == ''){
            this.rangeAlert="输入值不在有效范围内";
        }else{
            this.selectedControlPoint = this.controlPointList[this.controlPointIndex - 1];
            this.initialLeafChart(this.selectedControlPoint);
            this.GetControlPointIndex.emit(this.controlPointIndex);
        }
    }

    private getControlPointLeafboundaries(selectedControlPoint: ControlPointDto) {
        if (selectedControlPoint != null && selectedControlPoint.leafPositions != null) {
            var selectedCPDevicePositions = selectedControlPoint.leafPositions;
            this.leafPositionBoundaries = new Array<number>();
            selectedCPDevicePositions[0].forEach(element => {
                this.leafPositionBoundaries.push(element);
            });
            selectedCPDevicePositions[1].forEach(element => {
                this.leafPositionBoundaries.push(element);
            });
        }
    }


    private calculateLeafSpan() {
        this.leafHeightList = new Array<number>();
        var maxVaule = this.machineLeafPositions[this.machineLeafPositions.length - 1];
        var minVaule = this.machineLeafPositions[0];
        console.log("max:"+maxVaule+"min:"+minVaule);

         this.leafRate = 400 / (maxVaule - minVaule);

        for (let i = 0; i < this.machineLeafPositions.length-1; i++) {
            var height = (this.machineLeafPositions[i + 1] - this.machineLeafPositions[i]) * this.leafRate;
            this.leafHeightList.push(height);
        }

        var count = this.leafPositionBoundaries !== null && this.leafPositionBoundaries !== undefined ? this.leafPositionBoundaries.length / 2 : 0;
        this.currentLeafShape = new Array<LeafPairData>();
        for (let index = 0; index < count; index++) {
            var value1 = this.leafPositionBoundaries[index];
            var value2 = this.leafPositionBoundaries[index + count];
            var leaf = new LeafPairData();
            leaf.value1 = value1;
            leaf.value2 = value2;
            leaf.index = index + 1;
            this.currentLeafShape.push(leaf);
        }
    }

    // @HostListener('window:mousedown', ['$event']) onMouseDown(event) {
    //     //取得画布上被单击的点
    //     this.pointStart = new Point();
    //     this.pointStart.x = event.offsetX;
    //     this.pointStart.y = event.offsetY;
    //     this.isFinished = false;
    //     console.log("mouse down ");
    //     if (this.data == null) {
    //         console.log("data is null");
    //         this.data = new editInfo();
    //         this.data.operation = 0;

    //     }

    //     if (this.data.operation == EditToolOption.Drag) {
    //         this.mlcLeafRects.forEach(rect => {
    //             if (this.pointStart.x >= 0 && this.pointStart.x < rect.x + rect.width && this.pointStart.y < rect.y + rect.height && this.pointStart.y > rect.y && rect.x == 0) {
    //                 this.selectedLeaf = new rectLeaf();
    //                 this.selectedLeaf.x = rect.x;
    //                 this.selectedLeaf.y = rect.y;
    //                 console.info(this.selectedLeaf.y);
    //                 this.selectedLeaf.index = rect.index;
    //                 console.info(this.selectedLeaf.index);
    //             }
    //             if (this.pointStart.x > this.mlcWidth - rect.width && this.pointStart.x <= this.mlcWidth && this.pointStart.y <= rect.y + rect.height && this.pointStart.y >= rect.y && rect.x != 0) {
    //                 this.selectedLeaf = new rectLeaf();
    //                 this.selectedLeaf.x = rect.x;
    //                 this.selectedLeaf.y = rect.y;
    //                 console.info(this.selectedLeaf.y);
    //                 this.selectedLeaf.index = rect.index;
    //                 console.info(this.selectedLeaf.index);
    //             }
    //         });
    //     }
    //     if (this.data.operation == EditToolOption.FreeHand) {
    //         this.addClick(event.offsetX, event.offsetY, false);
    //     }

    // }

    // @HostListener('window:mouseup', ['$event']) onMouseUp(event) {

    //     console.log("mouse up ");
    //     this.isFinished = true;
    //     if (this.data.operation == EditToolOption.FreeHand) {

    //         this.mlcContainer = document.querySelector<HTMLInputElement>('#mlcControl');

    //         this.mlcHeight = this.mlcContainer.height;
    //         this.mlcWidth = this.mlcContainer.width;
    //         this.radius = 50;

    //         this.mlc = this.canvas.nativeElement.getContext('2d');

    //         this.mlc.clearRect(0, 0, this.mlcWidth, this.mlcHeight);

    //         this.mlc.stroke();
    //         this.mlc.save();

    //         console.log("points length:" + this.counterPoints.length)
    //         this.mlcMatchFigure();
    //         this.arrangCourterLeaves();
    //         this.mlcJawsChanged();
    //         this.initJaws();
    //         this.initJawRect();
    //         this.drawCross();

    //     }

    //     if (this.data.operation == EditToolOption.Pan) {
    //         this.panMlcControl();
    //     }
    // }

    // @HostListener('window:mousemove', ['$event']) onMouseMove(event) {
    //     if (this.data == null) {
    //         console.log("data is null");
    //         this.data = new editInfo();
    //         this.data.operation = 0;
    //     }
    //     if (this.data.operation == EditToolOption.FreeHand && this.isFinished == false) {
    //         console.log("mouse move: draw path figure");
    //         this.addClick(event.offsetX, event.offsetY, true);
    //         this.drawFigureToCanvas(event);
    //     }
    //     if (this.isFinished == false && this.data.operation == EditToolOption.Drag) {
    //         console.log("mouse move:drag mlc leaf ");
    //         this.dragElement(event);
    //     }
    //     if (this.isFinished == false && this.data.operation == EditToolOption.Jaw) {
    //         console.log("mouse move:drag mlc jaw ");
    //         this.dragJawPosition(event);
    //     }
    //     if (this.isFinished == false && this.data.operation == EditToolOption.Pan) {
    //         console.log("mouse move:pan mlc ");
    //         this.addClick(event.offsetX, event.offsetY, true);

    //     }
    // }


    private dragElement(event) {
        var p = new Point();
        p.x = event.offsetX;
        p.y = event.offsetY;
        var dragRect = this.canvas.nativeElement.getContext('2d');
        dragRect.clearRect(0, 0, this.mlcWidth, this.mlcHeight);
        dragRect.beginPath();
        if (this.selectedLeaf == null) {
            return;
        }
        if (this.selectedLeaf.index % 2 == 0) {
            console.log("left index" + this.selectedLeaf.index);
            var actualIndex = (this.selectedLeaf.index) / 2;
            console.log("actual left index" + actualIndex);
            var value2 = this.currentLeafShape[actualIndex].value2;
            this.currentLeafShape[actualIndex] = new LeafPairData();
            this.currentLeafShape[actualIndex].index = actualIndex;
            this.currentLeafShape[actualIndex].value2 = value2;
            this.currentLeafShape[actualIndex].value1 = p.x - this.mlcWidth / 2;
            this.selectedControlPoint.leafPositions[0][actualIndex] = p.x - this.mlcWidth / 2;
        }
        else {
            console.log("right index" + this.selectedLeaf.index);
            var actualIndex = (this.selectedLeaf.index - 1) / 2;
            console.log("actual right index:" + actualIndex);
            var value1 = this.currentLeafShape[actualIndex].value1;
            this.currentLeafShape[actualIndex] = new LeafPairData();
            this.currentLeafShape[actualIndex].index = actualIndex;
            this.currentLeafShape[actualIndex].value2 = p.x - this.mlcWidth / 2;
            this.currentLeafShape[actualIndex].value1 = value1;
            this.selectedControlPoint.leafPositions[1][actualIndex] = p.x - this.mlcWidth / 2;

        }

        this.arrangLeaves();
        this.initJaws();
        this.initJawRect();
        this.drawCross();
    }

    private dragJawPosition(event) {
        var p = new Point();
        p.x = event.offsetX;
        p.y = event.offsetY;
        var xDistance = p.x - this.pointStart.x;
        var yDistance = p.y - this.pointStart.y;
        var dragRect = this.canvas.nativeElement.getContext('2d');
        dragRect.clearRect(0, 0, this.mlcWidth, this.mlcHeight);
        dragRect.beginPath();
        if (this.pointStart.y <= 200 - this.jawY[1] && this.pointStart.y >= 0) {
            console.log("向上拉");
            this.jawY[1] = this.jawY[1] - yDistance;
            this.selectedControlPoint.jaw_Y2 = this.jawY[1];
        }
        if (this.pointStart.y >= 200 - this.jawY[0] && this.pointStart.y <= 400) {
            console.log("向下拉");
            this.jawY[0] = this.jawY[0] - yDistance;
            this.selectedControlPoint.jaw_Y1 = this.jawY[0];

        }
        if (this.pointStart.x < this.mlcWidth / 2 + this.jawX[0] && this.pointStart.x > 0 && this.pointStart.y < this.mlcHeight / 2 + this.jawY[1] && this.pointStart.y > this.mlcHeight / 2 + this.jawY[0]) {
            console.log("向左拉");
            this.jawX[0] = this.jawX[0] + xDistance;
            this.selectedControlPoint.jaw_X1 = this.jawX[0];
        }
        if (this.pointStart.x > this.mlcWidth / 2 + this.jawX[1] && this.pointStart.x < 400 && this.pointStart.y < this.mlcHeight / 2 + this.jawY[1] && this.pointStart.y > this.mlcHeight / 2 + this.jawY[0]) {
            console.log("向右拉");
            this.jawX[1] = this.jawX[1] + xDistance;
            this.selectedControlPoint.jaw_X2 = this.jawX[1];
            console.log("向右拉：" + this.selectedControlPoint.jaw_X1);
        }

        this.arrangLeaves();
        this.initJaws();
        this.initJawRect();
        this.drawCross();

    }


    private drawFigureToCanvas(event) {
        var p = new Point();
        p.x = event.offsetX;
        p.y = event.offsetY;
        console.log("drawFigureToCanvas");
        var drawFigure = this.canvas.nativeElement.getContext('2d');
        drawFigure.clearRect(0, 0, this.mlcWidth, this.mlcHeight);

        for (let index = 0; index < this.counterPoints.length; index++) {
            drawFigure.beginPath();
            if (this.clickDrag[index]) {
                drawFigure.moveTo(this.counterPoints[index - 1].x, this.counterPoints[index - 1].y);
            }
            else {
                drawFigure.moveTo(this.counterPoints[index].x, this.counterPoints[index].y);
            }
            drawFigure.lineTo(this.counterPoints[index].x, this.counterPoints[index].y);
            drawFigure.lineWidth = "2";
            drawFigure.strokeStyle = "rgba(255, 0, 0, 1)";
            drawFigure.stroke();
            drawFigure.closePath();
        }
        this.drawCross();
    }

    private addClick(x: number, y: number, dragging: boolean) {

        this.clickX.push(x);
        this.clickY.push(y);
        this.clickDrag.push(dragging);
        var counterPoint = new Point();
        counterPoint.x = x;
        counterPoint.y = y;
        this.counterPoints.push(counterPoint);


    }

    private mlcMatchFigure() {
        this.newShapes = new Array<LeafPairData>();
        this.selectedControlPoint.leafPositions[0] = [];
        this.selectedControlPoint.leafPositions[1] = [];
        this.newCounterPoints = new Array<Point>();
        for (let index = 0; index < this.leafHeightList.length; index++) {
            var interestPoint = new Array<Point>();
            var height = this.machineLeafPositions[index];
            // for (let j = 0; j < index; j++) {
            //    height = height + this.leafHeightList[j]
            // }


            //     for (let index = 0; index < this.counterPoints.length-1; index++) {
            //         var y1 = this.counterPoints[index].y;
            //         var y2 = this.counterPoints[index+1].y;
            //         var x1 = this.counterPoints[index].x;
            //         var x2 = this.counterPoints[index+1].x;
            //         var avergX =(x2-x1)/10;
            //         var avergY = (y2-y1)/10;
            //         for (let index = 0; index < 10; index++) {
            //              var point = new Point();
            //               point.x = x1 + index*avergX;
            //               point.y = y2 + index*avergY;
            //              this.newCounterPoints.push(point);
            //              console.log("counter x:"+point.x+"  "+"counter y:"+point.y)
            //         } 
            //    }

            var minY = 200 - height;
            var maxY = 200 - height + (this.machineLeafPositions[index + 1] - this.machineLeafPositions[index])

            this.counterPoints.forEach(point => {

                if (point.y >= minY && point.y <= maxY) {
                    interestPoint.push(point);
                }
            });

            var min = interestPoint[0];
            var max = interestPoint[0];
            var leaf = new LeafPairData();
            if (interestPoint.length > 0) {
                console.log("interestPoint:" + interestPoint.length);
                for (let index = 0; index < interestPoint.length; index++) {
                    if (interestPoint[index].x < min.x) {
                        min = new Point();
                        min.x = interestPoint[index].x;
                        min.y = interestPoint[index].y;

                    }
                    if (interestPoint[index].x > max.x) {
                        max = new Point();
                        max.x = interestPoint[index].x;
                        max.y = interestPoint[index].y;
                    }
                }
                leaf.value1 = min.x - this.mlcWidth / 2;
                console.log("leaf value1:" + leaf.value1);
                leaf.value2 = max.x - this.mlcWidth / 2;
                console.log("leaf value2:" + leaf.value2);
            }
            if (interestPoint.length == 0) {
                leaf.value1 = 0;
                leaf.value2 = 0;
            }
            this.selectedControlPoint.leafPositions[0].push(leaf.value1);
            this.selectedControlPoint.leafPositions[1].push(leaf.value2);
            this.newShapes.push(leaf);
        }
    }

    private arrangCourterLeaves() {

        var counterLeafCanvas = this.canvas.nativeElement.getContext('2d');

        for (let index = 0; index < this.newShapes.length; index++) {
            console.info(this.newShapes.length);
            this.mlcLeafCanvas.beginPath();
            this.mlcLeafCanvas.strokeStyle = "green";
            this.mlcLeafCanvas.lineWidth = '1';

            counterLeafCanvas.rect(0, 200 - this.machineLeafPositions[index], this.mlcWidth / 2 + this.newShapes[index].value1, this.machineLeafPositions[index + 1] - this.machineLeafPositions[index]);

            var rectLeft = new rectLeaf();

            rectLeft.x = 0;
            rectLeft.y = 200 - this.machineLeafPositions[index];
            rectLeft.width = this.mlcWidth / 2 + this.newShapes[index].value1;
            rectLeft.height = this.machineLeafPositions[index + 1] - this.machineLeafPositions[index];
            rectLeft.index = index * 2;
            this.mlcLeafRects.push(rectLeft);


            // counterLeafCanvas.rect(this.mlcWidth / 2 + this.newShapes[index].value2, 200-this.machineLeafPositions[index], this.mlcWidth / 2 - this.newShapes[index].value2, this.leafHeightList[index]);//右边叶片
            counterLeafCanvas.rect(this.mlcWidth / 2 + this.newShapes[index].value2, 200 - this.machineLeafPositions[index], this.mlcWidth / 2 - this.currentLeafShape[index].value2, this.machineLeafPositions[index + 1] - this.machineLeafPositions[index]);//右边叶片
            var rectRight = new rectLeaf();
            rectRight.x = this.mlcWidth / 2 + this.newShapes[index].value2;
            rectRight.y = 200 - this.machineLeafPositions[index];
            rectRight.width = this.mlcWidth / 2 - this.newShapes[index].value2;
            rectRight.height = this.machineLeafPositions[index + 1] - this.machineLeafPositions[index];
            rectRight.index = 2 * index + 1;
            this.mlcLeafRects.push(rectRight);
            counterLeafCanvas.stroke();
        }
    }

    public flipXLeaves() {

        this.mlcContainer = document.querySelector<HTMLInputElement>('#mlcControl');

        this.mlcHeight = this.mlcContainer.height;
        this.mlcWidth = this.mlcContainer.width;
        this.radius = 50;

        this.mlc = this.canvas.nativeElement.getContext('2d');

        this.mlc.clearRect(0, 0, this.mlcWidth, this.mlcHeight);

        this.mlc.stroke();
        this.mlc.save();


        //画圆角矩形
        this.mlcRect = this.canvas.nativeElement.getContext('2d');
        this.mlcRect.clearRect(0, 0, this.mlcWidth, this.mlcHeight);
        this.mlcRect.beginPath();
        this.mlcRect.arc(this.mlcWidth - this.radius, this.mlcHeight - this.radius, this.radius, 0, Math.PI / 2);
        this.mlcRect.lineTo(this.radius, this.mlcHeight);
        this.mlcRect.arc(this.radius, this.mlcHeight - this.radius, this.radius, Math.PI / 2, Math.PI);
        this.mlcRect.lineTo(0, this.radius);
        this.mlcRect.arc(this.radius, this.radius, this.radius, Math.PI, Math.PI * 3 / 2);
        this.mlcRect.lineTo(this.mlcWidth - this.radius, 0);
        this.mlcRect.arc(this.mlcWidth - this.radius, this.radius, this.radius, Math.PI * 3 / 2, Math.PI * 2);
        this.mlcRect.lineTo(this.mlcWidth, this.mlcHeight - this.radius);
        this.mlcRect.stroke();
        this.mlcRect.clip();
        for (let index = 0; index < this.leafPositionBoundaries.length / 2; index++) {
            var temp = -this.leafPositionBoundaries[index];
            this.leafPositionBoundaries[index] = -this.leafPositionBoundaries[this.leafPositionBoundaries.length / 2 + index]
            this.leafPositionBoundaries[this.leafPositionBoundaries.length / 2 + index] = temp;
        }

        this.selectedControlPoint.leafPositions[0] = [];
        this.selectedControlPoint.leafPositions[1] = [];

        for (let index = 0; index < this.leafPositionBoundaries.length; index++) {
            if (index < 60) {
                this.selectedControlPoint.leafPositions[0].push(this.leafPositionBoundaries[index]);
            }
            else {
                this.selectedControlPoint.leafPositions[1].push(this.leafPositionBoundaries[index]);
            }

        }

        //生成叶片宽度
        this.calculateLeafSpan();

        this.arrangLeaves();
        if (this.jawX[0] != null && this.jawX[1] != null) {
            var tempJawX = this.jawX[0];
            this.jawX[0] = -this.jawX[1];
            this.jawX[1] = -tempJawX;
            this.selectedControlPoint.jaw_X1 = this.jawX[0];
            this.selectedControlPoint.jaw_X2 = this.jawX[1];
            this.initJaws();
            this.initJawRect();
        }


        this.drawCross();
    }

    public flipYLeaves() {

        this.mlcContainer = document.querySelector<HTMLInputElement>('#mlcControl');

        this.mlcHeight = this.mlcContainer.height;
        this.mlcWidth = this.mlcContainer.width;
        this.radius = 50;

        this.mlc = this.canvas.nativeElement.getContext('2d');

        this.mlc.clearRect(0, 0, this.mlcWidth, this.mlcHeight);

        this.mlc.stroke();
        this.mlc.save();


        //画圆角矩形
        this.mlcRect = this.canvas.nativeElement.getContext('2d');
        this.mlcRect.clearRect(0, 0, this.mlcWidth, this.mlcHeight);
        this.mlcRect.beginPath();

        this.mlcRect.arc(this.mlcWidth - this.radius, this.mlcHeight - this.radius, this.radius, 0, Math.PI / 2);
        this.mlcRect.lineTo(this.radius, this.mlcHeight);
        this.mlcRect.arc(this.radius, this.mlcHeight - this.radius, this.radius, Math.PI / 2, Math.PI);
        this.mlcRect.lineTo(0, this.radius);
        this.mlcRect.arc(this.radius, this.radius, this.radius, Math.PI, Math.PI * 3 / 2);
        this.mlcRect.lineTo(this.mlcWidth - this.radius, 0);
        this.mlcRect.arc(this.mlcWidth - this.radius, this.radius, this.radius, Math.PI * 3 / 2, Math.PI * 2);
        this.mlcRect.lineTo(this.mlcWidth, this.mlcHeight - this.radius);
        this.mlcRect.stroke();
        this.mlcRect.clip();
        var leftBoundaries = [];
        var rightBoundaries = [];
        for (let index = 0; index < this.leafPositionBoundaries.length / 2; index++) {
            leftBoundaries.push(this.leafPositionBoundaries[this.leafPositionBoundaries.length / 2 - index - 1]);
            rightBoundaries.push(this.leafPositionBoundaries[this.leafPositionBoundaries.length - index - 1]);
        }
        this.leafPositionBoundaries = [];
        this.selectedControlPoint.leafPositions[0] = [];
        this.selectedControlPoint.leafPositions[1] = [];
        leftBoundaries.forEach(element => {
            this.leafPositionBoundaries.push(element);
            this.selectedControlPoint.leafPositions[0].push(element);
        });

        rightBoundaries.forEach(element => {
            this.leafPositionBoundaries.push(element);
            this.selectedControlPoint.leafPositions[1].push(element);
        });

        this.calculateLeafSpan();

        this.arrangLeaves();
        if (this.jawY[0] != null && this.jawY[1] != null) {
            var tempJawY = this.jawY[0];
            this.jawY[0] = -this.jawY[1];
            this.jawY[1] = -tempJawY;
            this.selectedControlPoint.jaw_Y1 = this.jawY[0];
            this.selectedControlPoint.jaw_Y2 = this.jawY[1];
            this.selectedControlPoint.jaw_X1 = this.jawX[0];
            this.selectedControlPoint.jaw_X2 = this.jawX[1];
            this.initJaws();
            this.initJawRect();
        }



        this.drawCross();
    }

    private mlcJawsChanged() {
        console.log("mlcJawChanged")
        var x1 = Math.max.apply(null, this.clickX);
        console.log("x1:" + x1);
        var x2 = Math.min.apply(null, this.clickX);
        console.log("x2:" + x2);
        var y1 = Math.max.apply(null, this.clickY);
        console.log("y1:" + y1);
        var y2 = Math.min.apply(null, this.clickY);
        console.log("y2:" + y2);


        //draw jaw

        this.jawX[0] = x2 - this.mlcWidth / 2;
        this.selectedControlPoint.jaw_X1 = this.jawX[0];
        this.jawX[1] = x1 - this.mlcWidth / 2;
        this.selectedControlPoint.jaw_X2 = this.jawX[1];
        this.jawY[0] = this.mlcHeight / 2 - y1;
        this.selectedControlPoint.jaw_Y1 = this.jawY[0];
        this.jawY[1] = this.mlcHeight / 2 - y2;
        this.selectedControlPoint.jaw_Y2= this.jawY[1];

    }

    private zoomMlcControl(event) {
        var p = new Point();
        p.x = event.offsetX;
        p.y = event.offsetY;
        console.log("zoom mlc");
        var scaleX = 1;
        var scaleY = 1;
        if (this.pointStart.x - p.x >= 0) {
            scaleX = (this.pointStart.x - p.x) / this.mlcWidth;

        }
        else {
            scaleX = (p.x - this.pointStart.x) / this.mlcWidth;
        }
        if (this.pointStart.y - p.y >= 0) {
            scaleY = (this.pointStart.y - p.y) / this.mlcHeight;
        }
        else {
            scaleY = (p.y - this.pointStart.y) / this.mlcHeight;
        }
        console.log(scaleX);
        console.log(scaleY);
        this.mlcLeafCanvas.scale(2, 2);
        this.jawCanvas.scale(2, 2);
        this.mlc.scale(2, 2);
    }

    private panMlcControl() {
        var panX = this.counterPoints[this.counterPoints.length - 1].x - this.pointStart.x;
        var panY = this.counterPoints[this.counterPoints.length - 1].y - this.pointStart.y;
        console.log("pan mlc");

        this.mlcHeight = this.mlcContainer.height;
        this.mlcWidth = this.mlcContainer.width;
        this.radius = 50;

        this.mlc = this.canvas.nativeElement.getContext('2d');

        this.mlc.clearRect(0, 0, this.mlcWidth, this.mlcHeight);

        var leftBoundaries = [];
        var rightBoundaries = [];
        for (let index = 0; index < this.leafPositionBoundaries.length / 2; index++) {
            leftBoundaries.push(this.leafPositionBoundaries[this.leafPositionBoundaries.length / 2 - index - 1]);
            rightBoundaries.push(this.leafPositionBoundaries[this.leafPositionBoundaries.length - index - 1]);
        }
        this.leafPositionBoundaries = [];
        leftBoundaries.forEach(element => {
            this.leafPositionBoundaries.push(element);
        });
        rightBoundaries.forEach(element => {
            this.leafPositionBoundaries.push(element);
        });

        this.calculateLeafSpan();

        this.arrangLeaves();

        this.initJaws();

        this.initJawRect();

        this.drawCross();
    }

    public saveMlcAperture() {
        var controlPoint = new ControlPointDto();
        controlPoint = this.selectedControlPoint;
        this.beamServiceProxy.updateControlPoint(controlPoint)
            .pipe()
            .subscribe((result: boolean) => {
                this._updateBeamInfoService.beamInfoChanged();
                console.log("update controlpoint is success");
            })
    }

    editAperture() {
        var currentLeafShape=this.selectedControlPoint.leafPositions;//number[][]
        var leafShapes = new Array<LeafPairData>();
        for(var i=0;i<currentLeafShape.length;i++){
            var leafPair = new LeafPairData();
            leafPair.index = i+1;
            leafPair.value1 = Math.round(currentLeafShape[i][0]*10)/100;
            leafPair.value2 = Math.round(currentLeafShape[i][1]*10)/100;
            leafShapes.push(leafPair);
        }
        leafShapes.reverse();
        let modal = this._nzModalService.create({
          nzContent: EditApertureModalComponent,
          nzWidth: 1000,
          nzMaskClosable: false,
          nzTitle: this.l("Leaf Pairs"),
          nzFooter: null,
          nzClosable:true,
          nzComponentParams: {
            //controlPointsData: this.controlPointsData,
            currentLeafShape:leafShapes
          },
        });
      }


}


class rectLeaf {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public isSelected: boolean;
    public index: number;

}

class jawRect {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
}


enum EditToolOption {
    Non = 0,
    Drag = 1,
    FreeHand = 2,
    Zoom = 3,
    Pan = 4,
    Jaw = 5,
    Reset = 6,
    FlipX = 7,
    FlipY = 8
}

class Point {
    public x: number;
    public y: number;
}

class LeafPairData {
    public value1: number;
    public value2: number;
    public index: number;
}

class editInfo {

    public operation: EditToolOption;
    public isEditable:boolean;
}


