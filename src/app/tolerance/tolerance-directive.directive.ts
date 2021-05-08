import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appToleranceDirective]'
})
export class ToleranceDirectiveDirective {
  constructor(private el: ElementRef) {
  }

  @HostListener('blur') onBlur() {

    if (this.el.nativeElement.value == "") {
      return;
    }
    //这里响应input失焦事件，目的是为了实现输入1失焦后变为1.0的效果；
    if (this.el.nativeElement.attributes[2].nodeValue == "gantryAngle" || this.el.nativeElement.attributes[2].nodeValue == "beamLimitingDeviceAngle" || this.el.nativeElement.attributes[2].nodeValue == "patientSupportAngle") {
      //0.1
      var myreg = /^[0-9]*$/;
      if (myreg.test(this.el.nativeElement.value)) {
        this.el.nativeElement.value = parseInt(this.el.nativeElement.value).toFixed(1);
      }
    }
    else {
      //0.01
      var myreg = /^[0-9]*$/;
      if (myreg.test(this.el.nativeElement.value)) {
        this.el.nativeElement.value = parseInt(this.el.nativeElement.value).toFixed(2);
      }
    }
  }
}
