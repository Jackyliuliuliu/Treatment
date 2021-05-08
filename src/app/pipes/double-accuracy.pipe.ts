import { Pipe, PipeTransform } from "@angular/core";

@Pipe({name:'doubleAccuracy'})
export class DoubleAccuracyPipe implements PipeTransform {
    transform(value: number, accuracy:number) {
        return DoubleAccuracy.FomatDoubleWithAccuracy(value, accuracy);
    }
}

export class DoubleAccuracy {
    static FomatDoubleWithAccuracy(value: number, accuracy: number) : number {
        if (value === undefined || accuracy === undefined){
            return undefined;
        }

        if (isNaN(value) || isNaN(accuracy))
        {
            return undefined;
        }

        let power = Math.pow(10,accuracy);
        value = Math.round(value*power)/power;
        return value;
    }
}