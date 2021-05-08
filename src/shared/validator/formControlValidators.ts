import {FormControl, ValidatorFn, AbstractControl} from "@angular/forms";


  //反斜杠
  export function checkBackslash(control:FormControl):any{
     if(control.value === ""){
        return null;
     }
     var myreg = /^(?!.*\\.*$)/;//反斜杠
     var valid = myreg.test(control.value);
     return valid ? null : {check:true};
     
  }

   //范围最小值
   export function checkMin(min:number):ValidatorFn{
     return (control : AbstractControl): {[key:string]:any} | null =>{
      if(control.value === ""){
        return null;
      }
      var valid = control.value >=min;
      return valid ? null : {checkMin:true};
     }
   }

    //范围最大值
    export function checkMax(max:number):ValidatorFn{
      return (control : AbstractControl): {[key:string]:any} | null =>{
      if(control.value === ""){
        return null;
      }
      var valid = control.value <=max;
      return valid ? null : {checkMax:true};
      }
    }

   //0.1精度  角度精度为1位 
   export function NumericalPrecisionOne(control: FormControl): any {
     if(control.value == null || control.value === ""){
          return null;
       }
     var reg = /^\d+(\.\d{1})?$/;
     var valid = reg.test(control.value) && control.value > 0;
     return valid ? null : { precisionOne: true };
   }
 
   //0.01精度  cm的精度为两位 剂量精度为两位
   export function  NumericalPrecisionTwo(control: FormControl): any {
     if(control.value == null || control.value === "" ){
          return null;
       }
     var reg = /^\d+(\.\d{1,2})?$/;
     var valid = reg.test(control.value) && control.value > 0;
     return valid ? null : { precisionTwo: true };
   }
 
  //常用的正则表达式： https://c.runoob.com/front-end/854
  //自定义验证器，正整数
  export function onlyPositiveIntegerCheck(control: FormControl): any {
     if(control.value == null || control.value === ""){
          return null;
       }
     var myreg = /^[0-9]*$/;
     var valid = myreg.test(control.value);
     return valid ? null : { onlyNumber: true };//返回null代表校验通过
   }
 
   //自定义验证器，0.1精度 正负数
   export function onlyFloatCheck1(control: FormControl): any {
     if(control.value == null || control.value === ""){
          return null;
       }
     var myreg = /^(\-)?\d+(\.\d{1})?$/;
     var valid = myreg.test(control.value);
     return valid ? null : { onlyFloat: true };
   }
 
   //自定义验证器，0.1精度 非负数
   export function onlyPositiveFloatCheck1(control: FormControl): any {
     if(control.value == null || control.value === ""){
          return null;
       }
     var myreg = /^\d+(\.\d{1})?$/;
     var valid = myreg.test(control.value);
     return valid ? null : { onlyFloat: true };
   }
 
   //自定义验证器，0.01精度 正负数
   export function  onlyFloatCheck2(control: FormControl): any {
     if(control.value == null || control.value === ""){
          return null;
       }
     var myreg = /^(\-)?\d+(\.\d{1,2})?$/;
     var valid = myreg.test(control.value);
     return valid ? null : { onlyFloat: true };
   }
 
   //自定义验证器，0.01精度 非负数
   export function  onlyPositiveFloatCheck2(control: FormControl): any {
     if(control.value == null || control.value === ""){
          return null;
       }
     var myreg = /^\d+(\.\d{1,2})?$/;
     var valid = myreg.test(control.value);
     return valid ? null : { onlyFloat: true };
   }
 
   //自定义验证器，正数  零
   export function onlyPositiveNumberCheck(control: FormControl): any {
     if(control.value == null || control.value === ""){
          return null;
       }
     var myreg = /^(\+)?\d+(\.\d+)?$/;
     var valid = myreg.test(control.value);
     return valid ? null : { onlyFloat: true };
   }
 
   //自定义验证器，正数 负数 零
   export function onlyNumberCheck(control: FormControl): any {
     if(control.value == null || control.value === ""){
          return null;
       }
     var myreg = /^(\-|\+)?\d+(\.\d+)?$/;
     var valid = myreg.test(control.value);
     return valid ? null : { onlyFloat: true };
   }
