import { Directive, Input } from "@angular/core";
import { NG_VALIDATORS, Validator, FormControl, AbstractControl } from "@angular/forms";
import {checkBackslash,onlyPositiveFloatCheck2,onlyPositiveFloatCheck1,checkMin,checkMax,onlyFloatCheck2} from "@shared/validator/formControlValidators"


@Directive({
     selector: '[checkBackslash][ngModel]',
     providers: [{provide:NG_VALIDATORS , useValue: checkBackslash, multi: true}]
})
export class CheckBlackslashDirective{}


@Directive({
   selector: '[onlyFloatCheck2][ngModel]',
   providers: [{provide:NG_VALIDATORS , useValue: onlyFloatCheck2, multi: true}]
})
export class CheckFloatCheck2{}

@Directive({
   selector: '[onlyPositiveFloatCheck2][ngModel]',
   providers: [{provide:NG_VALIDATORS , useValue: onlyPositiveFloatCheck2, multi: true}]
})
export class CheckPositiveFloatCheck2{}

@Directive({
   selector: '[onlyPositiveFloatCheck1][ngModel]',
   providers: [{provide:NG_VALIDATORS , useValue: onlyPositiveFloatCheck1, multi: true}]
})
export class CheckPositiveFloatCheck1{}

@Directive({
   selector: '[checkMin][ngModel]',
   providers: [{provide:NG_VALIDATORS , useExisting: CheckMinValidator, multi: true}]
})
export class CheckMinValidator implements Validator {
  @Input('checkMin')
  checkMin : number;

  validate(control: AbstractControl): {[key: string]: any} | null {
   return this.checkMin ? checkMin(this.checkMin)(control) : null;
 }
}

@Directive({
   selector: '[checkMax][ngModel]',
   providers: [{provide:NG_VALIDATORS , useExisting: CheckMaxValidator, multi: true}]
})
export class CheckMaxValidator implements Validator {
  @Input('checkMax')
  checkMax : number;

  validate(control: AbstractControl): {[key: string]: any} | null {
   return this.checkMax ? checkMax(this.checkMax)(control) : null;
 }
}